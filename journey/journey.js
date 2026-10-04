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
  principles: document.querySelector('#principle-grid'),
  checkins: document.querySelector('#checkin-grid'),
  checkinResult: document.querySelector('#checkin-result'),
  gateNav: document.querySelector('#gate-nav'),
  gateDetail: document.querySelector('#gate-detail'),
  practices: document.querySelector('#practice-library'),
  paths: document.querySelector('#path-grid'),
  pathDetail: document.querySelector('#path-detail'),
  completedCount: document.querySelector('#completed-count'),
  gateProgress: document.querySelector('#gate-progress'),
  journal: document.querySelector('#journey-journal'),
  journalGateLabel: document.querySelector('#journal-gate-label'),
  saveNote: document.querySelector('#save-note'),
  saveState: document.querySelector('#save-state'),
  readingProgress: document.querySelector('#reading-progress')
};

const STORAGE_KEY = 'rumiInnerJourneyV1';
let journey = null;
let poems = [];
let poemById = new Map();
let activeGateId = 'listen';
let state = {
  completed: [],
  notes: {},
  activeGate: 'listen',
  activePath: ''
};

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    state = {
      completed: Array.isArray(saved.completed) ? saved.completed : [],
      notes: saved.notes && typeof saved.notes === 'object' ? saved.notes : {},
      activeGate: typeof saved.activeGate === 'string' ? saved.activeGate : 'listen',
      activePath: typeof saved.activePath === 'string' ? saved.activePath : ''
    };
  } catch {
    state = { completed: [], notes: {}, activeGate: 'listen', activePath: '' };
  }
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage restrictions should never block reading.
  }
}

function gateById(id) {
  return journey?.gates.find(gate => gate.id === id);
}

function gateForPoem(id) {
  return journey?.gates.find(gate => gate.poems.includes(id));
}

function setUrlParam(key, value) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  history.replaceState({}, '', url);
}

function renderPrinciples() {
  els.principles.innerHTML = journey.principles.map((item, index) =>
    '<article class="principle-card">' +
      '<span>0' + (index + 1) + '</span>' +
      '<h3>' + escapeHtml(item.title) + '</h3>' +
      '<p>' + escapeHtml(item.text) + '</p>' +
    '</article>'
  ).join('');
}

function renderCheckins() {
  els.checkins.innerHTML = journey.checkins.map(item =>
    '<button class="checkin-choice" type="button" data-checkin="' + escapeHtml(item.id) + '" data-gate="' + escapeHtml(item.gate) + '">' +
      escapeHtml(item.label) +
    '</button>'
  ).join('');

  els.checkins.querySelectorAll('[data-checkin]').forEach(button => {
    button.addEventListener('click', () => {
      els.checkins.querySelectorAll('[data-checkin]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');

      const gate = gateById(button.dataset.gate);
      els.checkinResult.hidden = false;
      els.checkinResult.innerHTML =
        '这句话更接近 <strong>' + escapeHtml(gate.title) + ' · ' + escapeHtml(gate.subtitle) + '</strong>。' +
        ' 不代表“你属于这一类”，只是提供一个此刻可以开始的入口。' +
        '<button type="button" data-open-gate="' + escapeHtml(gate.id) + '">进入这扇门 →</button>';

      els.checkinResult.querySelector('[data-open-gate]').addEventListener('click', () => {
        selectGate(gate.id, { scroll: true });
      });
    });
  });
}

function renderGateNav() {
  els.gateNav.innerHTML = journey.gates.map(gate =>
    '<button type="button" data-gate="' + escapeHtml(gate.id) + '" aria-pressed="false">' +
      '<span>' + escapeHtml(gate.number) + '</span>' +
      '<strong>' + escapeHtml(gate.title) + '</strong>' +
    '</button>'
  ).join('');

  els.gateNav.querySelectorAll('[data-gate]').forEach(button => {
    button.addEventListener('click', () => selectGate(button.dataset.gate));
  });
}

