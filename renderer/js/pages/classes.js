router.register('classes', async (root) => {
  root.innerHTML = `
    <div class="toolbar">
      <h2 style="margin:0;">Classes & Sections</h2>
      <div class="spacer"></div>
      <button class="btn" id="addClass">+ Add Class</button>
    </div>
    <div id="classList"></div>
  `;
  document.getElementById('addClass').addEventListener('click', addClassModal);
  await loadClasses();
});

async function loadClasses() {
  const wrap = document.getElementById('classList');
  wrap.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const classes = await api.call(() => window.api.classes.list(store.token));
    if (!classes.length) {
      wrap.innerHTML = '<div class="card"><p class="muted">No classes yet. Add one to begin.</p></div>';
      return;
    }
    wrap.innerHTML = classes.map(c => `
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h3 style="margin:0;">${escapeHtml(c.name)}</h3>
          <div>
            <button class="btn sm" data-act="addSection" data-id="${c.id}">+ Section</button>
            <button class="btn sm danger" data-act="delClass" data-id="${c.id}">Delete Class</button>
          </div>
        </div>
        <div class="mt">
          ${c.sections.length ? c.sections.map(s => `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-top:8px;">
              <div>
                <b>Section ${escapeHtml(s.name)}</b>
                <span class="muted" style="margin-left:8px;">Class Teacher: ${escapeHtml(s.teacher_name||'—')}</span>
                <span class="muted" style="margin-left:8px;">Students: ${s.student_count}</span>
              </div>
              <button class="btn sm secondary" data-act="assignTeacher" data-id="${s.id}">Assign Teacher</button>
            </div>`).join('')
            : '<p class="muted">No sections yet.</p>'}
        </div>
      </div>`).join('');

    wrap.querySelectorAll('button[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        if (btn.dataset.act === 'addSection')    addSectionModal(id);
        if (btn.dataset.act === 'assignTeacher') assignTeacherModal(id);
        if (btn.dataset.act === 'delClass')      deleteClass(id);
      });
    });
  } catch (err) { wrap.innerHTML = `<p class="error">${err.message}</p>`; }
}

function addClassModal() {
  openModal('Add Class', `
    <div class="field"><label>Class Name *</label>
      <input id="c_name" placeholder="e.g. Class 8"></div>
    <div class="field"><label>Sort Order</label>
      <input id="c_sort" type="number" value="0"></div>
    <p id="modalErr" class="error" hidden></p>
  `, [
    { label: 'Cancel', cls: 'secondary', onClick: closeModal },
    { label: 'Create', onClick: async () => {
        const err = document.getElementById('modalErr');
        try {
          await api.call(() => window.api.classes.create(store.token, {
            school_id: store.user.schoolId,
            name: document.getElementById('c_name').value.trim(),
            sort_order: Number(document.getElementById('c_sort').value) || 0
          }));
          api.toast('Class created.'); closeModal(); loadClasses();
        } catch (e) { err.textContent = e.message; err.hidden = false; }
      } }
  ]);
}

function addSectionModal(classId) {
  openModal('Add Section', `
    <div class="field"><label>Section Name *</label>
      <input id="s_name" placeholder="e.g. A"></div>
    <p id="modalErr" class="error" hidden></p>
  `, [
    { label: 'Cancel', cls: 'secondary', onClick: closeModal },
    { label: 'Create', onClick: async () => {
        const err = document.getElementById('modalErr');
        try {
          await api.call(() => window.api.classes.addSection(store.token, {
            class_id: classId,
            name: document.getElementById('s_name').value.trim()
          }));
          api.toast('Section created.'); closeModal(); loadClasses();
        } catch (e) { err.textContent = e.message; err.hidden = false; }
      } }
  ]);
}

async function assignTeacherModal(sectionId) {
  const teachers = await api.call(() => window.api.teachers.list(store.token, { pageSize: 500 }));
  const opts = teachers.rows.map(t =>
    `<option value="${t.id}">${escapeHtml(t.name)} — ${escapeHtml(t.subject||'')}</option>`).join('');
  openModal('Assign Class Teacher', `
    <div class="field"><label>Teacher</label>
      <select id="at_id">${opts}</select></div>
    <p id="modalErr" class="error" hidden></p>
  `, [
    { label: 'Cancel', cls: 'secondary', onClick: closeModal },
    { label: 'Assign', onClick: async () => {
        try {
          await api.call(() => window.api.classes.assignTeacher(store.token, {
            section_id: sectionId,
            teacher_id: Number(document.getElementById('at_id').value)
          }));
          api.toast('Class teacher assigned.'); closeModal(); loadClasses();
        } catch (e) { api.toast(e.message, 'error'); }
      } }
  ]);
}

async function deleteClass(id) {
  if (!confirm('Delete this class and all its sections?')) return;
  try {
    await api.call(() => window.api.classes.remove(store.token, id));
    api.toast('Class deleted.'); loadClasses();
  } catch (e) { api.toast(e.message, 'error'); }
}