/* eslint-disable @typescript-eslint/no-unused-vars */
import { ipcMain } from 'electron';
import moment from 'moment';
import axios from 'axios';
import ElectronStore from 'electron-store';

import {
  BillAmountInfo,
  OriginalBillInfo,
  KotItemInfo,
  PendingBillInfo,
} from '../../shared';
import { printBill, printDuplicateBill } from '../util/printer';
import {
  ItemPrintAggregator,
  ItemPrintDupAggregator,
} from '../util/aggregator';
import { signPostRequest } from '../util/aws-signature';
import { DBx } from '../db';
import { IOx } from '../socket';

const store = new ElectronStore();

const BillChannel = () => {
  ipcMain.handle('bill_fetchCounter', async (_event: unknown) => {
    try {
      if (DBx) {
        const res = await DBx('bill_counter').where('id', 1);
        return res[0].next_value;
      }
      console.log('DBx Not Initialized');
      return {};
    } catch (err) {
      console.log('Error: ', err);
      return {};
    }
  });

  ipcMain.handle(
    'bill_generate',
    async (
      event: any,
      arg: {
        printBill: boolean;
        billNo: number;
        orderId: number;
        tableNo: number;
        items: KotItemInfo[];
        billAmountInfo: BillAmountInfo;
      }
    ) => {
      let trx = null;
      if (DBx) {
        try {
          trx = await DBx.transaction();
          await trx('bill_counter')
            .where('id', 1)
            .update({
              next_value: arg.billNo + 1,
              updated_at: DBx.fn.now(),
            });

          await trx('kot_orders_txn').where('id', arg.orderId).update({
            status: 'Pending',
            updated_at: DBx.fn.now(),
          });

          const billDate = moment().format('DD-MM-YYYY');
          const billTime = moment().format('h:mm:ss a');
          const clientName: string = (store.get('ClientName') as string) || '';

          let billPrefix = '';
          if (clientName === 'Restaurant' || clientName === 'Reception') {
            billPrefix = 'R';
          } else if (
            clientName === 'Room Service' ||
            clientName === 'RoomService'
          ) {
            billPrefix = 'RS';
          } else if (clientName === 'Rock Garden') {
            billPrefix = 'RG';
          }

          // TODO: To be automated in future based on the running year.
          const billSuffix = '21/22';
          const billId = `${billPrefix}${arg.billNo}-${billSuffix}`;

          await trx('billing_txn').insert({
            bill_no: arg.billNo,
            bill_suffix: billSuffix,
            bill_prefix: billPrefix,
            bill_id: billId,
            order_id: arg.orderId,
            bill_date: billDate,
            bill_time: billTime,
            bill_total: arg.billAmountInfo.total,
            pre_discount_food_total: arg.billAmountInfo.preDiscountFoodTotal,
            tax_on_food: arg.billAmountInfo.taxOnFood,
            liquor_amount: arg.billAmountInfo.liquorAmount,
            beer_amount: arg.billAmountInfo.beerAmount,
            discount_percent: arg.billAmountInfo.discountPercent,
            discount_amount: arg.billAmountInfo.discountAmount,
            non_taxable_amount: arg.billAmountInfo.nonTaxableAmount,
            taxable_amount: arg.billAmountInfo.taxableAmount,
            cgst_amount: arg.billAmountInfo.cgstAmount,
            sgst_amount: arg.billAmountInfo.sgstAmount,
            total_tax_amount: arg.billAmountInfo.totalTaxAmount,
            grand_total: arg.billAmountInfo.grandTotal,
          });

          // IOx?.emit('UI_EVENT', { channel: 'kot_pending_bills_updated' });

          if (arg.printBill) {
            try {
              const foodItems = arg.items.filter(
                (i) => i.itemGstCategory === 'General'
              );
              const nonFoodItems = arg.items.filter(
                (i) => i.itemGstCategory !== 'General'
              );
              const agFoodItems = ItemPrintAggregator(foodItems);
              const agNonFoodItems = ItemPrintAggregator(nonFoodItems);
              const printer = printBill(
                billId,
                arg.tableNo,
                billDate,
                billTime,
                agFoodItems,
                agNonFoodItems,
                arg.billAmountInfo
              );
              const isConnected = await printer.isPrinterConnected();
              if (isConnected) {
                printer.execute();
                console.log('Print Successful');
                trx.commit();
                return undefined;
              }
              console.log('Printer Not Connected');
              trx.rollback();
              return { msg: 'Printer not connected' };
            } catch (printError) {
              console.log(printError);
              trx.rollback();
              return { msg: 'Print Error' };
            }
          } else {
            trx.commit();
            return undefined;
          }
        } catch (err) {
          if (trx) {
            trx.rollback();
          }
          console.log('Error 2: ', err);
          return { msg: 'Unknown Error' };
        }
      } else {
        console.log('DBx Not Initialized');
        return { msg: 'DB Error' };
      }
    }
  );

  // ------------------------------------------------------------ PENDING BILL ------------------------------------------------------------

  ipcMain.handle('bill_fetchPendingBillsInfo', async (event: any) => {
    try {
      if (DBx) {
        const res1 = await DBx('bill_pending_view');
        const mappedPBills = res1.map((i) =>
          PendingBillInfo(
            i.bill_id,
            i.bill_no,
            i.captain_name,
            i.table_number,
            i.order_type,
            i.order_id,
            i.bill_total,
            i.grand_total
          )
        );

        return mappedPBills || [];
      }
      console.log('DBx Not Initialized');
      return {};
    } catch (err) {
      console.log('Error 2: ', err);
      return {};
    }
  });

  ipcMain.handle(
    'bill_clear_pending',
    async (
      event: any,
      arg: {
        tableNo: number;
        billNo: number;
        billId: string;
        payMode: string;
        orderId: number;
      }
    ) => {
      if (DBx) {
        const trx = await DBx.transaction();
        try {
          await trx('kot_orders_txn').where('id', arg.orderId).update({
            status: 'Billed',
            updated_at: DBx.fn.now(),
          });

          await trx('payment_txn').insert({
            table_no: arg.tableNo,
            bill_no: arg.billNo,
            bill_id: arg.billId,
            payment_type: arg.payMode,
            order_id: arg.orderId,
          });

          trx.commit();
          // IOx?.emit('UI_EVENT', { channel: 'kot_pending_bills_updated' });
          return undefined;
        } catch (err) {
          trx.rollback();
          console.log('Error 2: ', err);
          return {};
        }
      } else {
        console.log('DBx Not Initialized');
        return {};
      }
    }
  );

  ipcMain.handle(
    'bill_get_duplicate',
    async (event: any, arg: { billId: string }) => {
      try {
        if (DBx) {
          const res = await DBx('bill_history_view').where(
            'bill_id',
            arg.billId
          );

          // console.log(res);
          const mappedRes = res.map((i) => {
            const originalBillInfo = OriginalBillInfo(
              i.bill_date,
              i.bill_time,
              i.order_id,
              i.captain_name,
              i.table_number
            );

            const billAmountInfo = BillAmountInfo(
              i.bill_total,
              i.pre_discount_food_total,
              i.tax_on_food,
              i.liquor_amount,
              i.beer_amount,
              i.discount_percent,
              i.discount_amount,
              i.non_taxable_amount,
              i.taxable_amount,
              i.cgst_amount,
              i.sgst_amount,
              i.total_tax_amount,
              i.grand_total
            );

            return {
              billAmountInfo,
              originalBillInfo,
            };
          });

          if (mappedRes.length > 0) {
            const billItems = await DBx('kot_items_txn')
              .where('order_id', mappedRes[0].originalBillInfo.orderId)
              .andWhere('cancelled', false);

            const agItems = ItemPrintDupAggregator(billItems);
            const returnObj = { ...mappedRes[0], itemsInfo: agItems };
            return returnObj;
          }
          console.log('Invalid Bill Number');
          return {};
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
    'bill_print_duplicate',
    async (event: any, arg: { billId: string }) => {
      try {
        if (DBx) {
          const res = await DBx('bill_history_view').where(
            'bill_id',
            arg.billId
          );

          // console.log(res);
          const mappedRes = res.map((i) => {
            const originalBillInfo = OriginalBillInfo(
              i.bill_date,
              i.bill_time,
              i.order_id,
              i.captain_name,
              i.table_number
            );

            const billAmountInfo = BillAmountInfo(
              i.bill_total,
              i.pre_discount_food_total,
              i.tax_on_food,
              i.liquor_amount,
              i.beer_amount,
              i.discount_percent,
              i.discount_amount,
              i.non_taxable_amount,
              i.taxable_amount,
              i.cgst_amount,
              i.sgst_amount,
              i.total_tax_amount,
              i.grand_total
            );

            return {
              billAmountInfo,
              originalBillInfo,
            };
          });

          if (mappedRes.length > 0) {
            const ogInfo = mappedRes[0].originalBillInfo;
            const billAI = mappedRes[0].billAmountInfo;

            const billItems = await DBx('kot_items_txn')
              .where('order_id', ogInfo.orderId)
              .andWhere('cancelled', false);

            const agFoodItems = ItemPrintDupAggregator(
              billItems.filter((i) => i.gst_category === 'General')
            );
            const agNonFoodItems = ItemPrintDupAggregator(
              billItems.filter((i) => i.gst_category !== 'General')
            );
            try {
              const printer = printDuplicateBill(
                arg.billId,
                ogInfo.tableNumber,
                ogInfo.billDate,
                ogInfo.billTime,
                agFoodItems,
                agNonFoodItems,
                billAI
              );
              const isConnected = await printer.isPrinterConnected();
              if (isConnected) {
                printer.execute();
                console.log('Print Successful');
                return undefined;
              }
              console.log('Printer Not Connected');
              return { msg: 'Printer not connected' };
            } catch (printError) {
              console.log(printError);
              return { msg: 'Print Error' };
            }
          }
          return undefined;
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
    'bill_submitToRoom',
    async (event: any, arg: { billInfo: PendingBillInfo; roomNo: number }) => {
      if (DBx) {
        const trx = await DBx.transaction();
        try {
          const { orderId } = arg.billInfo;

          const billItemInfo = await trx('kot_items_txn')
            .where('order_id', orderId)
            .andWhere('cancelled', false);

          const billTxnInfo = await trx('billing_txn').where(
            'order_id',
            orderId
          );

          await trx('kot_orders_txn').where('id', orderId).update({
            status: 'Billed',
            updated_at: DBx.fn.now(),
          });

          await trx('payment_txn').insert({
            table_no: arg.billInfo.tableNumber,
            bill_no: arg.billInfo.billNo,
            bill_id: arg.billInfo.billId,
            payment_type: 'RoomAccount',
            order_id: orderId,
            room_no: arg.roomNo,
          });

          const clientName = store.get('ClientName') || '';
          const authEnabled = store.get('AuthEnabled') || false;
          const serverIp = store.get('ServerIP') || '';
          const apiPath = '/api/restaurant/processBill';

          const postBody = {
            billInfo: billTxnInfo,
            roomNo: arg.roomNo,
            itemsInfo: billItemInfo,
            clientName,
          };

          let headers = {};
          if (authEnabled) {
            headers = signPostRequest(
              apiPath,
              JSON.stringify(postBody),
              'application/json'
            );
          }

          const res = await axios.post(`${serverIp}${apiPath}`, postBody, {
            headers,
          });
          if (res.status === 200) {
            trx.commit();
            console.log(res.data);
            return {};
          }
          trx.rollback();
          console.log(res.status);
          return { err: res.data };
        } catch (err) {
          trx.rollback();
          console.log('Error 2: ', err);
          return { err: 'Unknown error occurred' };
        }
      } else {
        console.log('DBx Not Initialized');
        return {};
      }
    }
  );
};

export default BillChannel;
