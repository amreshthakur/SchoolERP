const fs = require('fs');
const path = require('path');
const { getLogDir } = require('./paths');

const logFile = () => path.join(getLogDir(), `app-${new Date().toISOString().slice(0,10)}.log`);

function write(level, msg, meta) {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}` +
    (meta ? ` :: ${JSON.stringify(meta)}` : '') + '\n';
  try { fs.appendFileSync(logFile(), line); } catch (e) { /* swallow */ }
  if (level === 'ERROR') console.error(line.trim());
  else if (process.env.NODE_ENV !== 'production') console.log(line.trim());
}

module.exports = {
  info: (m, meta) => write('INFO', m, meta),
  warn: (m, meta) => write('WARN', m, meta),
  error: (m, meta) => write('ERROR', m, meta),
  debug: (m, meta) => write('DEBUG', m, meta)
};