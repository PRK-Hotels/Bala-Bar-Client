import { ipcMain } from 'electron';

const UtilsMasterChannel = () => {
  ipcMain.on('online-status-changed', (event, status) => {
    console.log(status);
  });
};

export default UtilsMasterChannel;
