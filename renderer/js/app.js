// Initialize theme
(function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  if (saved === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', saved);
  }
})();

function showLogin() {
  document.getElementById('loginView').hidden = false;
  document.getElementById('appShell').hidden = true;
}

function showApp() {
  document.getElementById('loginView').hidden = true;
  document.getElementById('appShell').hidden = false;
  document.getElementById('userLabel').textContent =
    `${store.user.username} (${store.user.role})`;
  document.getElementById('brandName').textContent = store.schoolInfo.name || 'School ERP';
  document.getElementById('yearBadge').textContent =
    store.schoolInfo.year ? `Academic Year ${store.schoolInfo.year}` : '';

  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', () => router.go(el.dataset.page));
  });
  router.go('dashboard');
}

async function boot() {
  const configured = await window.api.setup.isConfigured();
  if (!configured) {
    // User shouldn't get here normally — setup window opens instead.
    document.body.innerHTML = '<p style="padding:32px;">Please complete setup first.</p>';
    return;
  }

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('loginErr');
    err.hidden = true;
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    try {
      const res = await window.api.auth.login(
        document.getElementById('loginUsername').value.trim(),
        document.getElementById('loginPassword').value
      );
      if (!res.ok) throw new Error(res.error);
      store.setSession(res.data.token, res.data.user);

      // Fetch academic year info for the header
      const yearId = await window.api.app.currentAcademicYearId(res.data.token);
      // Fetch school name from config file indirectly: read via dashboard? We'll
      // keep a minimal call. Use window.api.app.info as placeholder — school name
      // comes from the login flow already. Better to expose a tiny endpoint.
      const schoolInfo = await window.api.app.schoolInfo(res.data.token);
      if (schoolInfo.ok) {
        store.setSchoolInfo({
          name: schoolInfo.data.name,
          year: schoolInfo.data.year
        });
      }
      showApp();
    } catch (e) {
      err.textContent = e.message;
      err.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await window.api.auth.logout(store.token); } catch (_) {}
    store.clear();
    document.getElementById('loginForm').reset();
    showLogin();
  });

  showLogin();
}

boot();