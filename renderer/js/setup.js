let step = 1;
let logoBase64 = null;

const $ = (id) => document.getElementById(id);

function showStep(n) {
  step = n;
  for (let i = 1; i <= 3; i++) {
    $('step' + i).hidden = (i !== n);
    document.querySelector(`.step[data-step="${i}"]`).classList.toggle('active', i <= n);
  }
  $('prevBtn').hidden = (n === 1);
  $('nextBtn').hidden = (n === 3);
  $('finishBtn').hidden = (n !== 3);
}

function validateStep() {
  $('err').hidden = true;
  if (step === 1) {
    if (!$('schoolName').value.trim()) { showErr('School name is required.'); return false; }
  }
  if (step === 2) {
    if (!$('academicYear').value.trim()) { showErr('Academic year is required.'); return false; }
  }
  if (step === 3) {
    if (!$('adminUsername').value.trim()) { showErr('Admin username is required.'); return false; }
    if ($('adminPassword').value.length < 6) { showErr('Password must be at least 6 characters.'); return false; }
  }
  return true;
}

function showErr(msg) {
  const e = $('err'); e.textContent = msg; e.hidden = false;
}

$('nextBtn').addEventListener('click', () => {
  if (!validateStep()) return;
  showStep(step + 1);
});
$('prevBtn').addEventListener('click', () => { if (step > 1) showStep(step - 1); });

$('logoFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) { logoBase64 = null; return; }
  const reader = new FileReader();
  reader.onload = () => { logoBase64 = reader.result; };
  reader.readAsDataURL(file);
});

$('setupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep()) return;
  $('finishBtn').disabled = true;
  try {
    const res = await window.api.setup.complete({
      schoolName: $('schoolName').value.trim(),
      logoBase64,
      address:  $('address').value.trim(),
      phone:    $('phone').value.trim(),
      email:    $('email').value.trim(),
      website:  $('website').value.trim(),
      academicYear: $('academicYear').value.trim(),
      adminUsername: $('adminUsername').value.trim(),
      adminPassword: $('adminPassword').value
    });
    if (!res.ok) throw new Error(res.error);
    await window.api.setup.openMain();
  } catch (err) {
    showErr(err.message || 'Setup failed.');
    $('finishBtn').disabled = false;
  }
});

showStep(1);