function poemCard(id) {
  const poem = poemById.get(id);
  if (!poem) return '';
  return '<div class="gate-poem">' +
    '<small>' + escapeHtml(poem.book) + ' · ' + escapeHtml(poem.lines) + ' 联</small>' +
    '<strong>' + escapeHtml(poem.title) + '</strong>' +
    '<p>' + escapeHtml(poem.excerpt) + '</p>' +
    '<a href="../poetry/#' + encodeURIComponent(poem.id) + '">查看研究卡 →</a>' +
  '</div>';
}

function renderGateDetail(gate) {
  const done = state.completed.includes(gate.id);
  els.gateDetail.innerHTML =
    '<div class="gate-kicker">' +
      '<span>' + escapeHtml(gate.number) + ' · ' + escapeHtml(gate.persian) + '</span>' +
      '<span>' + escapeHtml(gate.motif) + '</span>' +
    '</div>' +
    '<div class="gate-title-row">' +
      '<h3>' + escapeHtml(gate.title) + '</h3>' +
      '<p>' + escapeHtml(gate.subtitle) + '</p>' +
    '</div>' +
    '<p class="gate-summary">' + escapeHtml(gate.summary) + '</p>' +
    '<div class="gate-question">' + escapeHtml(gate.question) + '</div>' +
    '<p class="gate-poems-label">从这些诗进入</p>' +
    '<div class="gate-poems">' + gate.poems.map(poemCard).join('') + '</div>' +
    '<p class="gate-practice-label">五层进入 · 不必一次做完</p>' +
    '<div class="gate-layers">' +
      gate.layers.map(layer =>
        '<div class="gate-layer">' +
          '<span>' + escapeHtml(layer.label) + '</span>' +
          '<p>' + escapeHtml(layer.prompt) + '</p>' +
        '</div>'
      ).join('') +
    '</div>' +
    '<div class="gate-caution"><strong>保持边界：</strong>' + escapeHtml(gate.caution) + '</div>' +
    '<div class="gate-actions">' +
      '<button type="button" class="gate-complete' + (done ? ' done' : '') + '" id="gate-complete">' +
        (done ? '已在这里停留过 ✓' : '标记：我在这里停留过') +
      '</button>' +
      '<a class="gate-journal-link" href="#journal">写下此刻的回应 →</a>' +
    '</div>';

  document.querySelector('#gate-complete')?.addEventListener('click', () => toggleCompleted(gate.id));
}

