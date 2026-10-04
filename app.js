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

document.querySelectorAll('.theme-grid button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-grid button').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    document.querySelector('.theme-result').textContent =
      '已选择「' + btn.dataset.theme + '」。下一版将优先把这一主题接入可追溯的诗歌条目与内在探索问题。';
  });
});

const journeys = {
  '7': {
    title: '7天 · 第一次遇见鲁米',
    items: ['芦笛｜我从哪里来？','渴望｜我真正寻找什么？','沙姆斯｜谁曾真正看见我？','镜子｜我如何看见自己？','静默｜当语言停止，什么仍在？','爱｜谁是爱者？谁是被爱者？','归返｜我正在回到哪里？']
  },
  '21': {
    title: '21天 · 与鲁米一起向内',
    items: ['寻找｜承认我正在寻找','相遇｜允许另一个人改变我','失去｜不急着填补空缺','空｜与不知道共处','爱｜从占有走向给予','消融｜松开固着的自我','返回｜把领悟带回关系与日常']
  },
  '40': {
    title: '40天 · 鲁米之路',
    items: ['第一阶段｜渴望与召唤','第二阶段｜相遇与友谊','第三阶段｜失去与破碎','第四阶段｜静默与净化','第五阶段｜爱与消融','第六阶段｜归返与服务']
  }
};

document.querySelectorAll('[data-journey]').forEach(link => {
  link.addEventListener('click', () => {
    const journey = journeys[link.dataset.journey];
    const box = document.querySelector('.journey-detail');
    box.querySelector('h3').textContent = journey.title;
    box.querySelector('ol').innerHTML = journey.items.map(item => '<li><strong>' + item.split('｜')[0] + '</strong>｜' + item.split('｜')[1] + '</li>').join('');
  });
});

document.getElementById('check-quote')?.addEventListener('click', () => {
  const result = document.getElementById('quote-result');
  result.textContent = '第一版只展示辨伪机制，不对这句话自动下结论。正式条目会显示：原典可查 / 意译 / 改写 / 尚未找到可靠原典，并附版本依据。';
});
