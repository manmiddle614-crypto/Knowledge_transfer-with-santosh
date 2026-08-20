const navbar     = document.getElementById('navbar');
const hamburger  = document.getElementById('hamburger');
const navLinks   = document.getElementById('navLinks');
const backToTop  = document.getElementById('backToTop');
const links      = navLinks.querySelectorAll('a[href^="#"]');

// ── Navbar scroll ──────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  navbar.style.boxShadow = y > 10 ? '0 4px 20px rgba(0,0,0,.12)' : '0 2px 12px rgba(0,0,0,.06)';
  navbar.classList.toggle('scrolled', y > 40);
  backToTop.classList.toggle('visible', y > 400);
  setActiveLink();
});

// ── Hamburger ─────────────────────────────────────────────────────
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('open');
});
links.forEach(link => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');
}));

// ── Active nav link ────────────────────────────────────────────────
function setActiveLink() {
  const scrollY = window.scrollY + 80;
  links.forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (!section) return;
    link.classList.toggle('active', scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight);
  });
}
const style = document.createElement('style');
style.textContent = '.nav-links a.active { color: var(--blue); background: var(--gray-100); }';
document.head.appendChild(style);
setActiveLink();

// ── Back to top ────────────────────────────────────────────────────
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── Scroll reveal ──────────────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Counter animation ──────────────────────────────────────────────
function animateCounter(el) {
  const target = +el.dataset.target;
  const step = target / (1800 / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { el.textContent = target.toLocaleString(); clearInterval(timer); }
    else el.textContent = Math.floor(current).toLocaleString();
  }, 16);
}
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.hstat-num').forEach(animateCounter);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ── Ticker ─────────────────────────────────────────────────────────
const tickerSpan = document.querySelector('.ticker-track span');
if (tickerSpan) {
  const clone = tickerSpan.cloneNode(true);
  tickerSpan.parentElement.appendChild(clone);
}

// ── Live Current Affairs ───────────────────────────────────────────
const RSS2JSON = 'https://api.rss2json.com/v1/api.json?api_key=9dfyevxdcuvulr0lvtnc8vuyw4pyeevoo9ycgfxq&rss_url=';
const FEEDS = {
  national:      'https://feeds.feedburner.com/ndtvnews-india-news',
  international: 'https://feeds.feedburner.com/ndtvnews-world-news',
  economy:       'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
  science:       'https://timesofindia.indiatimes.com/rssfeeds/2886704.cms',
  schemes:       'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3',
  karnataka:     'https://www.thehindu.com/news/national/karnataka/feeder/default.rss'
};
const CAT_LABELS = {
  national: 'National', international: 'International', economy: 'Economy',
  science: 'Science & Tech', schemes: 'Govt. Schemes', karnataka: 'Karnataka'
};
const caGrid        = document.getElementById('caGrid');
const caLastUpdated = document.getElementById('caLastUpdated');
const caTabs        = document.querySelectorAll('.ca-tab');
let   activeTab     = 'national';
const cache         = {};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1)    return 'Just now';
  if (diff < 60)   return diff + 'm ago';
  if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
  return Math.floor(diff / 1440) + 'd ago';
}

function renderNews(items, cat) {
  if (!items || !items.length) {
    caGrid.innerHTML = '<div class="ca-loading">No news available right now.</div>';
    return;
  }
  caGrid.innerHTML = items.slice(0, 6).map(item => `
    <div class="card ca-card reveal">
      <div class="ca-header">
        <span class="ca-cat ${cat}">${CAT_LABELS[cat]}</span>
        <span class="ca-date"><i class="far fa-calendar-alt"></i> ${timeAgo(item.pubDate)}</span>
      </div>
      <h4>${item.title}</h4>
      <p>${(item.description || '').replace(/<[^>]+>/g, '').slice(0, 120)}...</p>
      <a href="${item.link}" target="_blank" rel="noopener" class="ca-link">Read More <i class="fas fa-chevron-right"></i></a>
    </div>`).join('');
  caGrid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  caLastUpdated.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
}

async function loadNews(cat) {
  if (cache[cat]) { renderNews(cache[cat], cat); return; }
  caGrid.innerHTML = '<div class="ca-loading"><i class="fas fa-spinner fa-spin"></i> Loading latest news...</div>';
  try {
    const res  = await fetch(RSS2JSON + encodeURIComponent(FEEDS[cat]) + '&count=6');
    const data = await res.json();
    if (data.status === 'ok') { cache[cat] = data.items; renderNews(data.items, cat); }
    else throw new Error();
  } catch {
    caGrid.innerHTML = '<div class="ca-loading"><i class="fas fa-exclamation-circle"></i> Could not load news. Check your connection.</div>';
  }
}
caTabs.forEach(tab => tab.addEventListener('click', () => {
  caTabs.forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  activeTab = tab.dataset.feed;
  loadNews(activeTab);
}));
loadNews(activeTab);
setInterval(() => { cache[activeTab] = null; loadNews(activeTab); }, 600000);

