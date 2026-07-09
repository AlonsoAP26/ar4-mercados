document.getElementById('year').textContent = new Date().getFullYear();

const navMenuBtn = document.getElementById('navMenuBtn');
const mainNav = document.getElementById('mainNav');
if (navMenuBtn && mainNav) {
  function closeNav() {
    mainNav.classList.remove('open');
    navMenuBtn.setAttribute('aria-expanded', 'false');
  }
  function openNav() {
    mainNav.classList.add('open');
    navMenuBtn.setAttribute('aria-expanded', 'true');
  }
  navMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mainNav.classList.contains('open')) closeNav(); else openNav();
  });
  mainNav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') closeNav();
  });
  document.addEventListener('click', (e) => {
    if (mainNav.classList.contains('open') && !mainNav.contains(e.target) && e.target !== navMenuBtn) closeNav();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  mainNav.querySelectorAll('a').forEach((a) => {
    if (a.getAttribute('href') === currentPath) a.classList.add('nav-active');
  });
}

const filterBar = document.getElementById('filterBar');
const newsList = document.getElementById('newsList');
if (filterBar && newsList) {
  const chips = filterBar.querySelectorAll('.filter-chip');
  const items = newsList.querySelectorAll('[data-category]');
  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const filter = chip.dataset.filter;
    items.forEach(item => {
      item.style.display = (filter === 'all' || item.dataset.category === filter) ? '' : 'none';
    });
  });
}
