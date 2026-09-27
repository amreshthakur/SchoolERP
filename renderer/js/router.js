const router = (() => {
  const pages = {};
  let current = null;

  function register(name, renderFn) { pages[name] = renderFn; }

  async function go(name) {
    if (!pages[name]) return;
    current = name;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === name);
    });
    const container = document.getElementById('pageContent');
    container.innerHTML = '';
    await pages[name](container);
  }

  return { register, go };
})();