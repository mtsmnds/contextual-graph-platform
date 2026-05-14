/**
 * Report-Kit App
 *
 * Merged from report-app.js + report-metrics-app.js.
 * Reads server-baked values from <script id="report-data"> for date and
 * initial color/font randomization. localStorage overrides for user settings.
 */

/* ── Constants ──────────────────────────────────────────── */

const PAPERS = [
  '#FAF9F5',  // ivory
  '#FFF8DA',  // canary
  '#F9E8EC',  // rose
  '#E2ECF5',  // powder blue
  '#E3EDDF',  // sage
  '#EDE4F2',  // orchid
  '#FEEADD',  // salmon
  '#E6E8EB',  // fog
];

const HEADLINE_FONTS = [
  {
    family: "'Exposure', sans-serif",
    weight: '550',
    style: 'italic',
    letterSpacing: '-0.03em',
    lineHeight: '1.05',
    label: 'Exposure',
    sectionWeight: '550',
    sectionStyle: 'italic',
    metricWeight: '600',
    metricSize: '1.8rem',
    quoteWeight: '400',
  },
  {
    family: "Arial, Helvetica, sans-serif",
    weight: '400',
    style: 'normal',
    letterSpacing: '-0.02em',
    lineHeight: '1.0',
    label: 'Arial',
    sectionWeight: '400',
    sectionStyle: 'normal',
    metricWeight: '400',
    metricSize: '1.55rem',
    quoteWeight: '400',
  },
  {
    family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
    weight: '800',
    style: 'normal',
    letterSpacing: '-0.03em',
    lineHeight: '0.95',
    label: 'SF Pro',
    sectionWeight: '800',
    sectionStyle: 'normal',
    metricWeight: '800',
    metricSize: '1.8rem',
    quoteWeight: '400',
  },
];


/* ── Server-baked data ──────────────────────────────────── */

var _reportData = {};
try {
  var _el = document.getElementById('report-data');
  if (_el) _reportData = JSON.parse(_el.textContent || '{}');
} catch (e) { /* silent */ }

var bakedDate = _reportData.date ? new Date(_reportData.date) : new Date();
var bakedColorIndex = typeof _reportData.colorIndex === 'number' ? _reportData.colorIndex % PAPERS.length : 0;
var bakedFontIndex = typeof _reportData.fontIndex === 'number' ? _reportData.fontIndex % HEADLINE_FONTS.length : 0;


/* ── State ──────────────────────────────────────────────── */

var currentColorIndex = bakedColorIndex;
var currentFontIndex = bakedFontIndex;
var STORAGE_KEY = 'report-settings';


/* ── Persistence ────────────────────────────────────────── */

function loadSettings() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      color: currentColorIndex,
      font: currentFontIndex
    }));
  } catch (e) { /* silent */ }
}


/* ── Date (uses baked date, not current time) ───────────── */

function updateDate() {
  var DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  var MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

  var dateStr = DAYS[bakedDate.getDay()] + ', ' + MONTHS[bakedDate.getMonth()] + ' ' + bakedDate.getDate() + ' ' + bakedDate.getFullYear();

  var el = document.getElementById('reportDate');
  if (el) el.textContent = dateStr;
}


/* ── Badge rotation ─────────────────────────────────────── */

function randomizeStamps() {
  document.querySelectorAll('.item-badge').forEach(function (badge) {
    var angle = (Math.random() * 6 - 3).toFixed(2);
    badge.style.transform = 'rotate(' + angle + 'deg)';
  });
}


/* ── Color + Font application ───────────────────────────── */

function applyColor(index) {
  currentColorIndex = index;
  document.documentElement.style.setProperty('--bg', PAPERS[index]);
  void document.body.offsetHeight; // force repaint so all var(--bg) consumers update
  document.querySelectorAll('.swatch').forEach(function (s, i) {
    s.classList.toggle('active', i === index);
  });
  saveSettings();
}

function applyFont(index) {
  currentFontIndex = index;
  var font = HEADLINE_FONTS[index];
  document.documentElement.style.setProperty('--font-title', font.family);
  var headline = document.querySelector('.report-headline');
  if (headline) {
    headline.style.fontFamily = font.family;
    headline.style.fontWeight = font.weight;
    headline.style.fontStyle = font.style;
    headline.style.letterSpacing = font.letterSpacing;
    headline.style.lineHeight = font.lineHeight;
  }
  document.querySelectorAll('.section-heading').forEach(function (el) {
    el.style.fontFamily = font.family;
    el.style.fontWeight = font.sectionWeight;
    el.style.fontStyle = font.sectionStyle;
  });
  document.querySelectorAll('.metric-value').forEach(function (el) {
    el.style.fontFamily = font.family;
    el.style.fontWeight = font.metricWeight;
    el.style.fontSize = font.metricSize;
  });
  document.querySelectorAll('.slack-quote-text').forEach(function (el) {
    el.style.fontWeight = font.quoteWeight;
  });
  document.querySelectorAll('.report-blockquote-break').forEach(function (el) {
    el.style.fontFamily = font.family;
    el.style.fontWeight = font.weight;
    el.style.fontStyle = font.style;
    el.style.letterSpacing = font.letterSpacing;
  });
  document.querySelectorAll('.font-option').forEach(function (f, i) {
    f.classList.toggle('active', i === index);
  });
  saveSettings();
}


