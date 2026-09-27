router.register('about', async (root) => {
  const info = await window.api.app.info();
  root.innerHTML = `
    <h2>About School ERP</h2>
    <div class="card">
      <p><b>${escapeHtml(info.name)}</b> — version ${escapeHtml(info.version)}</p>
      <p class="muted">Offline-first desktop ERP for schools. All data is stored locally on this computer.
        No internet required for normal operations.</p>
      <h4 class="mt">Included Features</h4>
      <ul>
        <li>✅ School setup wizard</li>
        <li>✅ Secure login (bcrypt hashed passwords)</li>
        <li>✅ Live dashboard from real database</li>
        <li>✅ Student management</li>
        <li>✅ Teacher management</li>
        <li>✅ Class & Section management</li>
        <li>✅ Role-based permissions</li>
        <li>✅ Audit log of important actions</li>
        <li>✅ Light / Dark / System theme</li>
      </ul>
      <h4 class="mt">Planned in Later Stages</h4>
      <ul>
        <li>📅 Attendance (Stage 3)</li>
        <li>📝 Exams & Results (Stage 3)</li>
        <li>💰 Fee Management (Stage 4)</li>
        <li>🗓️ Timetable (Stage 4)</li>
        <li>📢 Notice Board (Stage 4)</li>
        <li>💾 Backup / Restore (Stage 5)</li>
        <li>📤 Excel / JSON Import & Export (Stage 5)</li>
        <li>🖥️ LAN multi-computer mode (Stage 6)</li>
        <li>☁️ Optional cloud sync (Stage 7)</li>
      </ul>
    </div>`;
});