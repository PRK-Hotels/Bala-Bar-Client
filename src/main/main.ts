/* eslint-disable promise/no-nesting */
/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import fs from 'fs';

import { app, BrowserWindow, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

import knex from 'knex';
import PouchDB from 'pouchdb';
import * as SocketIO from 'socket.io';
import { io } from 'socket.io-client';

import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { setAuthDb, setDBx } from './db';
import { setSocket } from './socket';
import InitMain from './ipc';
import config from './config.json';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const dbDir = path.join(app.getPath('userData'), 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const dbPath = path.join(dbDir, 'master.db');
const authDbPath = path.join(dbDir, 'auth');

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  console.log('DBPath: ', dbPath);
  console.log('AuthDBPath: ', authDbPath);
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const { ioConfig } = config.Bala;
if (ioConfig.serverMode) {
  const sIO = new SocketIO.Server({
    cors: {
      origin: '*',
    },
  });

  sIO.on('connection', (socket) => {
    setSocket(socket);

    socket.on('UI_EVENT', ({ channel }) => {
      mainWindow?.webContents.send(channel);
    });

    socket.on('disconnect', () => {
      setSocket(undefined);
      console.log('Disconnected!');
    });
  });

  sIO.listen(ioConfig.port);
} else {
  const socket = io(`ws://${ioConfig.host}:${ioConfig.port}`);
  setSocket(socket);

  socket.on('connect', () => {
    console.log('Connected');
  });

  socket.on('UI_EVENT', ({ channel }) => {
    // console.log(channel);
    mainWindow?.webContents.send(channel);
  });
}

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  // Init Databases
  const { dbConfig } = config.Bala;
  setAuthDb(new PouchDB(authDbPath));
  setDBx(
    knex({
      client: 'mysql2',
      connection: {
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
      },
    })
  );

  // Create necessary tables for ItemsDBx
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  InitMain();

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/main/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
