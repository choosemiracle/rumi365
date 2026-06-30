const monthNamesZh = {
  January: "一月",
  February: "二月",
  March: "三月",
  April: "四月",
  May: "五月",
  June: "六月",
  July: "七月",
  August: "八月",
  September: "九月",
  October: "十月",
  November: "十一月",
  December: "十二月",
};

const weekdayZh = {
  Monday: "星期一",
  Tuesday: "星期二",
  Wednesday: "星期三",
  Thursday: "星期四",
  Friday: "星期五",
  Saturday: "星期六",
  Sunday: "星期日",
};

const inquiries = [
  {
    en: "What word or image in today's reading touches the most honest place in you?",
    zh: "今日文字里，哪一个词或意象触碰了你里面最真实的地方？",
  },
  {
    en: "Where does this passage invite you to loosen control and return to the heart?",
    zh: "这段话邀请你在哪件事上松开掌控，重新回到心？",
  },
  {
    en: "What attachment, fear, or old identity is being named by this reading?",
    zh: "这段文字照见了你怎样的执着、恐惧，或旧有身份？",
  },
  {
    en: "If this reading became a prayer, what would it ask from the Beloved?",
    zh: "若把这段文字化为祈祷，它会向挚爱者求什么？",
  },
  {
    en: "What would be different today if you trusted this teaching for one small action?",
    zh: "如果今天用一个小行动来信任这份教导，会有什么不同？",
  },
];

const practices = [
  {
    en: "Read the passage aloud twice. After the second reading, sit in silence for five minutes and write one sentence.",
    zh: "把今日文字朗读两遍。第二遍之后静坐五分钟，再写下一句话。",
  },
  {
    en: "Copy one line by hand. Let the handwriting slow your breath and reveal what the mind skips.",
    zh: "手抄其中一句。让笔迹放慢呼吸，也让心看见头脑匆匆略过之处。",
  },
  {
    en: "Choose one phrase as a mantra. Carry it through a walk, a meal, or a difficult conversation.",
    zh: "选一句作为今日默念。带着它散步、用餐，或进入一次不容易的交谈。",
  },
  {
    en: "Place one hand on the heart. Ask, 'What is this teaching asking me to release?' Wait before answering.",
    zh: "一只手放在心口，问：“这份教导请我释放什么？”先等待，再回答。",
  },
  {
    en: "Turn the reading into a blessing for yourself and one other person.",
    zh: "把今日文字化作祝福，送给自己，也送给另一个人。",
  },
];

const els = {
  body: document.body,
  todayButton: document.querySelector("#todayButton"),
  dayTitle: document.querySelector("#dayTitle"),
  readingDate: document.querySelector("#readingDate"),
  poemEn: document.querySelector("#poemEn"),
  poemZh: document.querySelector("#poemZh"),
  inquiryEn: document.querySelector("#inquiryEn"),
  inquiryZh: document.querySelector("#inquiryZh"),
  practiceEn: document.querySelector("#practiceEn"),
  practiceZh: document.querySelector("#practiceZh"),
  journal: document.querySelector("#journal"),
  saveButton: document.querySelector("#saveButton"),
  clearButton: document.querySelector("#clearButton"),
  saveState: document.querySelector("#saveState"),
  progressCount: document.querySelector("#progressCount"),
  progressBar: document.querySelector("#progressBar"),
  languageButtons: document.querySelectorAll("[data-lang]"),
  shareButton: document.querySelector("#shareButton"),
  posterOutput: document.querySelector("#posterOutput"),
  posterPreview: document.querySelector("#posterPreview"),
  downloadPoster: document.querySelector("#downloadPoster"),
  shareStatus: document.querySelector("#shareStatus"),
};

let records = [];
let dailyEntries = [];
let currentDay = 1;
let language = localStorage.getItem("rumi365-language") || "both";
let currentEntry = null;
let currentInquiry = null;
let currentPractice = null;
let posterBackground = null;
let currentDate = new Date();

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.max(1, Math.floor(diff / 86400000));
}

