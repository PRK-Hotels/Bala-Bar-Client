import { ipcMain } from 'electron';

import { DBx } from '../db';
import { IOx } from '../socket';
import { Item, OpenOrderItemType, KotItemInfo } from '../../shared';
import { ItemPrintAggregator, ItemReportAggregator } from '../util/aggregator';

import { printKot, printVoidKot, printKotReport } from '../util/printer';

const KotChannel = () => {
  ipcMain.handle('kot_fetchItems', async (_event: any) => {
    try {
      if (DBx) {
        const itemsRes = await DBx.select().from('kot_items_view');
        const items = itemsRes.map((i) =>
          Item(i.name, i.code, i.rate, i.category, i.gst_percent)
        );

        return items;
      }
      console.log('DBx Not Initialized');
      return [];
    } catch (err) {
      console.log('Error 2: ', err);
      return [];
    }
  });

  ipcMain.handle('kot_fetchOpenOrdersInfo', async (event: any) => {
    try {
      if (DBx) {
        const orderItems = await DBx.select().from('kot_open_orders_view');
        const mappedOrderItems = orderItems.map((i) => KotItemInfo(i));
        return mappedOrderItems;
      }
      console.log('DBx Not Initialized');
      return [];
    } catch (err) {
      console.log('Error: ', err);
      return [];
    }
  });

  ipcMain.handle(
    'kot_addItemToNewOrder',
    async (
      _event: unknown,
      arg: {
        item: Item;
        kotNo: number;
        tableNo: number;
        qty: number;
        captainName: string;
        reportId: number;
        reportDate: string;
      }
    ) => {
      try {
        if (DBx) {
          await DBx.transaction(async (trx) => {
            try {
              const ids = await trx('kot_orders_txn').insert(
                {
                  captain_name: arg.captainName,
                  table_number: arg.tableNo,
                  order_type: 'Dine-in',
                  status: 'Open',
                  report_id: arg.reportId,
                  report_date: arg.reportDate,
                  kot_no: arg.kotNo,
                },
                'id'
              );

              const kotNumberInc = await trx('kot_print_counter')
                .where('id', 1)
                .update({
                  next_value: arg.kotNo + 1,
                  updated_at: trx.fn.now(),
                });

              console.log(`Kot Incremented: ${kotNumberInc}`);
              console.log(ids[0]);

              const item = [
                {
                  order_id: ids[0],
                  item_name: arg.item.name,
                  item_code: arg.item.code,
                  quantity: arg.qty,
                  rate: arg.item.rate,
                  total: arg.qty * arg.item.rate,
                  gst_category: arg.item.category,
                  gst_percent: arg.item.gstPercent,
                },
              ];
              const inserts = await trx('kot_items_txn').insert(item);

              // Return inserted item info along with the new order id.
              if (inserts.length > 0) {
                console.log(`${inserts[0]} new items saved.`);
                await trx.commit();
                IOx?.emit('UI_EVENT', { channel: 'kot_updated' });
                return {
                  item: item[0],
                  item_id: inserts[0],
                  order_id: ids[0],
                };
              }
              await trx.rollback();
              return {};
            } catch (err: unknown) {
              console.log(err);
              return {};
            }
          });
        } else {
          console.log('DBx Not Initialized');
          return {};
        }
      } catch (err) {
        console.log('Error 2: ', err);
        return {};
      }
      return '';
    }
  );

  ipcMain.handle(
    'kot_addItemToExistingOrder',
    // eslint-disable-next-line consistent-return
    async (
      _event: unknown,
      arg: { item: Item; qty: number; orderId: number }
    ) => {
      try {
        if (DBx) {
          await DBx.transaction(async (trx) => {
            try {
              const item = [
                {
                  order_id: arg.orderId,
                  item_name: arg.item.name,
                  item_code: arg.item.code,
                  quantity: arg.qty,
                  rate: arg.item.rate,
                  total: arg.qty * arg.item.rate,
                  gst_category: arg.item.category,
                  gst_percent: arg.item.gstPercent,
                },
              ];
              const inserts = await trx('kot_items_txn').insert(item);

              // Return inserted item info along with the new order id.
              if (inserts.length > 0) {
                console.log(`${inserts[0]} new items saved.`);
                await trx.commit();
                IOx?.emit('UI_EVENT', { channel: 'kot_updated' });
                return {
                  item: item[0],
                  item_id: inserts[0],
                  order_id: arg.orderId,
                };
              }
              await trx.rollback();
              return {};
            } catch (err: any) {
              console.log(err);
              return {};
            }
          });
        } else {
          console.log('DBx Not Initialized');
          return {};
        }
      } catch (err) {
        console.log('Error 2: ', err);
        return {};
      }
      return '';
    }
  );

  ipcMain.handle(
    'kot_cancelItem',
    async (event: any, arg: { itemId: number; orderId: number }) => {
      try {
        if (DBx) {
          const res = await DBx('kot_items_txn').where({
            id: arg.itemId,
            order_id: arg.orderId,
          });

          console.log(res);
          console.log('PRINTED: ', res[0].printed);

          const innerRes = await DBx('kot_items_txn')
            .where({
              id: arg.itemId,
              order_id: arg.orderId,
            })
            .update({
              cancelled: true,
              printed: false,
              voided: res[0].printed === 1,
              updated_at: DBx.fn.now(),
            });

          IOx?.emit('UI_EVENT', { channel: 'kot_updated' });
          return innerRes;
        }

        console.log('DBx Not Initialized');
        return {};
      } catch (err) {
        console.log('Error 2: ', err);
        return {};
      }
    }
  );

  ipcMain.handle(
    'kot_printed',
    async (
      event: any,
      arg: {
        captainName: string;
        items: KotItemInfo[];
        tableNumber: number;
        isVoidKot: boolean;
      }
    ) => {
      try {
        if (DBx) {
          const itemIds = arg.items.reduce((obj, i) => {
            obj.push(i.itemId);
            return obj;
          }, Array<number>());
          const trx = await DBx.transaction();
          const dbRes = await trx('kot_items_txn')
            .whereIn('id', itemIds)
            .update({
              printed: true,
              updated_at: DBx.fn.now(),
            });

          if (arg.isVoidKot) {
            try {
              const itemsInfo = ItemPrintAggregator(arg.items);
              const printer = printVoidKot(arg.tableNumber, itemsInfo);
              const isConnected = await printer.isPrinterConnected();
              if (isConnected) {
                await printer.execute();
                await trx.commit();
                console.log(dbRes);
                console.log(
                  'Print Successful:Transaction: ',
                  trx.isCompleted()
                );
                IOx?.emit('UI_EVENT', { channel: 'kot_updated' });
                return {};
              }
              console.log('Printer Not Connected');
              await trx.rollback();
              return {};
            } catch (printError) {
              console.log(printError);
              await trx.rollback();
              return {};
            }
          } else {
            try {
              const agItemsInfo = ItemPrintAggregator(arg.items);
              const printer = printKot(
                arg.captainName,
                arg.items[0].orderKotNo,
                arg.tableNumber,
                agItemsInfo
              );
              const isConnected = await printer.isPrinterConnected();
              if (isConnected) {
                printer.execute();
                await trx.commit();
                console.log(
                  'Print Successful: Transaction: ',
                  trx.isCompleted()
                );
                IOx?.emit('UI_EVENT', { channel: 'kot_updated' });
                return {};
              }
              console.log('Printer Not Connected');
              await trx.rollback();
              return {};
            } catch (printError) {
              console.log(printError);
              await trx.rollback();
              return {};
            }
          }
        } else {
          console.log('DBx Not Initialized');
          return {};
        }
      } catch (err) {
        console.log('Error 2: ', err);
        return {};
      }
    }
  );

  ipcMain.handle(
    'kot_printReport',
    async (event: any, arg: { orderNo: number; tableNumber: number }) => {
      try {
        if (DBx) {
          const orderItems: OpenOrderItemType[] = await DBx.select()
            .from('kot_open_orders_view')
            .where('order_id', arg.orderNo);

          if (orderItems && orderItems.length > 0) {
            const aggregateItems = ItemReportAggregator(orderItems);
            try {
              const printer = printKotReport(aggregateItems, arg.tableNumber);
              const isConnected = await printer.isPrinterConnected();
              if (isConnected) {
                printer.execute();
                console.log('Print Successful');
              } else {
                console.log('Printer Not Connected');
              }
              return {};
            } catch (printError) {
              console.log(printError);
              return {};
            }
          } else {
            return { msg: 'Could not fetch report info' };
          }
        } else {
          console.log('DBx Not Initialized');
          return {};
        }
      } catch (err) {
        console.log('Error 2: ', err);
        return {};
      }
    }
  );

  ipcMain.handle('kot_fetchNextKotNumber', async (event: any) => {
    try {
      if (DBx) {
        const res = await DBx('kot_print_counter').where('id', 1);
        return res[0].next_value;
      }
      console.log('DBx Not Initialized');
      return {};
    } catch (err) {
      console.log('Error 2: ', err);
      return {};
    }
  });
};

export default KotChannel;