/* ── Settings panel builders ────────────────────────────── */

function buildSwatches() {
  var container = document.getElementById('settingsSwatches');
  if (!container) return;
  PAPERS.forEach(function (color, i) {
    var swatch = document.createElement('button');
    swatch.className = 'swatch' + (i === currentColorIndex ? ' active' : '');
    swatch.style.background = color;
    swatch.title = color;
    swatch.addEventListener('click', function () { applyColor(i); });
    container.appendChild(swatch);
  });
}

function buildFontOptions() {
  var container = document.getElementById('settingsFonts');
  if (!container) return;
  HEADLINE_FONTS.forEach(function (font, i) {
    var btn = document.createElement('button');
    btn.className = 'font-option' + (i === currentFontIndex ? ' active' : '');

    var sample = document.createElement('span');
    sample.className = 'font-option-sample';
    sample.textContent = 'Aa';
    sample.style.fontFamily = font.family;
    sample.style.fontWeight = font.weight;
    sample.style.fontStyle = font.style;

    var label = document.createElement('span');
    label.className = 'font-option-label';
    label.textContent = font.label;

    btn.appendChild(sample);
    btn.appendChild(label);
    btn.addEventListener('click', function () { applyFont(i); });
    container.appendChild(btn);
  });
}

function buildChartStyleToggle() {
  if (!document.querySelector('.chart-wrap')) return;
  var fontsContainer = document.getElementById('settingsFonts');
  if (!fontsContainer) return;

  var wrapper = document.createElement('div');
  wrapper.className = 'settings-chart-styles';

  var patternBtn = document.createElement('button');
  patternBtn.className = 'chart-style-btn active';
  patternBtn.dataset.style = 'pattern';
  patternBtn.title = 'Textured';
  patternBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(0,0,0,0.55)" stroke-width="1"><rect x="1" y="1" width="14" height="14" rx="1"/><line x1="4" y1="15" x2="15" y2="4"/><line x1="1" y1="12" x2="12" y2="1"/><line x1="1" y1="7" x2="7" y2="1"/><line x1="9" y1="15" x2="15" y2="9"/></svg>';

  var colorBtn = document.createElement('button');
  colorBtn.className = 'chart-style-btn';
  colorBtn.dataset.style = 'color';
  colorBtn.title = 'Filled';
  colorBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="1" fill="rgba(0,0,0,0.3)" stroke="rgba(0,0,0,0.4)" stroke-width="1"/></svg>';

  var inkedBtn = document.createElement('button');
  inkedBtn.className = 'chart-style-btn';
  inkedBtn.dataset.style = 'inked';
  inkedBtn.title = 'Inked';
  inkedBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(0,0,0,1)" stroke-width="1.5" style="filter:url(#ink-heavy)"><rect x="1" y="1" width="14" height="14" rx="1"/><line x1="4" y1="15" x2="15" y2="4"/><line x1="1" y1="12" x2="12" y2="1"/><line x1="1" y1="7" x2="7" y2="1"/><line x1="9" y1="15" x2="15" y2="9"/></svg>';

  patternBtn.addEventListener('click', function () { setChartStyle('pattern'); });
  colorBtn.addEventListener('click', function () { setChartStyle('color'); });
  inkedBtn.addEventListener('click', function () { setChartStyle('inked'); });

  var label = document.createElement('div');
  label.className = 'settings-section-label';
  label.textContent = 'Style';

  wrapper.appendChild(patternBtn);
  wrapper.appendChild(colorBtn);
  wrapper.appendChild(inkedBtn);

  fontsContainer.parentNode.insertBefore(label, fontsContainer);
  fontsContainer.parentNode.insertBefore(wrapper, fontsContainer);
}


/* ── Brand chart color override ────────────────────────── */

// When set, pattern and color chart styles use this hex color instead of black.
// The branding script calls window.setBrandChartColor('#0052CC') to activate.
var brandChartColor = null;

window.setBrandChartColor = function (hex) {
  brandChartColor = hex || null;
};

function chartFg(opacity) {
  if (!brandChartColor) return 'rgba(0,0,0,' + opacity + ')';
  var n = parseInt(brandChartColor.replace('#', ''), 16);
  var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
}

/* ── SVG hatch textures (embedded data URIs) ──────────────── */
/* 00 = transparent (outline only), 07 = solid fill, 01–06 = SVG patterns least → most dense */

var DPR = window.devicePixelRatio || 1;

var HATCH_SVG_DATA = {
  '01': "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23c)'%3E%3Ccircle cx='1.5' cy='1.52' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='4.5' cy='1.52' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='7.5' cy='1.52' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='10.5' cy='1.52' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='13.5' cy='1.52' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='16.5' cy='1.52' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='19.5' cy='1.52' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='22.5' cy='1.52' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='1.5' cy='4.53' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='4.5' cy='4.53' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='7.5' cy='4.53' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='10.5' cy='4.53' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='13.5' cy='4.53' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='16.5' cy='4.53' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='19.5' cy='4.53' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='22.5' cy='4.53' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='1.5' cy='7.57' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='4.5' cy='7.57' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='7.5' cy='7.57' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='10.5' cy='7.57' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='13.5' cy='7.57' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='16.5' cy='7.57' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='19.5' cy='7.57' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='22.5' cy='7.57' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='1.5' cy='10.58' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='4.5' cy='10.58' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='7.5' cy='10.58' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='10.5' cy='10.58' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='13.5' cy='10.58' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='16.5' cy='10.58' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='19.5' cy='10.58' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='22.5' cy='10.58' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='1.5' cy='13.6' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='4.5' cy='13.6' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='7.5' cy='13.6' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='10.5' cy='13.6' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='13.5' cy='13.6' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='16.5' cy='13.6' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='19.5' cy='13.6' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='22.5' cy='13.6' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='1.5' cy='16.63' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='4.5' cy='16.63' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='7.5' cy='16.63' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='10.5' cy='16.63' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='13.5' cy='16.63' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='16.5' cy='16.63' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='19.5' cy='16.63' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='22.5' cy='16.63' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='1.5' cy='19.65' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='4.5' cy='19.65' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='7.5' cy='19.65' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='10.5' cy='19.65' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='13.5' cy='19.65' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='16.5' cy='19.65' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='19.5' cy='19.65' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='22.5' cy='19.65' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='1.5' cy='22.68' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='4.5' cy='22.68' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='7.5' cy='22.68' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='10.5' cy='22.68' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='13.5' cy='22.68' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='16.5' cy='22.68' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='19.5' cy='22.68' r='.36' fill='black' fill-opacity='.9'/%3E%3Ccircle cx='22.5' cy='22.68' r='.36' fill='black' fill-opacity='.9'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='c'%3E%3Crect width='24' height='24' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E",
  '02': "data:image/svg+xml,%3Csvg width='34' height='34' viewBox='0 0 34 34' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23c)'%3E%3Crect x='0' y='0' width='.71' height='34' fill='black' fill-opacity='.9'/%3E%3Crect x='3.39' y='0' width='.71' height='34' fill='black' fill-opacity='.9'/%3E%3Crect x='6.81' y='0' width='.71' height='34' fill='black' fill-opacity='.9'/%3E%3Crect x='10.2' y='0' width='.71' height='34' fill='black' fill-opacity='.9'/%3E%3Crect x='13.6' y='0' width='.71' height='34' fill='black' fill-opacity='.9'/%3E%3Crect x='16.99' y='0' width='.71' height='34' fill='black' fill-opacity='.9'/%3E%3Crect x='20.4' y='0' width='.71' height='34' fill='black' fill-opacity='.9'/%3E%3Crect x='23.8' y='0' width='.71' height='34' fill='black' fill-opacity='.9'/%3E%3Crect x='27.19' y='0' width='.71' height='34' fill='black' fill-opacity='.9'/%3E%3Crect x='30.59' y='0' width='.71' height='34' fill='black' fill-opacity='.9'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='c'%3E%3Crect width='34' height='34' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E",
  '03': "data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23c0)'%3E%3Cg clip-path='url(%23c1)'%3E%3Cpath d='M24.14 6.64L24.5 7 7 24.5l-.36-.36L24.14 6.64z' fill='black'/%3E%3Cpath d='M22.39 4.89l.36.37-17.5 17.5-.37-.37 17.5-17.5z' fill='black'/%3E%3Cpath d='M20.63 3.14l.37.36-17.5 17.5-.37-.36 17.5-17.5z' fill='black'/%3E%3Cpath d='M18.88 1.39l.37.36-17.5 17.5-.37-.36 17.5-17.5z' fill='black'/%3E%3Cpath d='M17.14-.36l.36.36-17.5 17.5-.36-.36L17.14-.36z' fill='black'/%3E%3Cpath d='M15.39-2.1l.37.37-17.5 17.5-.37-.37 17.5-17.5z' fill='black'/%3E%3Cpath d='M13.63-3.86l.37.36-17.5 17.5-.37-.36 17.5-17.5z' fill='black'/%3E%3Cpath d='M11.89-5.61l.36.36-17.5 17.5-.36-.37 17.5-17.5z' fill='black'/%3E%3Cpath d='M10.14-7.35l.36.36-17.5 17.5-.36-.37 17.5-17.5z' fill='black'/%3E%3Cpath d='M8.39-9.1l.37.37-17.5 17.5-.37-.37L8.39-9.1z' fill='black'/%3E%3C/g%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='c0'%3E%3Crect width='14' height='14' fill='white' transform='matrix(-1 0 0 1 14 0)'/%3E%3C/clipPath%3E%3CclipPath id='c1'%3E%3Crect width='24.75' height='24.75' fill='white' transform='matrix(-.707 -.707 -.707 .707 24.5 7)'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E",
  '04': "data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cmask id='m0' style='mask-type:luminance' maskUnits='userSpaceOnUse' x='0' y='0' width='6' height='6'%3E%3Cpath d='M6 0H0v6h6V0z' fill='white'/%3E%3C/mask%3E%3Cg mask='url(%23m0)'%3E%3Cpath d='M3-3L-3 3l.13.13L3.13-2.87 3-3z' fill='black'/%3E%3Cpath d='M4-2l-6 6 .13.13L4.13-1.86 4-2z' fill='black'/%3E%3Cpath d='M5-1l-6 6 .13.13L5.13-.87 5-1z' fill='black'/%3E%3Cpath d='M6 0L0 6l.13.13L6.13.13 6 0z' fill='black'/%3E%3Cpath d='M7 1L1 7l.13.14L7.13 1.13 7 1z' fill='black'/%3E%3Cpath d='M8 2L2 8l.13.13L8.13 2.13 8 2z' fill='black'/%3E%3C/g%3E%3Cmask id='m1' style='mask-type:luminance' maskUnits='userSpaceOnUse' x='0' y='0' width='6' height='6'%3E%3Cpath d='M6 6V0H0v6h6z' fill='white'/%3E%3C/mask%3E%3Cg mask='url(%23m1)'%3E%3Cpath d='M3-3l.13.13L9 3.13 9 3 3-3z' fill='black'/%3E%3Cpath d='M2-2l.13.12L8 4.12 8 4 2-2z' fill='black'/%3E%3Cpath d='M1-1l.13.13L7 5.12 7 5 1-1z' fill='black'/%3E%3Cpath d='M0 0l.13.13L6 6.13 6 6 0 0z' fill='black'/%3E%3Cpath d='M-1 1l.13.13L5 7.12 5 7-1 1z' fill='black'/%3E%3Cpath d='M-2 2l.13.12L4 8.12 4 8-2 2z' fill='black'/%3E%3C/g%3E%3C/svg%3E",
  '05': "data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23c)'%3E%3Cpath d='M30 30h-4.38v-4.36H30V30zm-5.02-4.36V30h-4.36v-4.36h4.36zm-5-4.36V30h-4.36v-4.36h4.36zm-5 0V30h-4.34v-4.36h4.34zm-5 0V30H5.64v-4.36H10zm-5 0V30H.64v-4.36H5zM30 25h-4.38v-4.34h4.34v-.64h-4.34v-4.36H30V25zM5 20.66V25H.64v-4.34H5zm5 0V25H5.64v-4.34H10zm5 0V25h-4.34v-4.34h4.34zm5 0V25h-4.36v-4.34h4.36zm5 0V25h-4.36v-4.34h4.36zM5 15.65v4.36H.64v-4.36H5zm5 0v4.36H5.64v-4.36H10zm5 0v4.36h-4.34v-4.36h4.34zm5 0v4.36h-4.36v-4.36h4.36zm5 0v4.36h-4.36v-4.36h4.36zM30 15.01h-4.38v-4.36H30v4.36zM5 10.65v4.36H.64v-4.36H5zm5 0v4.36H5.64v-4.36H10zm5 0v4.36h-4.34v-4.36h4.34zm5 0v4.36h-4.36v-4.36h4.36zm5 0v4.36h-4.36v-4.36h4.36zM30 10.01h-4.38V5.65H30v4.36zM5 5.65v4.36H.64V5.65H5zm5 0v4.36H5.64V5.65H10zm5 0v4.36h-4.34V5.65h4.34zm5 0v4.36h-4.36V5.65h4.36zm5 0v4.36h-4.36V5.65h4.36zM30 5h-4.38V.64H30V5zM5 .64V5H.64V.64H5zm5 0V5H5.64V.64H10zm5 0V5h-4.34V.64h4.34zm5 0V5h-4.36V.64h4.36zm5 0V5h-4.36V.64h4.36z' fill='black' fill-opacity='.9'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='c'%3E%3Crect width='30' height='30' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E",
  '06': "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cmask id='m' style='mask-type:luminance' maskUnits='userSpaceOnUse' x='0' y='0' width='24' height='24'%3E%3Cpath d='M24 0H0v24h24V0z' fill='white'/%3E%3C/mask%3E%3Cg mask='url(%23m)'%3E%3Cpath d='M12.51-11.48l-24 24 3.5 3.5 24-24-3.5-3.5z' fill='black' fill-opacity='.75'/%3E%3Cpath d='M16.51-7.48l-24 24 3.5 3.5 24-24-3.5-3.5z' fill='black' fill-opacity='.75'/%3E%3Cpath d='M20.5-3.47l-24 24 3.5 3.49 24-24-3.5-3.49z' fill='black' fill-opacity='.75'/%3E%3Cpath d='M24.51.52l-24 24 3.5 3.49 24-24-3.5-3.49z' fill='black' fill-opacity='.75'/%3E%3Cpath d='M28.51 4.51l-24 24 3.5 3.49 24-24-3.5-3.49z' fill='black' fill-opacity='.75'/%3E%3Cpath d='M32.5 8.51l-24 24 3.5 3.49 24-24-3.5-3.49z' fill='black' fill-opacity='.75'/%3E%3C/g%3E%3C/svg%3E",
};

/** Texture codes by member count (rank 0 = largest area / most prominent). */
var HATCH_TEXTURE_BY_COUNT = {
  1: ['07'],
  2: ['07', '01'],
  3: ['07', '03', '00'],
  4: ['07', '04', '03', '00'],
  5: ['07', '06', '04', '01', '00'],
  6: ['07', '06', '05', '04', '01', '00'],
  7: ['07', '06', '05', '04', '03', '01', '00'],
  8: ['07', '06', '05', '04', '03', '02', '01', '00'],
};

var _hatchSvgImages = {};
var _hatchRasterTiles = {};

function hatchTextureCodesForCount(n) {
  if (n >= 1 && n <= 8) return HATCH_TEXTURE_BY_COUNT[n].slice();
  if (n > 8) {
    var out = HATCH_TEXTURE_BY_COUNT[8].slice();
    while (out.length < n) out.splice(out.length - 1, 0, '01');
    return out;
  }
  return ['07'];
}

function getOrBuildRasterTile(img) {
  if (!img || !img.naturalWidth) return null;
  var key = img.src;
  if (_hatchRasterTiles[key]) return _hatchRasterTiles[key];
  var w = img.naturalWidth;
  var h = img.naturalHeight;
  var c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * DPR));
  c.height = Math.max(1, Math.ceil(h * DPR));
  var pc = c.getContext('2d');
  pc.setTransform(DPR, 0, 0, DPR, 0, 0);
  pc.drawImage(img, 0, 0, w, h);
  _hatchRasterTiles[key] = c;
  return c;
}

