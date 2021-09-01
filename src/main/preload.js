const { contextBridge, ipcRenderer } = require('electron');
const ElectronStore = require('electron-store');

const invokeChannels = [
  'report_fetch_ref',
  'authenticate',
  'change-admin-password',
  'kot_fetchItems',
  'kot_fetchOpenOrdersInfo',
  'kot_addItemToNewOrder',
  'kot_addItemToExistingOrder',
  'kot_cancelItem',
  'kot_printed',
  'kot_printReport',
  'kot_fetchNextKotNumber',
  'bill_fetchCounter',
  'bill_generate',
  'bill_fetchPendingBillsInfo',
  'bill_clear_pending',
  'bill_get_duplicate',
  'bill_print_duplicate',
  'bill_submitToRoom',
  'fetchItemsView',
  'fetchItemCategories',
  'insertItem',
  'updateItem',
  'deleteItem',
  'report_clearance',
  'report_fetch_ref',
  'report_fetch_void_report',
  'report_consolidated_report',
  'report_item_wise_report',
  'report_closed_pending_report',
  'report_closed_open_report',
  'report_to_pdf',
  'email_pdf_report',
];

const store = new ElectronStore();

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on(channel, func) {
      const validChannels = [
        'bryo-auth-get-header',
        'bryo-auth-post-header',
        'kot_updated',
        'kot_pending_bills_updated',
      ];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    once(channel, func) {
      const validChannels = ['ipc-example'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
    invoke(channel, ...args) {
      if (invokeChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        return ipcRenderer.invoke(channel, ...args);
      }
      return new Promise((resolve, reject) => {
        reject(Error('Invalid Channel'));
      });
    },
  },
  store: {
    get: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
  },
});
