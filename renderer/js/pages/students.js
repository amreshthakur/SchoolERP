let studentPage = 1;
let studentSearch = '';
const studentPageSize = 25;

router.register('students', async (root) => {
  root.innerHTML = `
    <div class="toolbar">
      <h2 style="margin:0;flex:0 0 auto;">Students</h2>
      <input type="search" id="studentSearch" placeholder="Search name, admission no, father…" value="${studentSearch}">
      <div class="spacer"></div>
      <button class="btn" id="addStudent">+ Add Student</button>
    </div>
    <div class="card" id="studentTableWrap"></div>
    <div class="pagination" id="studentPagination"></div>
  `;

  const search = document.getElementById('studentSearch');
  search.addEventListener('input', debounce(() => {
    studentSearch = search.value.trim();
    studentPage = 1;
    loadStudentTable();
  }, 250));

  document.getElementById('addStudent').addEventListener('click', () => openStudentModal(null));
  loadStudentTable();
});

async function loadStudentTable() {
  const wrap = document.getElementById('studentTableWrap');
  wrap.innerHTML = `<p class="muted">Loading…</p>`;
  try {
    const data = await api.call(() => window.api.students.list(store.token, {
      search: studentSearch, page: studentPage, pageSize: studentPageSize
    }));
    renderStudentTable(wrap, data);
    renderPagination(document.getElementById('studentPagination'),
      data.total, data.page, data.pageSize,
      (p) => { studentPage = p; loadStudentTable(); });
  } catch (err) {
    wrap.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function renderStudentTable(wrap, data) {
  if (!data.rows.length) {
    wrap.innerHTML = `<p class="muted">No students found.</p>`;
    return;
  }
  const rows = data.rows.map(s => `
    <tr>
      <td>${escapeHtml(s.admission_no)}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.class_name || '—')} ${s.section_name ? ' / ' + escapeHtml(s.section_name) : ''}</td>
      <td>${escapeHtml(s.father_name || '—')}</td>
      <td>${escapeHtml(s.parent_phone || '—')}</td>
      <td>${escapeHtml(s.status)}</td>
      <td style="text-align:right;">
        <button class="btn sm secondary" data-act="view" data-id="${s.id}">View</button>
        <button class="btn sm secondary" data-act="edit" data-id="${s.id}">Edit</button>
        <button class="btn sm danger"   data-act="del"  data-id="${s.id}">Delete</button>
      </td>
    </tr>`).join('');

  wrap.innerHTML = `
    <table>
      <thead><tr>
        <th>Admission No</th><th>Name</th><th>Class</th><th>Father</th>
        <th>Phone</th><th>Status</th><th></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  wrap.querySelectorAll('button[data-act]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      if (btn.dataset.act === 'edit')   openStudentModal(id);
      if (btn.dataset.act === 'view')   viewStudent(id);
      if (btn.dataset.act === 'del')    deleteStudent(id);
    });
  });
}

async function viewStudent(id) {
  const s = await api.call(() => window.api.students.get(store.token, id));
  openModal(`Student: ${s.name}`, `
    <p><b>Admission No:</b> ${escapeHtml(s.admission_no)}</p>
    <p><b>Class:</b> ${escapeHtml(s.class_name || '—')} ${s.section_name || ''}</p>
    <p><b>Father:</b> ${escapeHtml(s.father_name || '—')}</p>
    <p><b>Mother:</b> ${escapeHtml(s.mother_name || '—')}</p>
    <p><b>Phone:</b> ${escapeHtml(s.parent_phone || '—')}</p>
    <p><b>Address:</b> ${escapeHtml(s.address || '—')}</p>
  `, [{ label: 'Close', cls: 'secondary' }]);
}

async function deleteStudent(id) {
  if (!confirm('Delete this student? This cannot be undone.')) return;
  try {
    await api.call(() => window.api.students.remove(store.token, id));
    api.toast('Student deleted.');
    loadStudentTable();
  } catch (err) { api.toast(err.message, 'error'); }
}

async function openStudentModal(id) {
  const classes = await api.call(() => window.api.classes.list(store.token));
  const editing = id ? await api.call(() => window.api.students.get(store.token, id)) : null;
  const d = editing || {};

  const classOptions = classes.map(c =>
    `<option value="${c.id}" ${d.class_id == c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
  ).join('');

  openModal(editing ? 'Edit Student' : 'Add Student', `
    <div class="row row-2">
      <div class="field"><label>Admission No *</label>
        <input id="f_admission_no" value="${escapeHtml(d.admission_no||'')}" ${editing?'disabled':''}></div>
      <div class="field"><label>Name *</label>
        <input id="f_name" value="${escapeHtml(d.name||'')}"></div>
    </div>
    <div class="row row-2">
      <div class="field"><label>Gender</label>
        <select id="f_gender">
          <option value="">—</option>
          <option ${d.gender==='Male'?'selected':''}>Male</option>
          <option ${d.gender==='Female'?'selected':''}>Female</option>
          <option ${d.gender==='Other'?'selected':''}>Other</option>
        </select></div>
      <div class="field"><label>Date of Birth</label>
        <input id="f_dob" type="date" value="${d.dob||''}"></div>
    </div>
    <div class="row row-2">
      <div class="field"><label>Father Name</label>
        <input id="f_father_name" value="${escapeHtml(d.father_name||'')}"></div>
      <div class="field"><label>Mother Name</label>
        <input id="f_mother_name" value="${escapeHtml(d.mother_name||'')}"></div>
    </div>
    <div class="row row-2">
      <div class="field"><label>Parent Phone</label>
        <input id="f_parent_phone" value="${escapeHtml(d.parent_phone||'')}"></div>
      <div class="field"><label>Class</label>
        <select id="f_class_id"><option value="">— None —</option>${classOptions}</select></div>
    </div>
    <div class="row row-2">
      <div class="field"><label>Section</label>
        <select id="f_section_id"></select></div>
      <div class="field"><label>Roll Number</label>
        <input id="f_roll_number" value="${escapeHtml(d.roll_number||'')}"></div>
    </div>
    <div class="field"><label>Address</label>
      <input id="f_address" value="${escapeHtml(d.address||'')}"></div>
    <p id="modalErr" class="error" hidden></p>
  `, [
    { label: 'Cancel', cls: 'secondary', onClick: closeModal },
    { label: editing ? 'Save' : 'Create', onClick: () => submitStudent(id, classes) }
  ]);

  // Wire section dropdown to selected class
  const classSel = document.getElementById('f_class_id');
  const sectionSel = document.getElementById('f_section_id');
  function populateSections() {
    const c = classes.find(x => x.id == classSel.value);
    sectionSel.innerHTML = c
      ? '<option value="">— None —</option>' + c.sections.map(s =>
          `<option value="${s.id}" ${d.section_id==s.id?'selected':''}>${escapeHtml(s.name)}</option>`).join('')
      : '';
  }
  classSel.addEventListener('change', populateSections);
  populateSections();
}

async function submitStudent(id, classes) {
  const err = document.getElementById('modalErr');
  err.hidden = true;
  const schoolId = store.user.schoolId;

  // Get current academic year id — simplest path: use the school's current year name
  // We'll resolve via the classes payload? Better: fetch from dashboard? For now
  // derive from the currently logged-in school. If we don't know it, we let
  // the DB layer pick is_current year via a small helper.
  const academicYearId = await resolveCurrentAcademicYearId();

  const data = {
    school_id: schoolId,
    admission_no: document.getElementById('f_admission_no').value.trim(),
    name: document.getElementById('f_name').value.trim(),
    gender: document.getElementById('f_gender').value,
    dob: document.getElementById('f_dob').value,
    father_name: document.getElementById('f_father_name').value.trim(),
    mother_name: document.getElementById('f_mother_name').value.trim(),
    parent_phone: document.getElementById('f_parent_phone').value.trim(),
    address: document.getElementById('f_address').value.trim(),
    class_id: document.getElementById('f_class_id').value || null,
    section_id: document.getElementById('f_section_id').value || null,
    roll_number: document.getElementById('f_roll_number').value.trim(),
    academic_year_id: academicYearId
  };

  try {
    if (id) {
      delete data.admission_no;
      await api.call(() => window.api.students.update(store.token, id, data));
      api.toast('Student updated.');
    } else {
      await api.call(() => window.api.students.create(store.token, data));
      api.toast('Student created.');
    }
    closeModal();
    loadStudentTable();
  } catch (e) {
    err.textContent = e.message;
    err.hidden = false;
  }
}

async function resolveCurrentAcademicYearId() {
  // Minimal helper: query dashboard summary indirectly by reading classes list
  // is not enough. We'll add a tiny IPC convenience by scanning the DB.
  // Implemented in the preload as 'app:info'? Simpler: use an admin endpoint.
  const info = await window.api.app.info();
  // For Stage 2 we hardcode a small call: fetch from settings via a dedicated
  // endpoint we'll add below in api. This keeps us honest.
  return await window.api.app.currentAcademicYearId(store.token);
}

// --- Modal helpers ---
function openModal(title, html, buttons) {
  closeModal();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'modalBackdrop';
  const btnHtml = buttons.map((b, i) =>
    `<button class="btn ${b.cls||''}" data-idx="${i}">${b.label}</button>`).join('');
  backdrop.innerHTML = `<div class="modal">
    <h3>${escapeHtml(title)}</h3>
    <div id="modalBody">${html}</div>
    <div class="actions mt">${btnHtml}</div>
  </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  backdrop.querySelectorAll('button[data-idx]').forEach(b => {
    b.addEventListener('click', () => {
      const btn = buttons[Number(b.dataset.idx)];
      btn.onClick && btn.onClick();
    });
  });
}

function closeModal() {
  const el = document.getElementById('modalBackdrop');
  if (el) el.remove();
}

// --- Utilities ---
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
function renderPagination(el, total, page, pageSize, onGo) {
  el.innerHTML = '';
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return;
  const prev = document.createElement('button');
  prev.textContent = '‹ Prev'; prev.disabled = page === 1;
  prev.addEventListener('click', () => onGo(page - 1));
  el.appendChild(prev);
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) {
      const b = document.createElement('button');
      b.textContent = i;
      if (i === page) b.classList.add('active');
      b.addEventListener('click', () => onGo(i));
      el.appendChild(b);
    } else if (i === page - 2 || i === page + 2) {
      const s = document.createElement('span');
      s.textContent = '…'; s.style.padding = '6px';
      el.appendChild(s);
    }
  }
  const next = document.createElement('button');
  next.textContent = 'Next ›'; next.disabled = page === pages;
  next.addEventListener('click', () => onGo(page + 1));
  el.appendChild(next);
}