function entryDayForDate(date) {
  if (!dailyEntries.length) return 1;
  return ((dayOfYear(date) - 1) % dailyEntries.length) + 1;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function pick(list, day, offset = 0) {
  return list[(day * 7 + offset) % list.length];
}

function render(day) {
  if (!dailyEntries.length) return;
  const maxDay = dailyEntries.length;
  currentDay = Math.min(maxDay, Math.max(1, Number(day) || 1));
  const entry = dailyEntries[currentDay - 1];
  const inquiry = pick(inquiries, currentDay, 2);
  const practice = pick(practices, currentDay, 4);
  currentEntry = entry;
  currentInquiry = inquiry;
  currentPractice = practice;

  els.dayTitle.textContent = "今日诗歌";
  els.readingDate.textContent = formatDisplayDate(currentDate);
  els.poemEn.textContent = entry.quoteEn;
  els.poemZh.textContent =
    entry.quoteZh ||
    "中文译写待补：英文原文已按附件书籍抽取。请运行 scripts/translate_rumi_days.py 或手动补入 quoteZh 字段。";
  els.inquiryEn.textContent = inquiry.en;
  els.inquiryZh.textContent = inquiry.zh;
  els.practiceEn.textContent = practice.en;
  els.practiceZh.textContent = practice.zh;
  els.journal.value = localStorage.getItem(journalKey(currentDay)) || "";
  els.saveState.textContent = "已保存";
  updateProgress();
}

function journalKey(day) {
  return `rumi365-journal-${day}`;
}

function saveJournal() {
  const text = els.journal.value.trim();
  if (text) {
    localStorage.setItem(journalKey(currentDay), els.journal.value);
  } else {
    localStorage.removeItem(journalKey(currentDay));
  }
  els.saveState.textContent = "已保存";
  updateProgress();
}

function updateProgress() {
  let count = 0;
  for (let day = 1; day <= dailyEntries.length; day += 1) {
    if ((localStorage.getItem(journalKey(day)) || "").trim()) count += 1;
  }
  els.progressCount.textContent = `${count} / ${dailyEntries.length}`;
  els.progressBar.style.width = `${dailyEntries.length ? (count / dailyEntries.length) * 100 : 0}%`;
}

function setLanguage(nextLanguage) {
  language = nextLanguage;
  localStorage.setItem("rumi365-language", language);
  els.body.classList.toggle("lang-zh", language === "zh");
  els.body.classList.toggle("lang-en", language === "en");
  els.languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === language);
  });
}

function getShareUrl() {
  return window.location.href.split("#")[0];
}

function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  const paragraphs = String(text || "").split(/\n+/);
  paragraphs.forEach((paragraph) => {
    const value = paragraph.trim();
    if (!value) {
      lines.push("");
      return;
    }
    const hasCjk = /[\u3400-\u9fff]/.test(value);
    const tokens = hasCjk ? [...value] : value.split(/(\s+)/);
    let line = "";
    tokens.forEach((token) => {
      const testLine = line + token;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line.trimEnd());
        line = token.trimStart();
      } else {
        line = testLine;
      }
    });
    if (line) lines.push(line.trimEnd());
  });
  return lines;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, options = {}) {
  const lines = wrapLines(ctx, text, maxWidth);
  const maxLines = options.maxLines || lines.length;
  const visible = lines.slice(0, maxLines);
  visible.forEach((line, index) => {
    let output = line;
    if (index === visible.length - 1 && lines.length > maxLines) {
      output = `${line.replace(/[。.!?！？；;，,、]*$/, "")}...`;
    }
    ctx.fillText(output, x, y);
    y += line ? lineHeight : lineHeight * 0.55;
  });
  return y;
}

