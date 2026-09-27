router.register('settings', async (root) => {
  root.innerHTML = `
    <h2>Settings</h2>
    <div class="card" style="margin-bottom:16px;">
      <h3>Change Password</h3>
      <div class="row row-3">
        <div class="field"><label>Current Password</label>
          <input id="pwd_old" type="password"></div>
        <div class="field"><label>New Password</label>
          <input id="pwd_new" type="password"></div>
        <div class="field"><label>Confirm New Password</label>
          <input id="pwd_confirm" type="password"></div>
      </div>
      <div class="actions">
        <button class="btn" id="changePwdBtn">Change Password</button>
      </div>
      <p id="pwdMsg" class="mt" hidden></p>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <h3>Appearance</h3>
      <div class="field">
        <label>Theme</label>
        <select id="themeSelect">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
    </div>

    <div class="card">
      <h3>LAN Mode</h3>
      <p class="muted">Available in Stage 6. Will allow other computers on your school network
        to connect to this main ERP computer.</p>
    </div>
  `;

  document.getElementById('changePwdBtn').addEventListener('click', async () => {
    const msg = document.getElementById('pwdMsg');
    const oldP = document.getElementById('pwd_old').value;
    const newP = document.getElementById('pwd_new').value;
    const cP = document.getElementById('pwd_confirm').value;
    msg.hidden = true;
    if (newP !== cP) { msg.textContent = 'New passwords do not match.'; msg.className='error mt'; msg.hidden=false; return; }
    try {
      await api.call(() => window.api.auth.changePassword(store.token, oldP, newP));
      msg.textContent = 'Password changed successfully.'; msg.className='success mt'; msg.hidden=false;
      document.getElementById('pwd_old').value = '';
      document.getElementById('pwd_new').value = '';
      document.getElementById('pwd_confirm').value = '';
    } catch (e) { msg.textContent = e.message; msg.className='error mt'; msg.hidden=false; }
  });

  const themeSel = document.getElementById('themeSelect');
  const saved = localStorage.getItem('theme') || 'light';
  themeSel.value = saved;
  applyTheme(saved);
  themeSel.addEventListener('change', () => {
    localStorage.setItem('theme', themeSel.value);
    applyTheme(themeSel.value);
  });
});

function applyTheme(mode) {
  if (mode === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', mode);
  }
}