function createSvgRepeatPattern(ctx, img) {
  var tile = getOrBuildRasterTile(img);
  if (!tile) return null;
  var pat = ctx.createPattern(tile, 'repeat');
  if (pat && DPR !== 1 && typeof pat.setTransform === 'function') {
    pat.setTransform(new DOMMatrix().scaleSelf(1 / DPR, 1 / DPR));
  }
  return pat;
}

function getFillForTextureCode(ctx, code) {
  if (code === '00') return chartFg(0);
  if (code === '07') return chartFg(0.75);
  var dataUri = HATCH_SVG_DATA[code];
  if (!dataUri) return chartFg(0.12);
  var img = _hatchSvgImages[code];
  if (img && img.complete && img.naturalWidth) {
    var p = createSvgRepeatPattern(ctx, img);
    return p || chartFg(0.18);
  }
  return chartFg(0.14);
}

/** Preload all embedded SVG data URIs into Image objects for canvas pattern use. */
function preloadHatchSvgImages(done) {
  var keys = Object.keys(HATCH_SVG_DATA);
  var left = keys.length;
  if (left === 0) { if (done) done(); return; }
  keys.forEach(function (k) {
    if (_hatchSvgImages[k] && _hatchSvgImages[k].complete && _hatchSvgImages[k].naturalWidth) {
      if (--left === 0 && done) done();
      return;
    }
    var im = new Image();
    im.onload = function () {
      _hatchSvgImages[k] = im;
      if (--left === 0 && done) done();
    };
    im.onerror = function () {
      if (--left === 0 && done) done();
    };
    im.src = HATCH_SVG_DATA[k];
  });
}