function drawPosterQr(ctx, url, x, y, size) {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  const count = qr.getModuleCount();
  const cell = size / count;
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(x - 16, y - 16, size + 32, size + 32);
  ctx.fillStyle = "#202124";
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) {
        ctx.fillRect(x + col * cell, y + row * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function posterSections() {
  const sections = [];
  if (language !== "en") {
    sections.push({ label: "诗性默想", text: currentEntry?.quoteZh || "", font: "36px 'Noto Serif SC', serif", line: 58 });
    sections.push({ label: "内在提问", text: currentInquiry?.zh || "", font: "29px 'Noto Serif SC', serif", line: 46 });
    sections.push({ label: "今日练习", text: currentPractice?.zh || "", font: "29px 'Noto Serif SC', serif", line: 46 });
  }
  if (language !== "zh") {
    sections.push({ label: "Poetic Meditation", text: currentEntry?.quoteEn || "", font: "28px Georgia, serif", line: 43 });
    sections.push({ label: "Inner Inquiry", text: currentInquiry?.en || "", font: "24px Georgia, serif", line: 37 });
    sections.push({ label: "Practice", text: currentPractice?.en || "", font: "24px Georgia, serif", line: 37 });
  }
  return sections;
}

async function generatePoster() {
  if (!currentEntry) return;
  els.shareStatus.textContent = "正在生成海报...";
  try {
    if (!posterBackground) {
      posterBackground = await loadImage("assets/sufi-whirl-poster.png");
    }
  } catch (error) {
    els.shareStatus.textContent = "背景图加载失败，请刷新后重试";
    return;
  }

  const width = 1080;
  const margin = 88;
  const contentWidth = width - margin * 2;
  const qrSize = 178;
  const measure = document.createElement("canvas").getContext("2d");
  const sections = posterSections();
  let estimatedHeight = 310;
  sections.forEach((section) => {
    measure.font = section.font;
    estimatedHeight += 46 + wrapLines(measure, section.text, contentWidth).length * section.line + 30;
  });
  const height = Math.max(1500, Math.min(2600, estimatedHeight + 260));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const veil = ctx.createLinearGradient(0, 0, 0, height);
  veil.addColorStop(0, "#fffaf1");
  veil.addColorStop(0.58, "#fbf1e1");
  veil.addColorStop(1, "#ead6bb");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(31, 111, 106, 0.08)";
  ctx.beginPath();
  ctx.arc(width - 110, 130, 210, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(195, 146, 46, 0.12)";
  ctx.beginPath();
  ctx.arc(68, height - 95, 250, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 253, 248, 0.72)";
  ctx.fillRect(56, 52, width - 112, height - 104);
  ctx.strokeStyle = "rgba(222, 210, 189, 0.92)";
  ctx.lineWidth = 2;
  ctx.strokeRect(56, 52, width - 112, height - 104);

  const figureX = margin;
  const figureY = 78;
  const figureWidth = 230;
  const figureHeight = 288;
  ctx.save();
  ctx.shadowColor = "rgba(77, 52, 29, 0.2)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 18;
  ctx.drawImage(posterBackground, figureX, figureY, figureWidth, figureHeight);
  ctx.restore();

  const titleX = figureX + figureWidth + 36;
  ctx.fillStyle = "#a14f2a";
  ctx.font = "800 22px Inter, sans-serif";
  ctx.fillText("Rumi 365 Daily Practice", titleX, 126);
  ctx.fillStyle = "#202124";
  ctx.font = "700 66px 'Noto Serif SC', Georgia, serif";
  ctx.fillText("鲁米诗歌365", titleX, 208);
  ctx.font = "600 30px Inter, sans-serif";
  ctx.fillStyle = "#65625d";
  ctx.fillText("365 Days with Rumi", titleX, 258);
  ctx.font = "600 26px 'Noto Serif SC', Inter, sans-serif";
  ctx.fillStyle = "#a14f2a";
  ctx.fillText(formatDisplayDate(currentDate), titleX, 304);

  let y = 456;
  sections.forEach((section) => {
    ctx.fillStyle = "#1f6f6a";
    ctx.font = "800 21px Inter, sans-serif";
    ctx.fillText(section.label, margin, y);
    y += 42;
    ctx.fillStyle = "#202124";
    ctx.font = section.font;
    y = drawWrappedText(ctx, section.text, margin, y, contentWidth, section.line, {
      maxLines: section.label === "Poetic Meditation" || section.label === "诗性默想" ? 13 : 5,
    });
    y += 38;
  });

  const footerY = height - 235;
  ctx.strokeStyle = "#ded2bd";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, footerY);
  ctx.lineTo(width - margin, footerY);
  ctx.stroke();

  const url = getShareUrl();
  drawPosterQr(ctx, url, width - margin - qrSize, footerY + 38, qrSize);
  ctx.fillStyle = "#65625d";
  ctx.font = "600 22px Inter, sans-serif";
  ctx.fillText("长按二维码访问网站", margin, footerY + 88);
  ctx.font = "500 20px Inter, sans-serif";
  drawWrappedText(ctx, url, margin, footerY + 128, width - margin * 2 - qrSize - 42, 30, { maxLines: 2 });

  const dataUrl = canvas.toDataURL("image/png");
  els.posterPreview.src = dataUrl;
  els.downloadPoster.href = dataUrl;
  els.posterOutput.hidden = false;
  els.shareStatus.textContent = "右下角二维码可长按访问网站";
}

async function loadData() {
  const response = await fetch("data/rumi-days.json");
  if (!response.ok) throw new Error(`Unable to load data: ${response.status}`);
  records = await response.json();
  dailyEntries = records.filter((item) => item.type === "day");
  setLanguage(language);
  currentDate = new Date();
  render(entryDayForDate(currentDate));
}

els.todayButton.addEventListener("click", () => {
  currentDate = new Date();
  render(entryDayForDate(currentDate));
});
els.shareButton.addEventListener("click", generatePoster);
els.saveButton.addEventListener("click", saveJournal);
els.clearButton.addEventListener("click", () => {
  els.journal.value = "";
  saveJournal();
});
els.journal.addEventListener("input", () => {
  els.saveState.textContent = "未保存";
});
els.journal.addEventListener("blur", saveJournal);
els.languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});

loadData().catch((error) => {
  els.dayTitle.textContent = "数据加载失败";
  els.poemZh.textContent = "请通过本地服务器访问页面，例如 python3 -m http.server 4187。";
  els.poemEn.textContent = error.message;
});
