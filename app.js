(() => {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (preferredDark ? 'dark' : 'light');

  root.setAttribute('data-theme', theme);

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;

    document.querySelectorAll('.top-nav a').forEach((link) => {
      const href = link.getAttribute('href');

      if (
        (page === 'home' && href === 'index.html') ||
        (page === 'about' && href === 'about.html') ||
        (page === 'stories' && href === 'stories.html')
      ) {
        link.setAttribute('aria-current', 'page');
      }
    });

    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
      });
    });
  });
})();
