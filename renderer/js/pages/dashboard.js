router.register('dashboard', async (root) => {
  const loading = document.createElement('div');
  loading.className = 'muted';
  loading.textContent = 'Loading dashboard…';
  root.appendChild(loading);

  let data;
  try {
    data = await api.call(() => window.api.dashboard.summary(store.token));
  } catch (err) {
    loading.className = 'error';
    loading.textContent = err.message;
    return;
  }
  root.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.innerHTML = `<h2>Dashboard</h2>
    <p class="muted">Live data from your local database.</p>`;

  const grid = document.createElement('div');
  grid.className = 'stats-grid';

  const cards = [
    { label: 'Total Students', value: data.students,      page: 'students' },
    { label: 'Total Teachers', value: data.teachers,      page: 'teachers' },
    { label: 'Total Classes',  value: data.classes,       page: 'classes'  },
    { label: 'Enrolled',       value: data.enrolled,      page: 'students' },
    { label: "Today's Attendance", value: data.todaysAttendance,
      page: null, soon: 'Stage 3' },
    { label: 'Fee Collected',  value: data.feeCollected,
      page: null, soon: 'Stage 4' },
    { label: 'Pending Fee',    value: data.feePending,
      page: null, soon: 'Stage 4' },
    { label: 'Upcoming Exams', value: (data.upcomingExams || []).length,
      page: null, soon: 'Stage 3' }
  ];

  cards.forEach(c => {
    const el = document.createElement('div');
    el.className = 'stat-card' + (c.page ? '' : ' not-ready');
    el.innerHTML = `<div class="stat-value">${c.value ?? '—'}</div>
                    <div class="stat-label">${c.label}</div>
                    ${c.soon ? `<div class="muted" style="font-size:11px;margin-top:6px;">Coming in ${c.soon}</div>` : ''}`;
    if (c.page) {
      el.addEventListener('click', () => router.go(c.page));
    } else {
      el.addEventListener('click', () => api.toast(`${c.label} will be available in ${c.soon}.`, 'error'));
    }
    grid.appendChild(el);
  });

  wrap.appendChild(grid);
  root.appendChild(wrap);
});