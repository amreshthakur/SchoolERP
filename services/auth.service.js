const db = require('../database/db');
const { verify } = require('../utils/password');
const logger = require('../utils/logger');

const sessions = new Map(); // token -> { userId, username, roleId, expires }

function newToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

async function login(username, password) {
  if (!username || !password) throw new Error('Username and password required.');

  const user = db.get(
    `SELECT u.*, r.name AS role_name FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.username = ? AND u.is_active = 1`,
    [username]
  );
  if (!user) throw new Error('Invalid username or password.');

  const ok = await verify(password, user.password_hash);
  if (!ok) {
    logger.warn('Failed login attempt', { username });
    throw new Error('Invalid username or password.');
  }

  const token = newToken();
  sessions.set(token, {
    userId: user.id,
    username: user.username,
    roleId: user.role_id,
    roleName: user.role_name,
    schoolId: user.school_id,
    expires: Date.now() + 8 * 60 * 60 * 1000
  });

  db.run(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`, [user.id]);
  db.run(
    `INSERT INTO audit_logs (user_id, username, action, module)
     VALUES (?, ?, 'login.success', 'auth')`,
    [user.id, user.username]
  );

  return {
    token,
    user: {
      id: user.id, username: user.username,
      fullName: user.full_name, role: user.role_name,
      schoolId: user.school_id
    }
  };
}

function getSession(token) {
  const s = sessions.get(token);
  if (!s) return null;
  if (s.expires < Date.now()) { sessions.delete(token); return null; }
  return s;
}

function logout(token) {
  const s = sessions.get(token);
  if (s) {
    db.run(
      `INSERT INTO audit_logs (user_id, username, action, module)
       VALUES (?, ?, 'logout', 'auth')`,
      [s.userId, s.username]
    );
  }
  sessions.delete(token);
}

function hasPermission(session, code) {
  if (!session) return false;
  if (session.roleName === 'Admin') return true;
  const row = db.get(
    `SELECT 1 FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = ? AND p.code = ?`,
    [session.roleId, code]
  );
  return !!row;
}

async function changePassword(session, oldPassword, newPassword) {
  if (!session) throw new Error('Not authenticated.');
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }
  const user = db.get('SELECT * FROM users WHERE id = ?', [session.userId]);
  const ok = await verify(oldPassword, user.password_hash);
  if (!ok) throw new Error('Current password is incorrect.');

  const hash = require('bcryptjs').hashSync(newPassword, 12);
  db.run(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`,
    [hash, user.id]);
  db.run(`INSERT INTO audit_logs (user_id, username, action, module)
          VALUES (?, ?, 'password.change', 'auth')`,
    [user.id, user.username]);
  return true;
}

module.exports = { login, logout, getSession, hasPermission, changePassword };