// ── Modal Data ─────────────────────────────────────────────────────
const MODAL_DATA = {
  // ── EXAM MODALS ──
  upsc: {
    icon: 'fas fa-university', title: 'UPSC – Civil Services',
    meta: 'Union Public Service Commission &nbsp;|&nbsp; Prelims · Mains · Interview',
    subjects: ['History','Geography','Indian Polity','Economy','Science & Tech','Environment','Ethics','Current Affairs','CSAT'],
    books: ['NCERT (Class 6–12) – All subjects','Indian Polity – M. Laxmikanth','Indian Economy – Ramesh Singh','Certificate Physical & Human Geography – G.C. Leong','India\'s Struggle for Independence – Bipan Chandra'],
    tip: 'Start with NCERTs to build a strong base. Focus on answer writing from Day 1. Revise current affairs daily.'
  },
  kpsc: {
    icon: 'fas fa-map-marked-alt', title: 'KPSC – Karnataka PSC',
    meta: 'Karnataka Public Service Commission &nbsp;|&nbsp; Posts: KAS, FDA, SDA, Group C & D',
    subjects: ['Karnataka History & Culture','Indian Polity & Karnataka Polity','Geography of Karnataka','Economy','General Science','Current Affairs – Karnataka Focus'],
    books: ['Karnataka History – Suryanath Kamath','NCERT Polity + Laxmikanth','Karnataka Geography – State Board Books','General Studies Manual – TMH','Pratiyogita Darpan (Monthly)'],
    tip: 'Give extra attention to Karnataka-specific topics — history, geography, culture and state government schemes. These carry high weightage in KPSC.'
  },
  police: {
    icon: 'fas fa-shield-alt', title: 'Police Constable – Karnataka',
    meta: 'Karnataka State Police &nbsp;|&nbsp; Conducted by: Karnataka Police Recruitment Board',
    subjects: ['General Knowledge','Karnataka GK & Current Affairs','Reasoning & Mental Ability','Basic Mathematics','Kannada Language','Physical Fitness'],
    books: ['Karnataka Police Constable Guide – Standard Publisher','Lucent\'s General Knowledge','R.S. Aggarwal – Reasoning','Karnataka State Board Kannada Textbooks'],
    tip: 'Focus on Karnataka-specific GK, current affairs and Kannada. Physical fitness preparation should run parallel to academics.'
  },
  psi: {
    icon: 'fas fa-user-shield', title: 'PSI – Police Sub-Inspector',
    meta: 'Karnataka Police Sub-Inspector &nbsp;|&nbsp; Conducted by: KPSC / Police Recruitment Board',
    subjects: ['Indian Constitution & Law','Karnataka Police Act','General Studies','Reasoning','Current Affairs','Karnataka GK'],
    books: ['Indian Penal Code (IPC) – Bare Act','Karnataka Police Act','Laxmikanth – Indian Polity','PSI Guide – Standard Karnataka Publisher','Lucent\'s GK'],
    tip: 'Law papers (IPC, CrPC, Karnataka Police Act) are unique to PSI. Dedicate at least 40% of your time to legal subjects.'
  },
  ssc: {
    icon: 'fas fa-flag', title: 'SSC – Staff Selection Commission',
    meta: 'Staff Selection Commission &nbsp;|&nbsp; Exams: CGL, CHSL, MTS, CPO',
    subjects: ['Quantitative Aptitude','English Language','General Intelligence & Reasoning','General Awareness','Computer Knowledge'],
    books: ['Quantitative Aptitude – R.S. Aggarwal','English – SP Bakshi (Arihant)','Reasoning – R.S. Aggarwal','Lucent\'s General Knowledge','SSC Previous Year Papers – Kiran Publication'],
    tip: 'Speed and accuracy are key for SSC. Practice at least 50 questions daily in Quant and Reasoning. Previous year papers are the best resource.'
  },
  banking: {
    icon: 'fas fa-piggy-bank', title: 'Banking – IBPS / SBI / RBI',
    meta: 'IBPS PO, Clerk &nbsp;|&nbsp; SBI PO, Clerk &nbsp;|&nbsp; RBI Grade B &nbsp;|&nbsp; NABARD',
    subjects: ['Quantitative Aptitude','Reasoning Ability','English Language','General Awareness & Banking','Computer Aptitude','Data Interpretation'],
    books: ['Quantitative Aptitude – R.S. Aggarwal','Reasoning – M.K. Pandey','Banking Awareness – Arihant','English – Wren & Martin','Manorama Yearbook (GK)'],
    tip: 'Banking exams are highly competitive. Focus on Data Interpretation and Banking Awareness. Follow RBI, SEBI and Finance Ministry news regularly.'
  },
  others: {
    icon: 'fas fa-layer-group', title: 'Other Competitive Exams',
    meta: 'Railways (RRB) &nbsp;|&nbsp; Defence (NDA/CDS) &nbsp;|&nbsp; State PSCs &nbsp;|&nbsp; Teaching Exams',
    subjects: ['General Knowledge & Current Affairs','Mathematics / Quantitative Aptitude','Reasoning','English / Regional Language','Subject-Specific Papers'],
    books: ['Lucent\'s General Knowledge','R.S. Aggarwal – Maths & Reasoning','Previous Year Papers (Exam-specific)','NCERT Books (Class 6–12)','Arihant Exam-Specific Guides'],
    tip: 'Each exam has a unique syllabus. Download the official notification first, map the syllabus, then pick resources. Avoid studying everything — be exam-specific.'
  },

  // ── RESOURCE MODALS ──
  ncert: {
    icon: 'fas fa-book', title: 'NCERT Notes',
    meta: 'Simplified subject-wise notes from NCERT Class 6–12 textbooks',
    tags: ['History (6–12)','Geography (6–12)','Polity (6–12)','Economy (9–12)','Science (6–10)','Biology (11–12)'],
    steps: ['Start with Class 6–8 for basic concepts','Move to Class 9–10 for intermediate depth','Cover Class 11–12 for advanced topics','Revise using short summary notes before exam'],
    stepsLabel: 'How to Use',
    tip: 'NCERT is the backbone of UPSC and KPSC preparation. Read them at least twice — once for understanding, once for retention. Don\'t skip diagrams and maps.'
  },
  currentaffairs: {
    icon: 'fas fa-newspaper', title: 'Current Affairs',
    meta: 'Monthly exam-relevant current affairs compilations',
    tags: ['National','International','Economy & Finance','Science & Technology','Govt. Schemes','Karnataka Affairs','Sports & Awards','Environment'],
    steps: ['The Hindu / Indian Express – daily reading','PIB (Press Information Bureau) – government schemes','Knowledge Transfer YouTube – daily CA videos','Monthly magazine compilation for revision'],
    stepsLabel: 'Best Sources to Follow',
    tip: 'Don\'t try to memorise everything. Focus on understanding the context of each event. Link current affairs to static topics.'
  },
  pyq: {
    icon: 'fas fa-file-alt', title: 'Previous Year Questions',
    meta: 'Solved PYQs with explanations for all major competitive exams',
    tags: ['UPSC Prelims & Mains','KPSC KAS','Police Constable','PSI','SSC CGL / CHSL','IBPS PO / Clerk','SBI PO'],
    steps: ['Solve last 10 years papers for your target exam','Analyse wrong answers — understand the concept','Identify repeating topics and prioritise them','Time yourself — simulate real exam conditions'],
    stepsLabel: 'How to Practise PYQs',
    tip: 'PYQs are the single most important resource for any competitive exam. They reveal the examiner\'s mindset. Solve them topic-wise first, then full papers as mock tests.'
  },
  studyplan: {
    icon: 'fas fa-calendar-check', title: 'Study Plans',
    meta: 'Structured weekly & monthly schedules tailored for each exam',
    tags: ['UPSC 12-Month Plan','KPSC 6-Month Plan','Police Constable 3-Month Plan','PSI 4-Month Plan','SSC 3-Month Plan','Banking 2-Month Plan'],
    steps: ['Morning (2 hrs) – Static subject study (History / Polity / Geography)','Afternoon (1.5 hrs) – Current affairs + newspaper reading','Evening (1.5 hrs) – Practice questions / PYQs','Night (30 min) – Revision of the day\'s topics'],
    stepsLabel: 'Daily Schedule Framework',
    tip: 'A study plan only works if it\'s realistic. Don\'t plan 12 hours a day. Plan 5–6 focused hours with breaks. Consistency over intensity — every single day.'
  },
  strategy: {
    icon: 'fas fa-lightbulb', title: 'Exam Strategies',
    meta: 'Proven techniques for time management, revision and exam-day performance',
    tags: ['Syllabus Mapping','Time Management','Note-Making','Revision Cycles','Mock Tests','Exam-Day Mindset','Answer Writing'],
    steps: ['Map the syllabus first — know what to study and what to skip','Make short notes while studying — don\'t re-read, revise notes','Take a mock test every week — analyse performance honestly','Use spaced repetition — revise Day 1 → Day 7 → Day 30','Sleep 7 hours — memory consolidation happens during sleep'],
    stepsLabel: 'Top 5 Strategies',
    tip: 'Most aspirants fail not because of lack of knowledge but lack of strategy. Know your exam pattern deeply. Allocate time based on marks weightage, not personal interest.'
  },
  impq: {
    icon: 'fas fa-star', title: 'Important Questions',
    meta: 'High-probability questions curated from syllabus analysis and past trends',
    tags: ['Factual MCQs','Conceptual MCQs','Statement-Based','Match the Following','Assertion & Reason','Map-Based','Current Affairs MCQs'],
    steps: ['Indian Polity – Constitutional Articles, Amendments, Bodies','Modern History – Freedom Struggle, Acts, Personalities','Geography – Rivers, Soils, Climate, National Parks','Economy – Budget terms, RBI, Banking, Schemes','Science – Diseases, Space missions, Inventions'],
    stepsLabel: 'High-Weightage Topics',
    tip: 'Focus on topics that appear repeatedly across years. A question on Fundamental Rights is more likely than an obscure fact. Quality over quantity — understand, don\'t just memorise.'
  }
};

