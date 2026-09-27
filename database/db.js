const Database = require('better-sqlite3');
const { getDbPath } = require('../utils/paths');
const logger = require('../utils/logger');

let db = null;

function open() {
  if (db) return db;
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  logger.info('Database opened', { path: dbPath });
  return db;
}

function close() {
  if (db) { db.close(); db = null; }
}

function run(sql, params = []) {
  return open().prepare(sql).run(params);
}

function get(sql, params = []) {
  return open().prepare(sql).get(params);
}

function all(sql, params = []) {
  return open().prepare(sql).all(params);
}

function tx(fn) {
  return open().transaction(fn)();
}

module.exports = { open, close, run, get, all, tx };