const db = require('../database/db');

function summary() {
  const students = db.get(`SELECT COUNT(*) AS c FROM students WHERE status='active'`).c;
  const teachers = db.get(`SELECT COUNT(*) AS c FROM teachers WHERE status='active'`).c;
  const classes  = db.get(`SELECT COUNT(*) AS c FROM classes`).c;
  const enrolled = db.get(`SELECT COUNT(*) AS c FROM student_academic_records WHERE is_current = 1`).c;

  const today = new Date().toISOString().slice(0, 10);
  // Placeholder until Stage 3 adds attendance table.
  const todaysAttendance = null;

  // Fee tables arrive in Stage 4.
  const feeCollected = 0;
  const feePending   = 0;

  const upcomingExams = [];   // Stage 3
  const upcomingResults = []; // Stage 3

  return {
    students, teachers, classes, enrolled,
    todaysAttendance, feeCollected, feePending,
    upcomingExams, upcomingResults,
    stageStatus: {
      stage1: true,
      stage2: true,
      stage3: false,
      stage4: false,
      stage5: false,
      stage6: false,
      stage7: false
    }
  };
}

module.exports = { summary };