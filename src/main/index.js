'use strict';

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
import initProgressTray from './progressTray';

const isDevelopment = process.env.NODE_ENV !== 'production';

app.dock.hide();

app.disableHardwareAcceleration();

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;

function createMainWindow() {
  const win = new BrowserWindow({
    title: app.name,
    show: false,
    frame: false,
    width: 140,
    height: 150,
    webPreferences: { nodeIntegration: true }
  });

  initProgressTray(win);

  if (isDevelopment) {
    win.webContents.openDevTools();
  }

  if (isDevelopment) {
    win.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
  } else {
    win.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
      })
    );
  }

  win.on('closed', () => {
    mainWindow = null;
  });

  // win.on('ready-to-show', () => {
  //   mainWindow.show();
  // });

  win.on('blur', () => {
    mainWindow.hide();
  });

  win.webContents.on('devtools-opened', () => {
    win.focus();
    setImmediate(() => {
      win.focus();
    });
  });

  return win;
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
});
