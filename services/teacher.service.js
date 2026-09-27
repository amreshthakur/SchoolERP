const db = require('../database/db');
const audit = require('./audit.service');

function list({ search = '', page = 1, pageSize = 25 }) {
  const where = [];
  const params = [];
  if (search) {
    where.push('(name LIKE ? OR teacher_code LIKE ? OR subject LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.get(`SELECT COUNT(*) AS c FROM teachers ${whereSql}`, params).c;
  const rows = db.all(
    `SELECT * FROM teachers ${whereSql} ORDER BY name ASC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );
  return { rows, total, page, pageSize };
}

function getById(id) { return db.get('SELECT * FROM teachers WHERE id = ?', [id]); }

function create(session, data) {
  ['school_id','teacher_code','name'].forEach(k => {
    if (!data[k]) throw new Error(`Missing required field: ${k}`);
  });
  const res = db.run(
    `INSERT INTO teachers
     (school_id, teacher_code, name, gender, phone, email,
      qualification, subject, joining_date, status, photo_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.school_id, data.teacher_code, data.name, data.gender || null,
      data.phone || null, data.email || null, data.qualification || null,
      data.subject || null, data.joining_date || null,
      data.status || 'active', data.photo_path || null
    ]
  );
  audit.log({ session, action: 'teacher.create', module: 'teachers',
    recordId: res.lastInsertRowid, details: { name: data.name } });
  return { id: res.lastInsertRowid };
}

function update(session, id, data) {
  if (!db.get('SELECT id FROM teachers WHERE id = ?', [id])) throw new Error('Teacher not found.');
  db.run(
    `UPDATE teachers SET
       name = COALESCE(?, name), gender = COALESCE(?, gender),
       phone = COALESCE(?, phone), email = COALESCE(?, email),
       qualification = COALESCE(?, qualification), subject = COALESCE(?, subject),
       joining_date = COALESCE(?, joining_date), status = COALESCE(?, status),
       photo_path = COALESCE(?, photo_path),
       updated_at = datetime('now')
     WHERE id = ?`,
    [data.name, data.gender, data.phone, data.email, data.qualification,
     data.subject, data.joining_date, data.status, data.photo_path, id]
  );
  audit.log({ session, action: 'teacher.update', module: 'teachers', recordId: id });
  return { id };
}

function remove(session, id) {
  if (!db.get('SELECT id FROM teachers WHERE id = ?', [id])) throw new Error('Teacher not found.');
  db.run('DELETE FROM teachers WHERE id = ?', [id]);
  audit.log({ session, action: 'teacher.delete', module: 'teachers', recordId: id });
  return { id };
}

module.exports = { list, getById, create, update, remove };