// ── Modal Engine ───────────────────────────────────────────────────
const modalOverlay = document.getElementById('modalOverlay');
const modalBox     = document.getElementById('modalBox');
const modalClose   = document.getElementById('modalClose');
const modalBody    = document.getElementById('modalBody');

function buildExamModal(d) {
  return `
    <div class="modal-header">
      <div class="modal-icon"><i class="${d.icon}"></i></div>
      <div><h2>${d.title}</h2><p>${d.meta}</p></div>
    </div>
    <div class="modal-section">
      <h4><i class="fas fa-list-check"></i> Key Subjects</h4>
      <div class="modal-tags">${d.subjects.map(s => `<span class="modal-tag">${s}</span>`).join('')}</div>
    </div>
    <div class="modal-section">
      <h4><i class="fas fa-book"></i> Recommended Books</h4>
      <div class="modal-books">${d.books.map(b => `<div class="modal-book"><i class="fas fa-bookmark"></i>${b}</div>`).join('')}</div>
    </div>
    <div class="modal-section">
      <h4><i class="fas fa-lightbulb"></i> Preparation Tip</h4>
      <div class="modal-tip">${d.tip}</div>
    </div>
    <div class="modal-footer">
      <a href="https://youtube.com/@knowledge_transferwithsantosh?si=KgIuS79HhXwxcxQW" target="_blank" rel="noopener" class="btn btn-yt" style="width:100%;justify-content:center;">
        <i class="fab fa-youtube"></i> Watch ${d.title.split('–')[0].trim()} Videos on YouTube
      </a>
    </div>`;
}

