const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Data directory: %APPDATA%/SchoolERP on Windows — survives app updates
function getDataDir() {
  const dir = path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getDbPath() {
  return path.join(getDataDir(), 'school.db');
}

function getConfigPath() {
  return path.join(getDataDir(), 'config.json');
}

function getLogDir() {
  const dir = path.join(app.getPath('userData'), 'logs');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getBackupDir() {
  const dir = path.join(getDataDir(), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getUploadsDir() {
  const dir = path.join(getDataDir(), 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = {
  getDataDir, getDbPath, getConfigPath, getLogDir,
  getBackupDir, getUploadsDir
};