function updateGateNav() {
  els.gateNav.querySelectorAll('[data-gate]').forEach(button => {
    const active = button.dataset.gate === activeGateId;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function updateJournal(gate) {
  els.journalGateLabel.textContent = '当前：' + gate.title + ' · ' + gate.subtitle;
  els.journal.value = state.notes[gate.id] || '';
  els.saveState.textContent = state.notes[gate.id] ? '已保存' : '尚未书写';
}

function updateProgress() {
  const valid = journey.gates.filter(gate => state.completed.includes(gate.id)).length;
  els.completedCount.textContent = String(valid);
  els.gateProgress.style.width = ((valid / journey.gates.length) * 100) + '%';
}

function selectGate(id, options = {}) {
  const gate = gateById(id);
  if (!gate) return;

  activeGateId = gate.id;
  state.activeGate = gate.id;
  persistState();
  renderGateDetail(gate);
  updateGateNav();
  updateJournal(gate);

  if (options.updateUrl !== false) setUrlParam('gate', gate.id);

  if (options.scroll) {
    document.querySelector('#gates')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function toggleCompleted(id) {
  const index = state.completed.indexOf(id);
  if (index >= 0) state.completed.splice(index, 1);
  else state.completed.push(id);
  persistState();
  renderGateDetail(gateById(id));
  updateProgress();
}

function renderPractices() {
  els.practices.innerHTML = journey.practices.map((practice, index) =>
    '<article class="practice-card">' +
      '<small>0' + (index + 1) + ' · ' + escapeHtml(practice.duration) + '</small>' +
      '<h3>' + escapeHtml(practice.title) + '</h3>' +
      '<p>' + escapeHtml(practice.instruction) + '</p>' +
    '</article>'
  ).join('');
}

function renderPaths() {
  els.paths.innerHTML = journey.paths.map(path =>
    '<article class="path-card" data-path-card="' + escapeHtml(path.id) + '">' +
      '<small>' + escapeHtml(path.label) + '</small>' +
      '<h3>' + escapeHtml(path.title) + '</h3>' +
      '<p>' + escapeHtml(path.summary) + '</p>' +
      '<button type="button" data-path="' + escapeHtml(path.id) + '">展开这条路 →</button>' +
    '</article>'
  ).join('');

  els.paths.querySelectorAll('[data-path]').forEach(button => {
    button.addEventListener('click', () => selectPath(button.dataset.path, { scroll: false }));
  });
}

function selectPath(id, options = {}) {
  const path = journey.paths.find(item => item.id === id);
  if (!path) return;

  state.activePath = id;
  persistState();
  setUrlParam('path', id);

  els.paths.querySelectorAll('[data-path-card]').forEach(card => {
    card.classList.toggle('active', card.dataset.pathCard === id);
  });

  const gates = path.sequence.map(gateById).filter(Boolean);
  els.pathDetail.hidden = false;
  els.pathDetail.innerHTML =
    '<h3>' + escapeHtml(path.title) + '</h3>' +
    '<p>' + escapeHtml(path.structure) + '</p>' +
    '<div class="path-sequence">' +
      gates.map(gate =>
        '<button type="button" data-path-gate="' + escapeHtml(gate.id) + '">' +
          escapeHtml(gate.number) + ' · ' + escapeHtml(gate.title) +
        '</button>'
      ).join('') +
    '</div>';

  els.pathDetail.querySelectorAll('[data-path-gate]').forEach(button => {
    button.addEventListener('click', () => selectGate(button.dataset.pathGate, { scroll: true }));
  });

  if (options.scroll) {
    els.pathDetail.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function bindJournal() {
  els.journal.addEventListener('input', () => {
    els.saveState.textContent = '未保存';
  });

  els.saveNote.addEventListener('click', () => {
    state.notes[activeGateId] = els.journal.value;
    persistState();
    els.saveState.textContent = '已保存';
  });
}

function bindReadingProgress() {
  let ticking = false;

  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    els.readingProgress.style.transform = 'scaleX(' + ratio + ')';
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
}

function selectInitialState() {
  const params = new URLSearchParams(window.location.search);
  const gateParam = params.get('gate');
  const poemParam = params.get('poem');
  const pathParam = params.get('path');

  let initialGate = gateById(gateParam) ? gateParam : state.activeGate;

  if (poemParam) {
    const matchedGate = gateForPoem(poemParam);
    if (matchedGate) initialGate = matchedGate.id;
  }

  if (!gateById(initialGate)) initialGate = 'listen';

  selectGate(initialGate, { updateUrl: false });

  if (pathParam && journey.paths.some(path => path.id === pathParam)) {
    selectPath(pathParam, { scroll: false });
  }
}

async function init() {
  loadState();
  bindReadingProgress();

  try {
    const [journeyResponse, poemResponse] = await Promise.all([
      fetch('../data/inner-journey.json'),
      fetch('../data/poetry-atlas.json')
    ]);

    if (!journeyResponse.ok) throw new Error('Journey HTTP ' + journeyResponse.status);
    if (!poemResponse.ok) throw new Error('Poetry HTTP ' + poemResponse.status);

    journey = await journeyResponse.json();
    poems = await poemResponse.json();
    poemById = new Map(poems.map(poem => [poem.id, poem]));

    renderPrinciples();
    renderCheckins();
    renderGateNav();
    renderPractices();
    renderPaths();
    bindJournal();
    updateProgress();
    selectInitialState();
  } catch (error) {
    console.error(error);
    els.gateDetail.innerHTML = '<div class="gate-loading">内在探索数据暂时无法读取，请稍后刷新页面。</div>';
  }
}

init();
