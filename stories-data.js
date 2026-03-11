(function () {
  const manifestUrl = 'stories/index.json';

  function stripTags(text) {
    return text.replace(/<[^>]+>/g, '');
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function parseFrontMatter(raw) {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: raw };

    const meta = {};
    match[1].split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      meta[key] = value.replace(/^"|"$/g, '');
    });

    return { meta, body: match[2].trim() };
  }

  function inlineMarkdown(text) {
    return text
      .replace(/\\/g, '&#92;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  }

  function markdownToHtml(md) {
    const lines = md.replace(/\r/g, '').split('\n');
    const html = [];
    let inList = false;
    let listType = 'ul';
    let paragraph = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph = [];
    };

    const closeList = () => {
      if (!inList) return;
      html.push(`</${listType}>`);
      inList = false;
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        closeList();
        return;
      }

      if (/^---+$/.test(trimmed)) {
        flushParagraph();
        closeList();
        html.push('<hr>');
        return;
      }

      const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        closeList();
        const level = heading[1].length;
        html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
        return;
      }

      const blockquote = trimmed.match(/^>\s?(.+)$/);
      if (blockquote) {
        flushParagraph();
        closeList();
        html.push(`<blockquote><p>${inlineMarkdown(blockquote[1])}</p></blockquote>`);
        return;
      }

      const ul = trimmed.match(/^[-*]\s+(.+)$/);
      const ol = trimmed.match(/^\d+\.\s+(.+)$/);

      if (ul || ol) {
        flushParagraph();
        const nextType = ul ? 'ul' : 'ol';

        if (!inList || listType !== nextType) {
          closeList();
          listType = nextType;
          html.push(`<${listType}>`);
          inList = true;
        }

        html.push(`<li>${inlineMarkdown((ul || ol)[1])}</li>`);
        return;
      }

      paragraph.push(trimmed);
    });

    flushParagraph();
    closeList();
    return html.join('\n');
  }

  function formatDate(dateString) {
    const date = new Date(`${dateString}T12:00:00`);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  function estimateReadTime(text) {
    const words = stripTags(text).trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  }

  async function fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return await res.text();
  }

  async function loadStories() {
    const manifestRes = await fetch(manifestUrl);
    if (!manifestRes.ok) throw new Error('Could not load story manifest.');

    const manifest = await manifestRes.json();

    const stories = await Promise.all(
      manifest.stories.map(async (entry) => {
        const raw = await fetchText(entry.file);
        const { meta, body } = parseFrontMatter(raw);
        const html = markdownToHtml(body);

        const title = meta.title || entry.title || 'Untitled Story';
        const slug = entry.slug || meta.slug || slugify(title);
        const excerpt = meta.excerpt || entry.excerpt || '';
        const quote = meta.quote || '';
        const pages = meta.pages || entry.pages || '';
        const pdf = meta.pdf || '';
        const epub = meta.epub || '';
        const date = meta.date || entry.date;
        const readTime = estimateReadTime(body);

        return {
          title,
          slug,
          excerpt,
          quote,
          pages,
          pdf,
          epub,
          date,
          body,
          html,
          readTime
        };
      })
    );

    return stories.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  window.StorySite = {
    loadStories,
    markdownToHtml,
    formatDate,
    estimateReadTime,
    stripTags
  };
})();
