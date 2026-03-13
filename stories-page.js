document.addEventListener('DOMContentLoaded', async () => {
  if (!window.StorySite) return;

  const listEl = document.getElementById('storyList');
  const articleEl = document.getElementById('storyArticle');
  const titleEl = document.getElementById('storyTopbarTitle');
  const searchEl = document.getElementById('storySearch');
  const sortEl = document.getElementById('storySort');
  const toggleEl = document.getElementById('sidebarToggle');
  const mobileDockEl = document.getElementById('mobileStoryDock');
  const topbarEl = document.querySelector('.story-topbar');
  const sidebarEl = document.querySelector('.stories-sidebar');

  let stories = [];
  let filtered = [];

  const MOBILE_BREAKPOINT = 900;

  let overlayEl = document.querySelector('.stories-overlay');
  if (!overlayEl) {
    overlayEl = document.createElement('button');
    overlayEl.type = 'button';
    overlayEl.className = 'stories-overlay';
    overlayEl.setAttribute('aria-label', 'Close story navigation');
    document.body.appendChild(overlayEl);
  }

  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
  const selectedSlug = () => new URL(window.location.href).searchParams.get('story');

  function updateToggleState(isOpen) {
    if (toggleEl) toggleEl.setAttribute('aria-expanded', String(isOpen));
    if (mobileDockEl) mobileDockEl.setAttribute('aria-expanded', String(isOpen));
    if (sidebarEl) sidebarEl.setAttribute('aria-hidden', String(!isOpen));
  }

  function updateOverlayAndScrollLock(isOpen) {
    const showOverlay = isMobile() && isOpen;
    overlayEl.classList.toggle('is-visible', showOverlay);
    document.body.classList.toggle('mobile-nav-open', showOverlay);
  }

  function setSidebarState(isOpen) {
    document.body.classList.toggle('sidebar-collapsed', !isOpen);
    document.body.classList.toggle('mobile-stories-open', isMobile() && isOpen);
    updateToggleState(isOpen);
    updateOverlayAndScrollLock(isOpen);
  }

  function updateStickyTitleVisibility() {
    const storyTitle = articleEl.querySelector('.story-title');
    if (!storyTitle || !topbarEl) return;

    const rect = storyTitle.getBoundingClientRect();
    const threshold =
      (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 76) + 56;

    topbarEl.classList.toggle('show-title', rect.bottom <= threshold);
  }

  function renderList() {
    const query = searchEl.value.trim().toLowerCase();
    const sort = sortEl.value;

    filtered = stories.filter((story) => {
      const haystack = `${story.title} ${story.excerpt} ${story.body}`.toLowerCase();
      return haystack.includes(query);
    });

    if (sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    const activeSlug = selectedSlug() || (filtered[0] && filtered[0].slug);

    listEl.innerHTML = filtered.length
      ? filtered.map((story) => `
        <a class="story-list-item ${story.slug === activeSlug ? 'is-active' : ''}" href="stories.html?story=${encodeURIComponent(story.slug)}">
          <h3 class="story-list__title">${story.title}</h3>
          <p class="story-list__meta">${window.StorySite.formatDate(story.date)} · ${story.pages} pages</p>
        </a>
      `).join('')
      : '<p class="empty-state" style="padding:16px;">No stories match your search.</p>';

    if (!activeSlug && filtered[0]) openStory(filtered[0].slug, false);
  }

  function openStory(slug, push = false) {
    const story = stories.find((item) => item.slug === slug) || filtered[0] || stories[0];

    if (!story) {
      articleEl.innerHTML = '<p class="empty-state">No stories available.</p>';
      titleEl.textContent = 'Stories';
      if (topbarEl) topbarEl.classList.remove('show-title');
      return;
    }

    titleEl.textContent = story.title;

    articleEl.innerHTML = `
      <header class="story-header">
        <h1 class="story-title">${story.title}</h1>
        <p class="story-meta">
          <span>${window.StorySite.formatDate(story.date)}</span>
          <span>·</span>
          <span>${story.pages} pages</span>
          <span>·</span>
          <span>◔ ${story.readTime} min</span>
        </p>
        ${story.quote ? `<blockquote class="story-quote">${story.quote}</blockquote>` : ''}
        <div class="story-downloads">
          ${story.pdf ? `<a href="${story.pdf}" target="_blank" rel="noopener">PDF</a>` : ''}
          ${story.epub ? `<a href="${story.epub}" target="_blank" rel="noopener">EPUB</a>` : ''}
        </div>
      </header>
      <hr class="story-divider">
      <div class="story-body">${story.html}</div>
    `;

    if (push) {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('story', story.slug);
      history.pushState({}, '', nextUrl);
    }

    document.querySelectorAll('.story-list-item').forEach((item) => {
      item.classList.toggle(
        'is-active',
        item.getAttribute('href') === `stories.html?story=${encodeURIComponent(story.slug)}`
      );
    });

    requestAnimationFrame(() => {
      updateStickyTitleVisibility();
      if (isMobile()) window.scrollTo({ top: 0, behavior: 'auto' });
    });

    if (isMobile()) setSidebarState(false);
  }

  function syncSidebarForViewport() {
    if (isMobile()) {
      setSidebarState(false);
    } else {
      document.body.classList.remove('mobile-nav-open', 'mobile-stories-open');
      overlayEl.classList.remove('is-visible');
      setSidebarState(true);
    }
  }

  try {
    stories = await window.StorySite.loadStories();
    renderList();
    openStory(selectedSlug() || (stories[0] && stories[0].slug));
  } catch (error) {
    console.error(error);
    articleEl.innerHTML = '<p class="empty-state">Unable to load stories.</p>';
    listEl.innerHTML = '<p class="empty-state" style="padding:16px;">Unable to load stories.</p>';
  }

  searchEl.addEventListener('input', renderList);
  sortEl.addEventListener('change', renderList);

  if (toggleEl) {
    toggleEl.addEventListener('click', () => {
      const open = toggleEl.getAttribute('aria-expanded') !== 'true';
      setSidebarState(open);
    });
  }

  if (mobileDockEl) {
    mobileDockEl.addEventListener('click', () => {
      const open = mobileDockEl.getAttribute('aria-expanded') !== 'true';
      setSidebarState(open);
    });
  }

  overlayEl.addEventListener('click', () => {
    setSidebarState(false);
  });

  window.addEventListener('popstate', () => {
    const slug = new URL(window.location.href).searchParams.get('story');
    openStory(slug || (stories[0] && stories[0].slug));
    renderList();
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('.story-list-item');
    if (!link) return;

    event.preventDefault();
    const href = new URL(link.href);
    openStory(href.searchParams.get('story'), true);
    renderList();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMobile()) {
      setSidebarState(false);
    }
  });

  syncSidebarForViewport();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      syncSidebarForViewport();
      updateStickyTitleVisibility();
    }, 80);
  });

  window.addEventListener('scroll', updateStickyTitleVisibility, { passive: true });

  if (sidebarEl) {
    sidebarEl.addEventListener('touchmove', (event) => {
      event.stopPropagation();
    }, { passive: true });
  }
});
