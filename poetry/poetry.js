const navToggle = document.querySelector('.page-toggle');
const nav = document.querySelector('.page-nav');

navToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.page-nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

const els = {
  search: document.querySelector('#poetry-search'),
  book: document.querySelector('#book-filter'),
  motif: document.querySelector('#motif-filter'),
  grid: document.querySelector('#poetry-grid'),
  count: document.querySelector('#poetry-count'),
  empty: document.querySelector('#poetry-empty'),
};

let entries = [];

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function fillFilters() {
  const books = uniqueSorted(entries.map(entry => entry.book));
  books.forEach(book => {
    const option = document.createElement('option');
    option.value = book;
    option.textContent = book;
    els.book.appendChild(option);
  });

  const motifs = uniqueSorted(entries.flatMap(entry => [...entry.motifs, ...entry.themes]));
  motifs.forEach(motif => {
    const option = document.createElement('option');
    option.value = motif;
    option.textContent = motif;
    els.motif.appendChild(option);
  });
}

function matches(entry) {
  const query = els.search.value.trim().toLocaleLowerCase('zh-CN');
  const book = els.book.value;
  const motif = els.motif.value;

  const haystack = [
    entry.title,
    entry.work,
    entry.book,
    entry.lines,
    entry.excerpt,
    entry.scene,
    entry.symbolism,
    entry.mechanism,
    entry.context,
    entry.question,
    entry.source,
    ...entry.motifs,
    ...entry.themes,
  ].join(' ').toLocaleLowerCase('zh-CN');

  const matchesQuery = !query || haystack.includes(query);
  const matchesBook = !book || entry.book === book;
  const matchesMotif = !motif || entry.motifs.includes(motif) || entry.themes.includes(motif);
  return matchesQuery && matchesBook && matchesMotif;
}

function card(entry) {
  const tags = [...entry.motifs, ...entry.themes]
    .map(tag => '<span class="tag">' + escapeHtml(tag) + '</span>')
    .join('');

  return `
    <article class="poem-entry" id="${escapeHtml(entry.id)}">
      <div class="entry-meta">
        <span>${escapeHtml(entry.book)} · ${escapeHtml(entry.lines)} 联</span>
        <span>${escapeHtml(entry.work)}</span>
      </div>
      <h3>${escapeHtml(entry.title)}</h3>
      <blockquote>${escapeHtml(entry.excerpt)}</blockquote>
      <div class="tags">${tags}</div>

      <details class="entry-more">
        <summary>展开研究卡</summary>
        <dl class="entry-detail">
          <div><dt>意境</dt><dd>${escapeHtml(entry.scene)}</dd></div>
          <div><dt>象征</dt><dd>${escapeHtml(entry.symbolism)}</dd></div>
          <div><dt>比喻机制</dt><dd>${escapeHtml(entry.mechanism)}</dd></div>
          <div><dt>文本语境</dt><dd>${escapeHtml(entry.context)}</dd></div>
        </dl>
        <div class="entry-question"><strong>让诗照见我</strong><br>${escapeHtml(entry.question)}</div>
        <div class="entry-source">出处：${escapeHtml(entry.source)}</div>
      </details>
    </article>
  `;
}

function render() {
  const filtered = entries.filter(matches);
  els.grid.innerHTML = filtered.map(card).join('');
  els.count.textContent = `显示 ${filtered.length} / ${entries.length} 条可追溯诗段`;
  els.empty.hidden = filtered.length !== 0;
}

async function init() {
  try {
    const response = await fetch('../data/poetry-atlas.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    entries = await response.json();
    fillFilters();

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query) els.search.value = query;

    render();
  } catch (error) {
    console.error(error);
    els.count.textContent = '诗歌数据库暂时无法读取。';
    els.empty.hidden = false;
    els.empty.textContent = '数据加载失败，请稍后刷新页面。';
  }
}

els.search?.addEventListener('input', render);
els.book?.addEventListener('change', render);
els.motif?.addEventListener('change', render);

init();
