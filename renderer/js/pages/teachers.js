let teacherPage = 1, teacherSearch = '';
const teacherPageSize = 25;

router.register('teachers', async (root) => {
  root.innerHTML = `
    <div class="toolbar">
      <h2 style="margin:0;">Teachers</h2>
      <input type="search" id="teacherSearch" placeholder="Search name, code, subject…" value="${teacherSearch}">
      <div class="spacer"></div>
      <button class="btn" id="addTeacher">+ Add Teacher</button>
    </div>
    <div class="card" id="teacherTableWrap"></div>
    <div class="pagination" id="teacherPagination"></div>
  `;
  const s = document.getElementById('teacherSearch');
  s.addEventListener('input', debounce(() => {
    teacherSearch = s.value.trim(); teacherPage = 1; loadTeacherTable();
  }, 250));
  document.getElementById('addTeacher').addEventListener('click', () => openTeacherModal(null));
  loadTeacherTable();
});

async function loadTeacherTable() {
  const wrap = document.getElementById('teacherTableWrap');
  wrap.innerHTML = '<p class="muted">Loading…</p>';
  try {
    const data = await api.call(() => window.api.teachers.list(store.token, {
      search: teacherSearch, page: teacherPage, pageSize: teacherPageSize
    }));
    if (!data.rows.length) { wrap.innerHTML = '<p class="muted">No teachers found.</p>'; return; }
    wrap.innerHTML = `<table><thead><tr>
      <th>Code</th><th>Name</th><th>Subject</th><th>Phone</th><th>Status</th><th></th>
    </tr></thead><tbody>
      ${data.rows.map(t => `
        <tr>
          <td>${escapeHtml(t.teacher_code)}</td>
          <td>${escapeHtml(t.name)}</td>
          <td>${escapeHtml(t.subject||'—')}</td>
          <td>${escapeHtml(t.phone||'—')}</td>
          <td>${escapeHtml(t.status)}</td>
          <td style="text-align:right;">
            <button class="btn sm secondary" data-act="edit" data-id="${t.id}">Edit</button>
            <button class="btn sm danger"   data-act="del"  data-id="${t.id}">Delete</button>
          </td>
        </tr>`).join('')}
    </tbody></table>`;
    wrap.querySelectorAll('button[data-act]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.id);
        if (btn.dataset.act === 'edit') openTeacherModal(id);
        if (btn.dataset.act === 'del')  deleteTeacher(id);
      });
    });
    renderPagination(document.getElementById('teacherPagination'),
      data.total, data.page, data.pageSize, p => { teacherPage = p; loadTeacherTable(); });
  } catch (err) { wrap.innerHTML = `<p class="error">${err.message}</p>`; }
}

async function deleteTeacher(id) {
  if (!confirm('Delete this teacher?')) return;
  try {
    await api.call(() => window.api.teachers.remove(store.token, id));
    api.toast('Teacher deleted.'); loadTeacherTable();
  } catch (e) { api.toast(e.message, 'error'); }
}

async function openTeacherModal(id) {
  const editing = id ? await api.call(() => window.api.teachers.get(store.token, id)) : null;
  const d = editing || {};
  openModal(editing ? 'Edit Teacher' : 'Add Teacher', `
    <div class="row row-2">
      <div class="field"><label>Teacher Code *</label>
        <input id="t_code" value="${escapeHtml(d.teacher_code||'')}" ${editing?'disabled':''}></div>
      <div class="field"><label>Name *</label>
        <input id="t_name" value="${escapeHtml(d.name||'')}"></div>
    </div>
    <div class="row row-2">
      <div class="field"><label>Gender</label>
        <select id="t_gender">
          <option value="">—</option>
          <option ${d.gender==='Male'?'selected':''}>Male</option>
          <option ${d.gender==='Female'?'selected':''}>Female</option>
          <option ${d.gender==='Other'?'selected':''}>Other</option>
        </select></div>
      <div class="field"><label>Phone</label>
        <input id="t_phone" value="${escapeHtml(d.phone||'')}"></div>
    </div>
    <div class="row row-2">
      <div class="field"><label>Email</label>
        <input id="t_email" value="${escapeHtml(d.email||'')}"></div>
      <div class="field"><label>Subject</label>
        <input id="t_subject" value="${escapeHtml(d.subject||'')}"></div>
    </div>
    <div class="row row-2">
      <div class="field"><label>Qualification</label>
        <input id="t_qualification" value="${escapeHtml(d.qualification||'')}"></div>
      <div class="field"><label>Joining Date</label>
        <input id="t_joining_date" type="date" value="${d.joining_date||''}"></div>
    </div>
    <p id="modalErr" class="error" hidden></p>
  `, [
    { label: 'Cancel', cls: 'secondary', onClick: closeModal },
    { label: editing ? 'Save' : 'Create', onClick: () => submitTeacher(id) }
  ]);
}

async function submitTeacher(id) {
  const err = document.getElementById('modalErr');
  err.hidden = true;
  const data = {
    school_id: store.user.schoolId,
    teacher_code: document.getElementById('t_code').value.trim(),
    name: document.getElementById('t_name').value.trim(),
    gender: document.getElementById('t_gender').value,
    phone: document.getElementById('t_phone').value.trim(),
    email: document.getElementById('t_email').value.trim(),
    subject: document.getElementById('t_subject').value.trim(),
    qualification: document.getElementById('t_qualification').value.trim(),
    joining_date: document.getElementById('t_joining_date').value
  };
  try {
    if (id) {
      delete data.teacher_code;
      await api.call(() => window.api.teachers.update(store.token, id, data));
      api.toast('Teacher updated.');
    } else {
      await api.call(() => window.api.teachers.create(store.token, data));
      api.toast('Teacher created.');
    }
    closeModal(); loadTeacherTable();
  } catch (e) { err.textContent = e.message; err.hidden = false; }
}