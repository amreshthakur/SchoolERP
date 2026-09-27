CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL,
  name TEXT NOT NULL,            -- "Class 8"
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(school_id, name),
  FOREIGN KEY(school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  name TEXT NOT NULL,            -- "A"
  class_teacher_id INTEGER,
  UNIQUE(class_id, name),
  FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL,
  teacher_code TEXT NOT NULL,
  photo_path TEXT,
  name TEXT NOT NULL,
  gender TEXT,
  phone TEXT,
  email TEXT,
  qualification TEXT,
  subject TEXT,
  joining_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(school_id, teacher_code),
  FOREIGN KEY(school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL,
  admission_no TEXT NOT NULL,
  photo_path TEXT,
  name TEXT NOT NULL,
  dob TEXT,
  gender TEXT,
  father_name TEXT,
  mother_name TEXT,
  guardian_name TEXT,
  parent_phone TEXT,
  address TEXT,
  admission_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(school_id, admission_no),
  FOREIGN KEY(school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_academic_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  academic_year_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  section_id INTEGER NOT NULL,
  roll_number TEXT,
  is_current INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, academic_year_id),
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY(academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY(class_id) REFERENCES classes(id),
  FOREIGN KEY(section_id) REFERENCES sections(id)
);

CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_adm ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_sar_class ON student_academic_records(class_id, section_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_sections_class ON sections(class_id);