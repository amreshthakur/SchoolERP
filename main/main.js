const { app, BrowserWindow } = require('electron');
const path = require('path');
const { registerIpc } = require('./ipc');
const { createMainWindow, createSetupWindow } = require('./windows/mainWindow');
const { runMigrations, seedBaseline } = require('../database/migrate');
const setupService = require('../services/setup.service');
const db = require('../database/db');
const logger = require('../utils/logger');

let mainWindow = null;
let setupWindow = null;

function startWindow() {
  if (setupService.isConfigured()) {
    mainWindow = createMainWindow();
  } else {
    setupWindow = createSetupWindow();
    // After setup completes, swap to main window.
    require('electron').ipcMain.handle('setup:openMain', () => {
      if (setupWindow) { setupWindow.close(); setupWindow = null; }
      if (!mainWindow) mainWindow = createMainWindow();
    });
  }
}

app.whenReady().then(() => {
  try {
    db.open();
    runMigrations();
    seedBaseline();
    logger.info('Startup complete');
  } catch (err) {
    logger.error('Startup failed', { message: err.message });
  }
  registerIpc();
  startWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) startWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  try { db.close(); } catch (_) {}
});