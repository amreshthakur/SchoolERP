const db = require('../database/db');

function log({ session, action, module, recordId, details }) {
  db.run(
    `INSERT INTO audit_logs (user_id, username, action, module, record_id, details)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      session?.userId || null,
      session?.username || 'system',
      action, module || null,
      recordId != null ? String(recordId) : null,
      details ? JSON.stringify(details) : null
    ]
  );
}

module.exports = { log };