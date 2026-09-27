// Minimal non-Electron smoke test of core logic.
// Run: node tests/smoke.test.js

const bcrypt = require('bcryptjs');
const assert = require('assert');

async function testPasswordHashing() {
  const hash = await bcrypt.hash('secret123', 10);
  assert(await bcrypt.compare('secret123', hash), 'correct password verifies');
  assert(!(await bcrypt.compare('wrong', hash)), 'wrong password fails');
  console.log('✓ password hashing');
}

async function testTransactions() {
  // We use better-sqlite3 synchronously — sanity check the module loads.
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)');
  db.prepare('INSERT INTO t (v) VALUES (?)').run('hello');
  const row = db.prepare('SELECT v FROM t WHERE id = 1').get();
  assert.strictEqual(row.v, 'hello');
  db.close();
  console.log('✓ sqlite in-memory');
}

(async () => {
  await testPasswordHashing();
  await testTransactions();
  console.log('\nAll smoke tests passed.');
})().catch(e => { console.error(e); process.exit(1); });