/** Slice indices from largest value first (for pie/donut emphasis). */
function indicesSortedByValueLargeFirst(data) {
  var idx = [];
  for (var i = 0; i < data.length; i++) idx.push(i);
  return idx.sort(function (a, b) { return Number(data[b]) - Number(data[a]); });
}


/* ── Chart style toggle ─────────────────────────────────── */

var currentChartStyle = 'pattern';
var origColorsSnapshotted = false;

function snapshotOriginalColors() {
  if (origColorsSnapshotted) return;
  if (typeof Chart === 'undefined') return;
  var allInstances = Object.values(Chart.instances || {});
  if (allInstances.length === 0) return;
  allInstances.forEach(function (chart) {
    chart.data.datasets.forEach(function (ds) {
      if (!ds._origBg) {
        ds._origBg = ds.backgroundColor;
        ds._origBorder = ds.borderColor;
        ds._origWidth = ds.borderWidth;
      }
    });
  });
  origColorsSnapshotted = true;
}

function setChartStyle(style) {
  currentChartStyle = style;
  snapshotOriginalColors();
  var canvases = document.querySelectorAll('.chart-wrap canvas');
  var usePatterns = style === 'pattern' || style === 'inked';

  // Toggle all Chart.js instances on the page
  var allInstances = typeof Chart !== 'undefined' ? Object.values(Chart.instances || {}) : [];
  allInstances.forEach(function (chart) {
    var isDoughnutOrPie = chart.config.type === 'doughnut' || chart.config.type === 'pie';
    chart.data.datasets.forEach(function (ds, dsIndex) {
      if (usePatterns) {
        var ctx = chart.ctx;
        if (isDoughnutOrPie && Array.isArray(ds._origBg)) {
          // Pie/donut/polar: rank slices by value (largest → solid 07, smallest → outline 00)
          var nSeg = ds._origBg.length;
          var sortedSeg = (nSeg >= 2 && Array.isArray(ds.data) && ds.data.length === nSeg)
            ? indicesSortedByValueLargeFirst(ds.data) : [];
          var codesPie = hatchTextureCodesForCount(Math.max(1, nSeg));
          ds.backgroundColor = ds._origBg.map(function (_, segIdx) {
            var pos = sortedSeg.indexOf(segIdx);
            var code = (pos >= 0) ? codesPie[pos] : codesPie[codesPie.length - 1];
            return getFillForTextureCode(ctx, code);
          });
          ds.borderColor = ds._origBg.map(function () { return chartFg(0.85); });
          ds.borderWidth = 0.5;
        } else if (chart.config.type === 'bar' && chart.data.datasets.length === 1 && Array.isArray(ds.data) && ds.data.length >= 3) {
          // Single-series bar with 3+ categories: all solid
          ds.backgroundColor = getFillForTextureCode(ctx, '07');
          ds.borderColor = chartFg(0.85);
          ds.borderWidth = 0.5;
        } else if (chart.config.type === 'bar' && chart.data.datasets.length === 1 && Array.isArray(ds.data) && ds.data.length === 2) {
          // Single-series bar with exactly 2 categories: larger gets solid, smaller gets dots
          var va = Number(ds.data[0]) || 0;
          var vb = Number(ds.data[1]) || 0;
          var largeIdx = va >= vb ? 0 : 1;
          var twoCodes = hatchTextureCodesForCount(2);
          var fills2 = [];
          fills2[largeIdx] = getFillForTextureCode(ctx, twoCodes[0]);
          fills2[1 - largeIdx] = getFillForTextureCode(ctx, twoCodes[1]);
          ds.backgroundColor = fills2;
          ds.borderColor = [chartFg(0.85), chartFg(0.85)];
          ds.borderWidth = 0.5;
        } else if (chart.config.type === 'line' && ds.fill) {
          // Filled area: rank by mean (lowest mean → solid, reads as the gap fill)
          var filledIdx = [];
          for (var fi = 0; fi < chart.data.datasets.length; fi++) {
            if (chart.data.datasets[fi].fill) filledIdx.push(fi);
          }
          var nFilled = filledIdx.length;
          if (nFilled <= 1) {
            // Single filled area: use dots texture
            ds.backgroundColor = getFillForTextureCode(ctx, '01');
          } else {
            // Sort filled datasets by mean ascending (lowest mean → rank 0 → solid)
            var means = filledIdx.map(function (idx) {
              var d = chart.data.datasets[idx].data;
              var sum = 0, cnt = 0;
              for (var mi = 0; mi < d.length; mi++) {
                var v = typeof d[mi] === 'number' ? d[mi] : (d[mi] && typeof d[mi].y === 'number' ? d[mi].y : NaN);
                if (!isNaN(v)) { sum += v; cnt++; }
              }
              return cnt ? sum / cnt : 0;
            });
            var ranked = filledIdx.slice().sort(function (a, b) {
              return means[filledIdx.indexOf(a)] - means[filledIdx.indexOf(b)];
            });
            var rank = ranked.indexOf(dsIndex);
            var areaCodes;
            if (nFilled === 2) {
              areaCodes = ['07', '01'];
            } else if (nFilled === 3) {
              areaCodes = ['07', '05', '00'];
            } else if (nFilled === 4) {
              areaCodes = ['07', '04', '01', '00'];
            } else {
              areaCodes = hatchTextureCodesForCount(nFilled);
            }
            var areaCode = (rank >= 0 && rank < areaCodes.length) ? areaCodes[rank] : areaCodes[0];
            ds.backgroundColor = getFillForTextureCode(ctx, areaCode);
          }
          ds.borderColor = chartFg(0.85);
          ds.borderWidth = 0.5;
        } else if (chart.config.type === 'line' && !ds.fill) {
          // Unfilled line: keep original stroke, no fill override
          ds.backgroundColor = ds._origBg || chartFg(0.06);
          ds.borderColor = ds._origBorder != null ? ds._origBorder : chartFg(0.85);
          ds.borderWidth = ds._origWidth || 0.5;
        } else {
          // Multi-dataset (bars, scatter, radar): texture ladder by dataset order
          var allIdx = [];
          for (var ai = 0; ai < chart.data.datasets.length; ai++) allIdx.push(ai);
          var codes = hatchTextureCodesForCount(allIdx.length);
          var code = codes[dsIndex % codes.length];
          ds.backgroundColor = getFillForTextureCode(ctx, code);
          ds.borderColor = chartFg(0.85);
          ds.borderWidth = 0.5;
        }
      } else {
        // Color mode: use brand-tinted or original colors
        if (brandChartColor) {
          if (isDoughnutOrPie && Array.isArray(ds._origBg)) {
            ds.backgroundColor = ds._origBg.map(function (_, i) {
              var opacities = [1, 0.65, 0.4, 0.25, 0.12];
              return chartFg(opacities[i % opacities.length]);
            });
            ds.borderColor = 'rgba(255,255,255,0.3)';
          } else {
            ds.borderColor = brandChartColor;
            ds.backgroundColor = brandChartColor + '18';
            if (ds.pointHoverBackgroundColor !== undefined) {
              ds.pointHoverBackgroundColor = brandChartColor;
            }
          }
          ds.borderWidth = ds._origWidth || 1.5;
        } else {
          ds.backgroundColor = ds._origBg || 'rgba(0,0,0,0.06)';
          ds.borderColor = ds._origBorder || 'rgba(0,0,0,0.4)';
          ds.borderWidth = ds._origWidth || 1.5;
        }
      }
    });
    // Tint target line plugin with brand color
    if (brandChartColor && chart.options.plugins && chart.options.plugins.targetLine) {
      chart.options.plugins.targetLine.color = brandChartColor + '30';
      chart.options.plugins.targetLine.labelColor = brandChartColor + '55';
    }
    chart.update('none');
  });

  // Toggle ink-filtered class on the report for ink texture on text + charts
  var report = document.querySelector('.report');
  if (report) {
    report.classList.toggle('ink-filtered', style === 'inked');
  }

  // Clear any inline filter — CSS handles ink-filtered canvas filter
  canvases.forEach(function (c) {
    c.style.filter = '';
  });

  document.querySelectorAll('.chart-style-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.style === style);
  });
}

