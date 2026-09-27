const { contextBridge, ipcRenderer } = require('electron');

// Only whitelisted channels exposed.

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld('api', {

  setup: {

    isConfigured: ()      => invoke('setup:isConfigured'),

    complete:     (data)  => invoke('setup:complete', data),

    openMain:     ()      => invoke('setup:openMain')

  },

  auth: {

    login:          (username, password) => invoke('auth:login', { username, password }),

    logout:         (token)             => invoke('auth:logout', { token }),

    me:             (token)             => invoke('auth:me', { token }),

    changePassword: (token, oldPassword, newPassword) =>
      invoke('auth:changePassword', { token, oldPassword, newPassword })

  },

  dashboard: {

    summary: (token) => invoke('dashboard:summary', { token })

  },

  students: {

    list:   (token, params)   => invoke('students:list', { token, ...params }),

    get:    (token, id)       => invoke('students:get', { token, id }),

    create: (token, data)     => invoke('students:create', { token, data }),

    update: (token, id, data) => invoke('students:update', { token, id, data }),

    remove: (token, id)       => invoke('students:delete', { token, id })

  },

  teachers: {

    list:   (token, params)   => invoke('teachers:list', { token, ...params }),

    get:    (token, id)       => invoke('teachers:get', { token, id }),

    create: (token, data)     => invoke('teachers:create', { token, data }),

    update: (token, id, data) => invoke('teachers:update', { token, id, data }),

    remove: (token, id)       => invoke('teachers:delete', { token, id })

  },

  classes: {

    list:          (token)      => invoke('classes:list', { token }),

    create:        (token, data) => invoke('classes:create', { token, data }),

    addSection:    (token, data) => invoke('classes:addSection', { token, data }),

    assignTeacher: (token, data) => invoke('classes:assignTeacher', { token, data }),

    remove:        (token, id)  => invoke('classes:delete', { token, id })

  },

  app: {

    info:                 ()      => invoke('app:info'),

    schoolInfo:           (token) => invoke('app:schoolInfo', { token }),

    currentAcademicYearId: (token) =>
      invoke('app:currentAcademicYearId', { token })

  }

});