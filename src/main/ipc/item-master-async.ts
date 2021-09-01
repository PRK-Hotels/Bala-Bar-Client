import { ipcMain } from 'electron';

import { DBx } from '../db';
import { GstCategory, Item } from '../../shared';

const ItemMasterChannel = () => {
  ipcMain.handle('fetchItemsView', async (event: any) => {
    try {
      if (DBx) {
        const itemsRes = await DBx.select().from('kot_items_view');
        const items = itemsRes.map((i) =>
          Item(i.name, i.code, i.rate, i.category, i.gst_percent)
        );
        return { items };
      }
      console.log('DBx Not Initialized');
      return [];
    } catch (err) {
      console.log('Error 2: ', err);
      return [];
    }
  });

  ipcMain.handle('fetchItemCategories', async (event: any) => {
    try {
      if (DBx) {
        const gstCategories = await DBx.select().from('gst_ref');
        return { gst_categories: gstCategories };
      }
      console.log('DBx Not Initialized');
      return [];
    } catch (err) {
      console.log('Error 2: ', err);
      return [];
    }
  });

  ipcMain.handle('insertItem', async (event: any, arg: Item) => {
    try {
      console.log('To add', arg);
      if (DBx) {
        const res = await DBx('items_list').insert(arg);

        console.log(res);
        return res;
      }
      console.log('DBx Not Initialized');
      return {};
    } catch (err) {
      return err;
    }
  });

  ipcMain.handle('updateItem', async (event: any, arg: Item) => {
    try {
      console.log('To Update', arg);
      if (DBx) {
        const res = await DBx('items_list').where({ code: arg.code }).update({
          name: arg.name,
          rate: arg.rate,
          updated_at: DBx.fn.now(),
        });
        console.log(res);
        return res;
      }
      console.log('DBx Not Initialized');
      return {};
    } catch (err) {
      return err;
    }
  });

  ipcMain.handle('deleteItem', async (event: any, arg: string) => {
    try {
      console.log('Item code to delete', arg);
      if (DBx) {
        const res = await DBx('items_list').where({ code: arg }).delete();
        console.log(res);
        return res;
      }
      console.log('DBx Not Initialized');
      return {};
    } catch (err) {
      return err;
    }
  });
};

export default ItemMasterChannel;
