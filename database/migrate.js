const fs = require('fs');
const path = require('path');
const db = require('./db');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function ensureMigrationsTable() {
  db.run(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
}

function applied() {
  return new Set(db.all('SELECT name FROM schema_migrations').map(r => r.name));
}

function runMigrations() {
  ensureMigrationsTable();
  const done = applied();
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const tx = db.open().transaction(() => {
      db.open().exec(sql);
      db.run('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
    });
    tx();
    logger.info('Migration applied', { file });
  }
}

// Seed roles + permissions idempotently
function seedBaseline() {
  const roles = [
    ['Admin', 'Full system access'],
    ['Principal', 'Read + publish results'],
    ['Teacher', 'Students, attendance, marks'],
    ['Accountant', 'Fees and payments'],
    ['Staff', 'Limited read-only']
  ];
  const insRole = db.open().prepare(
    'INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)'
  );
  roles.forEach(r => insRole.run(r));

  const perms = [
    'students.view','students.create','students.edit','students.delete',
    'teachers.view','teachers.create','teachers.edit','teachers.delete',
    'classes.view','classes.manage',
    'attendance.view','attendance.mark','attendance.edit',
    'exams.view','exams.manage',
    'results.view','results.enter','results.publish',
    'fees.view','fees.collect','fees.manage',
    'timetable.view','timetable.manage',
    'notices.view','notices.manage',
    'backup.manage','settings.manage','users.manage'
  ];
  const insPerm = db.open().prepare(
    'INSERT OR IGNORE INTO permissions (code, description) VALUES (?, ?)'
  );
  perms.forEach(p => insPerm.run([p, p]));

  // Admin gets all
  db.run(`INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
          SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'Admin'`);
}

module.exports = { runMigrations, seedBaseline };