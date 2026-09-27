const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const password = require('../utils/password');
const logger = require('../utils/logger');
const { getUploadsDir, getConfigPath } = require('../utils/paths');

function isConfigured() {
  try {
    if (!fs.existsSync(getConfigPath())) return false;
    const cfg = JSON.parse(fs.readFileSync(getConfigPath(), 'utf8'));
    return !!(cfg && cfg.schoolId);
  } catch { return false; }
}

function saveConfig(cfg) {
  fs.writeFileSync(getConfigPath(), JSON.stringify(cfg, null, 2));
}

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(getConfigPath(), 'utf8')); }
  catch { return null; }
}

async function completeSetup(payload) {
  const {
    schoolName, logoBase64, address, phone, email, website,
    academicYear, adminUsername, adminPassword
  } = payload;

  if (!schoolName || !academicYear || !adminUsername || !adminPassword) {
    throw new Error('Missing required setup fields.');
  }
  if (adminPassword.length < 6) {
    throw new Error('Admin password must be at least 6 characters.');
  }

  let logoPath = null;
  if (logoBase64) {
    const ext = (logoBase64.match(/^data:image\/(\w+);base64,/) || [])[1] || 'png';
    const fname = `logo_${Date.now()}.${ext}`;
    logoPath = path.join(getUploadsDir(), fname);
    const data = logoBase64.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(logoPath, Buffer.from(data, 'base64'));
  }

  return db.tx(() => {
    const schoolRes = db.run(
      `INSERT INTO schools (name, logo_path, address, phone, email, website, current_academic_year)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [schoolName, logoPath, address || null, phone || null,
       email || null, website || null, academicYear]
    );
    const schoolId = schoolRes.lastInsertRowid;

    db.run(
      `INSERT INTO academic_years (school_id, name, is_current) VALUES (?, ?, 1)`,
      [schoolId, academicYear]
    );

    const adminRole = db.get(`SELECT id FROM roles WHERE name = 'Admin'`);
    if (!adminRole) throw new Error('Admin role missing — run seedBaseline first.');

    const hash = require('bcryptjs').hashSync(adminPassword, 12);
    const userRes = db.run(
      `INSERT INTO users (school_id, username, password_hash, full_name, role_id)
       VALUES (?, ?, ?, ?, ?)`,
      [schoolId, adminUsername, hash, 'Administrator', adminRole.id]
    );

    db.run(
      `INSERT INTO audit_logs (user_id, username, action, module, details)
       VALUES (?, ?, 'setup.complete', 'setup', ?)`,
      [userRes.lastInsertRowid, adminUsername, JSON.stringify({ schoolName })]
    );

    saveConfig({ schoolId, configuredAt: new Date().toISOString() });

    logger.info('Setup complete', { schoolId });
    return { schoolId, userId: userRes.lastInsertRowid };
  });
}

module.exports = { isConfigured, completeSetup, loadConfig };