window.setChartStyle = setChartStyle;
window.getChartStyle = function () { return currentChartStyle; };


/* ── Chart.js global defaults ───────────────────────────── */

if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = 'rgba(0,0,0,0.4)';
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0,0,0,0.8)';
  Chart.defaults.plugins.tooltip.cornerRadius = 2;
  Chart.defaults.plugins.tooltip.padding = 8;

  // Kick off SVG texture preload early
  preloadHatchSvgImages();

  // Enforce chart-type rules after creation. Instance-level options from
  // LLM-generated code override Chart.overrides, so we use afterInit.
  Chart.register({
    id: 'reportKitChartDefaults',
    afterInit: function (chart) {
      var type = chart.config.type;
      if (type === 'pie' || type === 'doughnut') {
        // Keep circular — don't let LLM squish them
        chart.options.maintainAspectRatio = true;
        chart.options.aspectRatio = 1;
        // Legend to the right so the circle stays large
        if (!chart.options.plugins) chart.options.plugins = {};
        if (!chart.options.plugins.legend) chart.options.plugins.legend = {};
        chart.options.plugins.legend.position = 'right';
      } else if (type === 'bar' || type === 'line') {
        chart.options.maintainAspectRatio = false;
      }
    }
  });
}


/* ── Init ───────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  // Inject SVG filter definitions (ink-heavy, ink-medium, ink-light) referenced by CSS
  var svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgDefs.setAttribute('style', 'position:absolute;width:0;height:0');
  svgDefs.setAttribute('aria-hidden', 'true');
  svgDefs.innerHTML = '<defs>'
    + '<filter id="ink-heavy" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="5" seed="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G"/></filter>'
    + '<filter id="ink-medium" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="4" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1" xChannelSelector="R" yChannelSelector="G"/></filter>'
    + '<filter id="ink-light" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="3" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0.5" xChannelSelector="R" yChannelSelector="G"/></filter>'
    + '</defs>';
  document.body.insertBefore(svgDefs, document.body.firstChild);

  updateDate();
  randomizeStamps();

  // Load user-overridden settings, fall back to server-baked values
  var saved = loadSettings();
  if (saved && typeof saved.color === 'number' && typeof saved.font === 'number') {
    currentColorIndex = saved.color % PAPERS.length;
    currentFontIndex = saved.font % HEADLINE_FONTS.length;
  }
  // else: already set to bakedColorIndex / bakedFontIndex from server data

  applyColor(currentColorIndex);
  applyFont(currentFontIndex);

  buildSwatches();
  buildChartStyleToggle();
  buildFontOptions();

  // Preload embedded SVG textures, then snapshot chart colors and apply pattern style.
  var applyInitialChartStyle = function () {
    if (typeof Chart !== 'undefined') {
      var allInstances = Object.values(Chart.instances || {});
      if (allInstances.length > 0) {
        snapshotOriginalColors();
        setChartStyle(currentChartStyle);
        // Re-apply once SVG images finish decoding (patterns need rasterized tiles)
        preloadHatchSvgImages(function () {
          _hatchRasterTiles = {};
          setChartStyle(currentChartStyle);
        });
      }
    }
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(applyInitialChartStyle, { timeout: 1000 });
  } else {
    setTimeout(applyInitialChartStyle, 500);
  }

  // Before printing, force all charts to resize to their (new) print-layout container.
  // After printing, resize back to the screen layout.
  // When chart style is 'inked', strip the background for print (white paper).
  var resizeAllCharts = (typeof Chart !== 'undefined') ? function () {
    Object.values(Chart.instances || {}).forEach(function (chart) {
      chart.resize();
    });
  } : null;

  window.addEventListener('beforeprint', function () {
    var report = document.querySelector('.report');
    if (report && currentChartStyle === 'inked') {
      report.classList.add('print-no-bg');
    }
    if (resizeAllCharts) resizeAllCharts();
  });
  window.addEventListener('afterprint', function () {
    var report = document.querySelector('.report');
    if (report) report.classList.remove('print-no-bg');
    if (resizeAllCharts) resizeAllCharts();
  });

  // ResizeObserver: force Chart.js to resize when chart containers change size.
  // This fixes charts not growing back when the browser window is enlarged.
  if (typeof ResizeObserver !== 'undefined' && typeof Chart !== 'undefined') {
    var chartWraps = document.querySelectorAll('.chart-wrap');
    if (chartWraps.length > 0) {
      var ro = new ResizeObserver(function () {
        Object.values(Chart.instances || {}).forEach(function (chart) {
          chart.resize();
        });
      });
      chartWraps.forEach(function (wrap) { ro.observe(wrap); });
    }
  }

  // Fade in
  requestAnimationFrame(function () {
    var report = document.querySelector('.report');
    if (report) report.classList.add('ready');
    var btn = document.getElementById('settingsBtn');
    if (btn) btn.classList.add('ready');
  });

  // Settings panel toggle
  var settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.getElementById('settingsPanel').classList.toggle('open');
    });
  }

  document.addEventListener('click', function (e) {
    var panel = document.getElementById('settingsPanel');
    if (panel && panel.classList.contains('open') && !panel.contains(e.target)) {
      panel.classList.remove('open');
    }
  });

});
