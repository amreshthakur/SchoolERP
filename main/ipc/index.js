const { ipcMain, app } = require('electron');

const setupService = require('../../services/setup.service');
const authService = require('../../services/auth.service');
const studentService = require('../../services/student.service');
const teacherService = require('../../services/teacher.service');
const classService = require('../../services/class.service');
const dashboardService = require('../../services/dashboard.service');
const logger = require('../../utils/logger');
const db = require('../../db');

// Wrap handlers so errors reach the renderer as { ok, data/error }
function wrap(fn) {
  return async (event, payload = {}) => {
    try {
      const data = await fn(event, payload);
      return { ok: true, data };
    } catch (err) {
      logger.error('IPC error', { message: err.message });
      return {
        ok: false,
        error: err.message || 'Unknown error'
      };
    }
  };
}

// Session guard
function requireSession(event, payload) {
  const s = authService.getSession(payload.token);

  if (!s) {
    throw new Error('Not authenticated. Please sign in again.');
  }

  return s;
}

function requirePerm(event, payload, code) {
  const s = requireSession(event, payload);

  if (!authService.hasPermission(s, code)) {
    throw new Error('You do not have permission for this action.');
  }

  return s;
}

function registerIpc() {

  // ---- Setup ----
  ipcMain.handle(
    'setup:isConfigured',
    wrap(async () => setupService.isConfigured())
  );

  ipcMain.handle(
    'setup:complete',
    wrap(async (e, p) => setupService.completeSetup(p))
  );

  // ---- Auth ----
  ipcMain.handle(
    'auth:login',
    wrap(async (e, p) =>
      authService.login(p.username, p.password)
    )
  );

  ipcMain.handle(
    'auth:logout',
    wrap(async (e, p) => {
      authService.logout(p.token);
      return true;
    })
  );

  ipcMain.handle(
    'auth:me',
    wrap(async (e, p) => {
      const s = authService.getSession(p.token);

      if (!s) {
        throw new Error('Not authenticated.');
      }

      return {
        id: s.userId,
        username: s.username,
        role: s.roleName,
        schoolId: s.schoolId
      };
    })
  );

  ipcMain.handle(
    'auth:changePassword',
    wrap(async (e, p) => {
      const s = requireSession(e, p);

      return authService.changePassword(
        s,
        p.oldPassword,
        p.newPassword
      );
    })
  );

  // ---- Dashboard ----
  ipcMain.handle(
    'dashboard:summary',
    wrap(async (e, p) => {
      requireSession(e, p);

      return dashboardService.summary();
    })
  );

  // ---- Students ----
  ipcMain.handle(
    'students:list',
    wrap(async (e, p) => {
      requireSession(e, p);

      return studentService.list(p);
    })
  );

  ipcMain.handle(
    'students:get',
    wrap(async (e, p) => {
      requireSession(e, p);

      return studentService.getById(p.id);
    })
  );

  ipcMain.handle(
    'students:create',
    wrap(async (e, p) => {
      const s = requirePerm(e, p, 'students.create');

      return studentService.create(s, p.data);
    })
  );

  ipcMain.handle(
    'students:update',
    wrap(async (e, p) => {
      const s = requirePerm(e, p, 'students.edit');

      return studentService.update(
        s,
        p.id,
        p.data
      );
    })
  );

  ipcMain.handle(
    'students:delete',
    wrap(async (e, p) => {
      const s = requirePerm(e, p, 'students.delete');

      return studentService.remove(s, p.id);
    })
  );

  // ---- Teachers ----
  ipcMain.handle(
    'teachers:list',
    wrap(async (e, p) => {
      requireSession(e, p);

      return teacherService.list(p);
    })
  );

  ipcMain.handle(
    'teachers:get',
    wrap(async (e, p) => {
      requireSession(e, p);

      return teacherService.getById(p.id);
    })
  );

  ipcMain.handle(
    'teachers:create',
    wrap(async (e, p) => {
      const s = requirePerm(e, p, 'teachers.create');

      return teacherService.create(s, p.data);
    })
  );

  ipcMain.handle(
    'teachers:update',
    wrap(async (e, p) => {
      const s = requirePerm(e, p, 'teachers.edit');

      return teacherService.update(
        s,
        p.id,
        p.data
      );
    })
  );

  ipcMain.handle(
    'teachers:delete',
    wrap(async (e, p) => {
      const s = requirePerm(e, p, 'teachers.delete');

      return teacherService.remove(s, p.id);
    })
  );

  // ---- Classes ----
  ipcMain.handle(
    'classes:list',
    wrap(async (e, p) => {
      requireSession(e, p);

      return classService.list();
    })
  );

  ipcMain.handle(
    'classes:create',
    wrap(async (e, p) => {
      const s = requirePerm(e, p, 'classes.manage');

      return classService.createClass(
        s,
        p.data
      );
    })
  );

  ipcMain.handle(
    'classes:addSection',
    wrap(async (e, p) => {
      const s = requirePerm(e, p, 'classes.manage');

      return classService.addSection(
        s,
        p.data
      );
    })
  );

  ipcMain.handle(
    'classes:assignTeacher',
    wrap(async (e, p) => {
      const s = requirePerm(e, p, 'classes.manage');

      return classService.assignClassTeacher(
        s,
        p.data
      );
    })
  );

  ipcMain.handle(
    'classes:delete',
    wrap(async (e, p) => {
      const s = requirePerm(e, p, 'classes.manage');

      return classService.remove(
        s,
        p.id
      );
    })
  );

  // ---- App info ----
  ipcMain.handle(
    'app:info',
    wrap(async () => ({
      version: app.getVersion(),
      name: 'School ERP'
    }))
  );

  // ---- School Info ----
  ipcMain.handle(
    'app:schoolInfo',
    wrap(async (e, p) => {
      const s = requireSession(e, p);

      const school = db.get(
        'SELECT name, current_academic_year FROM schools WHERE id = ?',
        [s.schoolId]
      );

      return {
        name: school?.name || '',
        year: school?.current_academic_year || ''
      };
    })
  );

  // ---- Current Academic Year ID ----
  ipcMain.handle(
    'app:currentAcademicYearId',
    wrap(async (e, p) => {
      const s = requireSession(e, p);

      const row = db.get(
        `SELECT id
         FROM academic_years
         WHERE school_id = ?
           AND is_current = 1
         LIMIT 1`,
        [s.schoolId]
      );

      return row ? row.id : null;
    })
  );
}

module.exports = {
  registerIpc
};