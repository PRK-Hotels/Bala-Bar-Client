import { ipcMain } from 'electron';
import * as crypto from 'crypto';

import { authDB } from '../db';
import { AdminPasswordDoc } from '../../shared';
import { signGetRequest, signPostRequest } from '../util/aws-signature';

const AuthChannel = (): void => {
  ipcMain.handle('authenticate', async (event: any, arg: string) => {
    try {
      console.log('Input Password: ', arg);
      const res = await authDB?.get<AdminPasswordDoc>('admin-password');
      const status =
        res?.password_hash ===
        crypto.createHash('md5').update(arg).digest('hex');
      return { loggedIn: status, msg: null };
    } catch (err) {
      if (err.name === 'not_found') {
        try {
          const adminPassword: AdminPasswordDoc = {
            _id: 'admin-password',
            password_hash: crypto
              .createHash('md5')
              .update('123456')
              .digest('hex'),
            _rev: '',
          };

          await authDB?.put(adminPassword);
          return { loggedIn: true, msg: null };
        } catch (outerErr: any) {
          console.log('Error: ', outerErr);
          return { loggedIn: false, msg: outerErr };
        }
      }
      return '';
    }
  });

  ipcMain.handle(
    'change-admin-password',
    async (event: any, arg: { curPassword: string; newPassword: string }) => {
      try {
        console.log('Cur Password: ', arg.curPassword);
        console.log('New Password: ', arg.newPassword);
        const actualPassword = await authDB?.get<AdminPasswordDoc>(
          'admin-password'
        );

        if (
          actualPassword &&
          actualPassword.password_hash ===
            crypto.createHash('md5').update(arg.curPassword).digest('hex')
        ) {
          await authDB?.put({
            _id: 'admin-password',
            password_hash: crypto
              .createHash('md5')
              .update(arg.newPassword)
              .digest('hex'),
            // eslint-disable-next-line no-underscore-dangle
            _rev: actualPassword._rev,
          });
          return {};
        }
        return {
          err: { msg: 'Invalid Current Password', code: -1 },
        };
      } catch (err) {
        console.log('Error: ', err);
        return { err: { msg: 'Unknown Error', code: -2 } };
      }
    }
  );

  // ------------------------------------------------------------ BRYO AUTH HEADERS ------------------------------------------------------------
  ipcMain.on(
    'bryo-auth-get-header',
    async (event: any, arg: { path: string }) => {
      try {
        const headers = signGetRequest(arg.path);
        event.returnValue = headers;
      } catch (err) {
        event.returnValue = { err: { msg: 'Unknown Error', code: -2 } };
        console.log('Error: ', err);
      }
    }
  );

  ipcMain.on(
    'bryo-auth-post-header',
    async (
      event: any,
      arg: { path: string; body: string; contentType: string }
    ) => {
      try {
        const headers = signPostRequest(arg.path, arg.body, arg.contentType);
        event.returnValue = headers;
      } catch (err) {
        event.returnValue = { err: { msg: 'Unknown Error', code: -2 } };
        console.log('Error: ', err);
      }
    }
  );
};

export default AuthChannel;
