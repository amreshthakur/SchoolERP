const db = require('../database/db');
const audit = require('./audit.service');

function list() {
  const classes = db.all(`SELECT * FROM classes ORDER BY sort_order, name`);
  return classes.map(c => ({
    ...c,
    sections: db.all(
      `SELECT s.*, t.name AS teacher_name,
              (SELECT COUNT(*) FROM student_academic_records sar
               WHERE sar.class_id = s.class_id AND sar.section_id = s.id
                 AND sar.is_current = 1) AS student_count
       FROM sections s
       LEFT JOIN teachers t ON t.id = s.class_teacher_id
       WHERE s.class_id = ? ORDER BY s.name`, [c.id]
    )
  }));
}

function createClass(session, { school_id, name, sort_order = 0 }) {
  if (!name) throw new Error('Class name required.');
  const res = db.run(
    `INSERT INTO classes (school_id, name, sort_order) VALUES (?, ?, ?)`,
    [school_id, name, sort_order]
  );
  audit.log({ session, action: 'class.create', module: 'classes', recordId: res.lastInsertRowid });
  return { id: res.lastInsertRowid };
}

function addSection(session, { class_id, name, class_teacher_id = null }) {
  if (!class_id || !name) throw new Error('Class and section name required.');
  const res = db.run(
    `INSERT INTO sections (class_id, name, class_teacher_id) VALUES (?, ?, ?)`,
    [class_id, name, class_teacher_id]
  );
  audit.log({ session, action: 'section.create', module: 'classes', recordId: res.lastInsertRowid });
  return { id: res.lastInsertRowid };
}

function assignClassTeacher(session, { section_id, teacher_id }) {
  db.run(`UPDATE sections SET class_teacher_id = ? WHERE id = ?`, [teacher_id, section_id]);
  audit.log({ session, action: 'section.assignTeacher', module: 'classes',
    recordId: section_id, details: { teacher_id } });
  return { ok: true };
}

function remove(session, id) {
  db.run('DELETE FROM classes WHERE id = ?', [id]);
  audit.log({ session, action: 'class.delete', module: 'classes', recordId: id });
  return { id };
}

module.exports = { list, createClass, addSection, assignClassTeacher, remove };