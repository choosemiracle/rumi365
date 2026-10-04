const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.main-nav');

navToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.main-nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab)?.classList.add('active');
  });
});

const themeQueries = {
  '离别与渴望': '渴望',
  '爱': '爱',
  '友谊与沙姆斯': '关系',
  '自我与小我': '自我',
  '静默': '心',
  '困惑与惊奇': '认知',
  '痛苦与破碎': '离别',
  '死亡与重生': '转化',
  '归返': '归返',
  '合一': '合一',
  '音乐与身体': '声音',
  '日常生活': '关系',
};

document.querySelectorAll('.theme-grid button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-grid button').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    const theme = btn.dataset.theme;
    const query = themeQueries[theme] || theme;
    document.querySelector('.theme-result').innerHTML =
      '已选择「' + theme + '」。<a href="./poetry/?q=' + encodeURIComponent(query) + '">进入诗歌数据库继续查看 →</a>';
  });
});

document.getElementById('check-quote')?.addEventListener('click', () => {
  const result = document.getElementById('quote-result');
  result.textContent = '当前正在建设可追溯的辨伪索引。没有足够文本证据时，将明确标注“尚待核实”，而不是把网络流传语直接归给鲁米。';
});

const scrollThread = document.querySelector('.scroll-thread span');
let scrollTicking = false;

function updateScrollThread() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  if (scrollThread) scrollThread.style.transform = 'scaleX(' + ratio + ')';
  scrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(updateScrollThread);
    scrollTicking = true;
  }
}, { passive: true });
updateScrollThread();

const revealTargets = document.querySelectorAll(
  '.section-heading, .portal-card, .poem-card, .method-visual, .method-copy, .route-figure, .timeline article, .shams-art, .shams-copy, .theme-grid, .journey-gates-preview, .journey-grid article, .journey-home-cta, .lab-grid article, .research-rules, .data-card, .database-cta, .daily-image, .daily-copy, .quote-check-inner, .principles blockquote'
);

revealTargets.forEach(el => el.setAttribute('data-reveal', ''));

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  revealTargets.forEach(el => revealObserver.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('in-view'));
}

const journeyLinks = [...document.querySelectorAll('[data-journey-section]')];
const journeySections = journeyLinks
  .map(link => document.getElementById(link.dataset.journeySection))
  .filter(Boolean);

if (journeySections.length && 'IntersectionObserver' in window) {
  const railObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0];
    if (!visible) return;
    journeyLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.journeySection === visible.target.id);
    });
  }, { rootMargin: '-25% 0px -55% 0px', threshold: 0 });
  journeySections.forEach(section => railObserver.observe(section));
  journeyLinks[0]?.classList.add('active');
}