function buildResourceModal(d) {
  return `
    <div class="modal-header">
      <div class="modal-icon"><i class="${d.icon}"></i></div>
      <div><h2>${d.title}</h2><p>${d.meta}</p></div>
    </div>
    <div class="modal-section">
      <h4><i class="fas fa-tags"></i> What's Covered</h4>
      <div class="modal-tags">${d.tags.map(t => `<span class="modal-tag">${t}</span>`).join('')}</div>
    </div>
    <div class="modal-section">
      <h4><i class="fas fa-circle-check"></i> ${d.stepsLabel}</h4>
      <div class="modal-books">${d.steps.map(s => `<div class="modal-book"><i class="fas fa-circle-check"></i>${s}</div>`).join('')}</div>
    </div>
    <div class="modal-section">
      <h4><i class="fas fa-lightbulb"></i> Pro Tip</h4>
      <div class="modal-tip">${d.tip}</div>
    </div>
    <div class="modal-footer">
      <a href="https://youtube.com/@knowledge_transferwithsantosh?si=KgIuS79HhXwxcxQW" target="_blank" rel="noopener" class="btn btn-yt" style="width:100%;justify-content:center;">
        <i class="fab fa-youtube"></i> Watch Related Videos on YouTube
      </a>
    </div>`;
}

function openModal(key) {
  const d = MODAL_DATA[key];
  if (!d) return;
  modalBody.innerHTML = d.subjects ? buildExamModal(d) : buildResourceModal(d);
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  modalBox.scrollTop = 0;
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-modal]').forEach(btn => {
  btn.addEventListener('click', () => openModal(btn.dataset.modal));
});
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
