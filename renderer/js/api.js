const api = {
  async call(fn) {
    const res = await fn();
    if (!res) throw new Error('No response from app.');
    if (!res.ok) throw new Error(res.error || 'Operation failed.');
    return res.data;
  },
  toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast ' + type;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.hidden = true; }, 2600);
  }
};