const db = require('../database/db');
const audit = require('./audit.service');

function list({ search = '', classId = null, sectionId = null, academicYearId = null, page = 1, pageSize = 25, sort = 'name', dir = 'asc' }) {
  const where = [];
  const params = [];
  if (search) {
    where.push('(s.name LIKE ? OR s.admission_no LIKE ? OR s.father_name LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (classId) { where.push('sar.class_id = ?'); params.push(classId); }
  if (sectionId) { where.push('sar.section_id = ?'); params.push(sectionId); }
  if (academicYearId) { where.push('sar.academic_year_id = ?'); params.push(academicYearId); }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const safeSort = ['name','admission_no','created_at'].includes(sort) ? sort : 'name';
  const safeDir = dir === 'desc' ? 'DESC' : 'ASC';

  const total = db.get(
    `SELECT COUNT(DISTINCT s.id) AS c FROM students s
     LEFT JOIN student_academic_records sar ON sar.student_id = s.id
     ${whereSql}`,
    params
  ).c;

  const rows = db.all(
    `SELECT s.*, sar.class_id, sar.section_id, sar.roll_number,
            c.name AS class_name, sec.name AS section_name
     FROM students s
     LEFT JOIN student_academic_records sar ON sar.student_id = s.id AND sar.is_current = 1
     LEFT JOIN classes c ON c.id = sar.class_id
     LEFT JOIN sections sec ON sec.id = sar.section_id
     ${whereSql}
     ORDER BY s.${safeSort} ${safeDir}
     LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );

  return { rows, total, page, pageSize };
}

function getById(id) {
  return db.get(
    `SELECT s.*, sar.class_id, sar.section_id, sar.roll_number, sar.academic_year_id
     FROM students s
     LEFT JOIN student_academic_records sar ON sar.student_id = s.id AND sar.is_current = 1
     WHERE s.id = ?`, [id]
  );
}

function create(session, data) {
  const required = ['admission_no','name','school_id'];
  required.forEach(k => { if (!data[k]) throw new Error(`Missing required field: ${k}`); });

  return db.tx(() => {
    const res = db.run(
      `INSERT INTO students
       (school_id, admission_no, name, dob, gender, father_name, mother_name,
        guardian_name, parent_phone, address, admission_date, status, photo_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.school_id, data.admission_no, data.name, data.dob || null,
        data.gender || null, data.father_name || null, data.mother_name || null,
        data.guardian_name || null, data.parent_phone || null, data.address || null,
        data.admission_date || null, data.status || 'active', data.photo_path || null
      ]
    );
    const studentId = res.lastInsertRowid;

    if (data.class_id && data.section_id && data.academic_year_id) {
      db.run(
        `INSERT INTO student_academic_records
         (student_id, academic_year_id, class_id, section_id, roll_number, is_current)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [studentId, data.academic_year_id, data.class_id, data.section_id, data.roll_number || null]
      );
    }

    audit.log({ session, action: 'student.create', module: 'students',
      recordId: studentId, details: { name: data.name, admission_no: data.admission_no } });
    return { id: studentId };
  });
}

function update(session, id, data) {
  const existing = db.get('SELECT id FROM students WHERE id = ?', [id]);
  if (!existing) throw new Error('Student not found.');

  return db.tx(() => {
    db.run(
      `UPDATE students SET
         name = COALESCE(?, name),
         dob = COALESCE(?, dob),
         gender = COALESCE(?, gender),
         father_name = COALESCE(?, father_name),
         mother_name = COALESCE(?, mother_name),
         guardian_name = COALESCE(?, guardian_name),
         parent_phone = COALESCE(?, parent_phone),
         address = COALESCE(?, address),
         admission_date = COALESCE(?, admission_date),
         status = COALESCE(?, status),
         photo_path = COALESCE(?, photo_path),
         updated_at = datetime('now')
       WHERE id = ?`,
      [
        data.name, data.dob, data.gender, data.father_name, data.mother_name,
        data.guardian_name, data.parent_phone, data.address, data.admission_date,
        data.status, data.photo_path, id
      ]
    );

    if (data.class_id && data.section_id && data.academic_year_id) {
      const existingAR = db.get(
        'SELECT id FROM student_academic_records WHERE student_id = ? AND academic_year_id = ?',
        [id, data.academic_year_id]
      );
      if (existingAR) {
        db.run(
          `UPDATE student_academic_records
           SET class_id = ?, section_id = ?, roll_number = ?
           WHERE id = ?`,
          [data.class_id, data.section_id, data.roll_number || null, existingAR.id]
        );
      } else {
        db.run(
          `INSERT INTO student_academic_records
           (student_id, academic_year_id, class_id, section_id, roll_number, is_current)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [id, data.academic_year_id, data.class_id, data.section_id, data.roll_number || null]
        );
      }
    }

    audit.log({ session, action: 'student.update', module: 'students', recordId: id });
    return { id };
  });
}

function remove(session, id) {
  const existing = db.get('SELECT * FROM students WHERE id = ?', [id]);
  if (!existing) throw new Error('Student not found.');
  db.run('DELETE FROM students WHERE id = ?', [id]);
  audit.log({ session, action: 'student.delete', module: 'students', recordId: id,
    details: { admission_no: existing.admission_no, name: existing.name } });
  return { id };
}

module.exports = { list, getById, create, update, remove };