// Dependency-free build: JSON remains the content source; visitors receive real HTML.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
// Stylesheet and script carry a content hash so a new version is never mixed with a cached old one.
// Hash the LF form: a Windows checkout (CRLF) must build the same pages as CI.
const version = file => createHash('sha256').update(fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 12);
const cssVersion = version('assets/site.css'), jsVersion = version('assets/site.js');
const source = fs.readFileSync(path.join(root, 'src/component.html'), 'utf8');
const script = source.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
const files = ['strings', 'works', 'performances', 'film', 'research', 'news', 'about', 'handwriting'];
const data = Object.fromEntries(files.map(name => [name, JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'))]));
const context = vm.createContext({ URL, window: { innerWidth: 390, screen: { width: 390, height: 844 }, navigator: { maxTouchPoints: 0 }, matchMedia: () => ({ matches: false }) },
  DCLogic: class { constructor() { this.props = {}; } setState(p, cb) { Object.assign(this.state, typeof p === 'function' ? p(this.state) : p); if (cb) cb(); } },
  React: { createRef: () => ({ current: null }), createElement: (tag, props, ...children) => ({ tag, props: props || {}, children }) }
});
const Component = vm.runInContext(script + '\nComponent', context);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Links may leave the site (http/https), open mail, jump to a section, or stay inside the site (/concertante/).
const internalURL = s => /^\/(?!\/)[\w./-]*(#[\w-]+)?$/.test(s || '') && !s.includes('..');
const safeURL = s => (/^(https?:\/\/|mailto:|#sec-)/i.test(s || '') || internalURL(s)) ? esc(s) : '';
const newTab = href => /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
const asset = s => /^[\w./-]+$/.test(s || '') && !s.includes('..') ? '/' + s.replace(/^\//, '') : '';
const e = (tag, props, children) => `<${tag}${Object.entries(props || {}).map(([k,v]) => ` ${k}="${esc(v)}"`).join('')}>${children || ''}</${tag}>`;
function icon(node) {
  if (!node || typeof node !== 'object') return '';
  const names = { strokeWidth: 'stroke-width', strokeLinecap: 'stroke-linecap', strokeLinejoin: 'stroke-linejoin', className: 'class' };
  return e(node.tag, Object.fromEntries(Object.entries(node.props).map(([k,v]) => [names[k] || k,v])), node.children.map(icon).join(''));
}
// Text in the other language is marked so screen readers pronounce it and CSS can set it in the right face:
// translations always, and Korean that stands in on the English page where no English wording is confirmed yet.
let pageLang = 'ko';
const otherLang = (text, known) => { const l = known || (pageLang === 'en' && /[가-힣]/.test(text || '') ? 'ko' : ''); return l && l !== pageLang ? ` lang="${l}"` : ''; };
// A running line ("date · event · place") may mix confirmed English with Korean on the English page:
// only the Korean pieces between the " · " joints are marked, so a screen reader changes voice just for them.
const plainSpan = text => {
  const pieces = String(text ?? '').split(' · ');
  const mixed = pieces.some(piece => otherLang(piece)) && pieces.some(piece => !otherLang(piece));
  return mixed ? `<span>${pieces.map(piece => otherLang(piece) ? `<span${otherLang(piece)}>${esc(piece)}</span>` : esc(piece)).join(' · ')}</span>` : `<span${otherLang(text)}>${esc(text)}</span>`;
};
// A worded link ends in an arrow that says where it leads: ↗ leaves the site (a new tab, also announced to screen readers),
// → stays inside it, ↓ moves down the page. The word joiner keeps the arrow on the same line as the last word.
let newTabLabel = '';
const srColon = '<span class="visually-hidden">: </span>', srComma = '<span class="visually-hidden">, </span>';
const arrowFor = href => /^https?:/i.test(href) ? '↗' : /^\//.test(href) ? '→' : '';
const linkText = (text, href, glyph = arrowFor(href)) => glyph ? `<span>${esc(text)}&#8288;<span class="arrow" aria-hidden="true">${glyph}</span>${glyph === '↗' ? `<span class="visually-hidden"> (${esc(newTabLabel)})</span>` : ''}</span>` : esc(text);
function parts(items = []) {
  return items.map(p => {
    if (p.sep) return '<span class="separator"></span>';   // the dot is drawn by CSS and read as a comma
    if (p.linkKr || p.linkEn) {
      const href = safeURL(p.href); if (!href) return '';
      return `<a href="${href}"${newTab(href)}${p.ariaLabel ? ` aria-label="${esc(p.ariaLabel)}"` : ''} class="${esc(p.className || 'text-link')}">${icon(p.icon)}${p.text ? linkText(p.text, href) : ''}</a>`;
    }
    const cl = p.label ? 'label' : p.meta ? 'meta' : (p.t2En || p.t2Kr) ? 'translation' : (p.t1En || p.t1Kr) ? 'primary' : '';
    if (!cl) return plainSpan(p.text);
    const span = `<span class="${cl}"${otherLang(p.text, p.t2En ? 'en' : p.t2Kr ? 'ko' : '')}>${esc(p.text)}</span>`;
    // Pieces set apart only by margins get a boundary for screen readers, outside the span so its lang stays clean.
    if (cl === 'label') return span + srColon;
    if (cl === 'meta' || cl === 'translation') return srComma + span;
    return span;
  }).join('');
}
function headline(items) { return parts(items); }
// A record's own links (performance video, concert page) sit together on one line with a gap between them.
function recordActions(r) {
  const links = [[r.videoHref, r.videoLabel], [r.pageHref, r.pageLabel]]
    .map(([href, text]) => safeURL(href) && text ? `<a class="channel-link" href="${safeURL(href)}"${newTab(href)}>${linkText(text, href)}</a>` : '').join('');
  return links ? `<div class="record-video record-actions">${links}</div>` : '';
}
// The last day (YYYY-MM-DD) on which an announced event still counts as upcoming; site.js retires it afterwards.
const lastDay = r => /^\d{4}-\d{2}-\d{2}$/.test(r.until || '') ? r.until : '';
function record(r) {
  if (r.line1.some(p => p.subKr || p.subEn)) return `<h3 class="subheading">${parts(r.line1)}</h3>`;
  return `<article class="record"${lastDay(r) ? ` data-until="${lastDay(r)}"` : ''}><div class="record-inner"><span class="year">${esc(r.year)}</span><div class="record-heading">${headline(r.line1)}</div>${r.right.length ? `<div class="record-links">${parts(r.right)}</div>` : ''}${r.line2.length ? `<div class="record-meta">${parts(r.line2)}</div>` : ''}${r.performers ? `<div class="record-meta"><span class="label">${esc(r.performersLabel)}</span>${srColon}<span${otherLang(r.performers)}>${esc(r.performers)}</span></div>` : ''}${recordActions(r)}</div></article>`;
}
const origin = 'https://ijskra.github.io';
const linkedPages = new Set();
for (const lang of ['ko','en']) {
  pageLang = lang;
  const c = new Component();c.state.data = data;c.state.lang = lang;
  const v = c.renderVals();
  const t = key => data.strings[key][lang === 'ko' ? '국문' : '영문'];
  newTabLabel = t('label.new_tab');
  const url = origin + (lang === 'ko' ? '/' : '/en/');
  const description = t('site.description');
  // The share card (scripts/share-card.html draws it) is an opaque 1200×630 picture; the cut-out portrait is not usable on its own.
  const shareImage = `${origin}/assets/og-${lang}.jpg`;
  const dimensions = id => {
    const svg = fs.readFileSync(path.join(root, data.handwriting[id]), 'utf8');
    const box = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
    return `width="${box[2]}" height="${box[3]}"`;
  };
  const heading = id => `<div class="section-heading"><div class="section-heading-inner"><img src="${asset(data.handwriting[id])}" alt="" class="section-handwriting" ${dimensions(id)} loading="lazy" decoding="async"><h2 id="heading-${id}">${esc(t('nav.'+id))}<span class="heading-translation" lang="${lang === 'ko' ? 'en' : 'ko'}">${esc(data.strings['nav.'+id][lang === 'ko' ? '영문' : '국문'])}</span></h2></div></div>`;
  // A particle stays on the line of the title it follows (…모음곡〉을): the closing bracket and the syllables after it do not part.
  const keepParticle = html => html.replace(/([〉」』》])([가-힣]+)/g, '<span class="nb">$1$2</span>');
  const about = v.about.map(p => `<p>${p.segs.map(s => {let txt=keepParticle(esc(s.t));if(s.iOnly || s.ihl)txt=`<em>${txt}</em>`;if(s.hlOnly || s.ihl)txt=`<mark>${txt}</mark>`;return txt;}).join('')}</p>`).join('');
  const works = v.works.map(w => {
    c.state.pinned = w.id;
    const expanded = c.renderVals().works.find(x => x.id === w.id);
    const raw = data.works.find(x => x.id === w.id);
    const ko = raw['제목_국문'], en = raw['제목_영문'];
    const candidate = lang === 'ko' ? en : ko;
    const other = typeof candidate === 'string' && !candidate.includes('【') ? candidate : '';
    const mainTitle = w.line1.map(x => x.text).join('');
    const scorePath = raw['악보이미지'];
    const scoreURL = scorePath ? (/^https?:\/\//.test(scorePath) ? safeURL(scorePath) : asset('assets/'+scorePath)) : '';
    // The toggle is named by year, title and instrumentation only, not by the links that sit inside it.
    const wid = `work-${esc(w.id)}`;
    return `<details class="work record" id="${wid}"><summary aria-labelledby="${wid}-y ${wid}-t ${wid}-i"><span class="year" id="${wid}-y">${esc(w.year)}</span><span class="record-heading" id="${wid}-t">${headline(w.line1)}${other && other !== mainTitle ? `${srComma}<span class="translation" lang="${lang === 'ko' ? 'en' : 'ko'}">${esc(other)}</span>` : ''}</span><span class="instrumentation" id="${wid}-i"${otherLang(w.inst)}>${esc(w.inst)}</span><span class="disclosure" aria-hidden="true"></span>${w.links.length ? `<span class="work-links">${parts(w.links)}</span>` : ''}</summary><div class="work-details">${expanded.details.map(line => `<p>${parts(line.parts)}</p>`).join('')}${scoreURL ? `<figure class="score"><img data-src="${scoreURL}" alt="${esc(t('label.score'))}" width="300" height="166" loading="lazy" decoding="async"><noscript><a href="${scoreURL}"${newTab(scoreURL)}>${linkText(t('label.score'), scoreURL)}</a></noscript></figure>` : ''}</div></details>`;
  }).join('\n');
  // A long menu label may have a short form (strings.json "navshort.<id>") that takes its place on phones.
  const nav = c.IDS.map(id => {
    const full = t('nav.'+id), short = (data.strings['navshort.'+id] || {})[lang === 'ko' ? '국문' : '영문'];
    return `<a href="#sec-${id}">${short && short !== full ? `<span class="nav-full">${esc(full)}</span><span class="nav-short">${esc(short)}</span>` : esc(full)}</a>`;
  }).join('');
  const structured = JSON.stringify({'@context':'https://schema.org','@type':'Person',name:v.heroName,alternateName:lang==='ko'?[data.strings['site.name']['영문'],'Jung-Woong Oh',t('site.passport_name')]:['오정웅','Jung-Woong Oh',t('site.passport_name')],url,jobTitle:v.heroRole.split(' · '),image:origin+'/assets/photo-lines-cut.png',sameAs:[t('contact.soundcloud'),t('contact.instagram')].filter(Boolean)}).replace(/</g,'\\u003c');
  const html = `<!doctype html>
<html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#eee9f1"><meta name="color-scheme" content="only light">
<title>${esc(v.heroName)} — ${esc(v.heroRole)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}"><link rel="alternate" hreflang="ko" href="${origin}/"><link rel="alternate" hreflang="en" href="${origin}/en/"><link rel="alternate" hreflang="x-default" href="${origin}/">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(v.heroName+' — '+v.heroRole)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="${lang==='ko'?'ko_KR':'en_US'}"><meta property="og:image" content="${shareImage}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(v.heroName)}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/assets/site.css?v=${cssVersion}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<script type="application/ld+json">${structured}</script><script src="/assets/site.js?v=${jsVersion}" defer></script>
</head><body>
<a class="skip-link" href="#sec-about">${lang==='ko'?'본문으로 건너뛰기':'Skip to content'}</a>
<header><div class="header-inner"><nav aria-label="${lang==='ko'?'주 메뉴':'Main navigation'}">${nav}</nav><a class="language-link" href="${lang==='ko'?'/en/':'/'}" lang="${lang==='ko'?'en':'ko'}" hreflang="${lang==='ko'?'en':'ko'}">${esc(v.langLabel)}</a></div></header>
<main>
<section id="sec-about" aria-labelledby="heading-about"><div class="hero"><img class="hero-handwriting" src="${asset(data.handwriting.name)}" alt="" width="1207" height="430" fetchpriority="high"><div class="hero-identity"><h1>${esc(v.heroName)}</h1><p class="passport-name">${lang === 'ko' ? `<span lang="en">${esc(data.strings['site.name']['영문'])}, ${esc(t('site.passport_name'))}</span>` : `${esc(t('label.passport_name'))}: <span lang="en">${esc(t('site.passport_name'))}</span>`}</p><p>${esc(v.heroRole)}</p></div><img class="portrait" src="/assets/portrait-700.webp" srcset="/assets/portrait-350.webp 350w, /assets/portrait-700.webp 700w" sizes="(min-width:1120px) 325px, 240px" alt="${esc(v.heroName)}" width="700" height="870" fetchpriority="high" decoding="async"></div>${heading('about')}<div class="about-prose">${about}<div class="about-actions">${safeURL(v.recitalHref)?`<a class="channel-link" href="${safeURL(v.recitalHref)}"${newTab(v.recitalHref)}>${linkText(v.recitalLabel, v.recitalHref)}</a>`:''}<a class="channel-link" href="#sec-works">${linkText(v.worksLabel, '#sec-works', '↓')}</a></div></div></section>
<section id="sec-works" aria-labelledby="heading-works">${heading('works')}${works}</section>
${['performances','research','news'].map(id=>`<section id="sec-${id}" aria-labelledby="heading-${id}">${heading(id)}${v.rows[id].map(record).join('\n')}${id==='news'&&v.rows.news.some(lastDay)?`\n<article class="record" data-news-empty hidden><div class="record-inner"><span class="year"></span><div class="record-heading"><span>${esc(t('news.empty'))}</span></div></div></article>`:''}</section>`).join('\n')}
<section id="sec-contact" aria-labelledby="heading-contact">${heading('contact')}${v.rows.contact.filter(r=>r.line1.some(p=>safeURL(p.href))).map(r=>`<div class="record"><div class="contact-inner">${parts(r.line1)}</div></div>`).join('')}</section>
</main>
<footer>${esc(v.footer)}</footer>
</body></html>\n`;
  const dest = path.join(root, lang === 'ko' ? 'index.html' : 'en/index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });fs.writeFileSync(dest, html);
  // Pages inside the site that the home page links to (concert page, programme note) are listed in the sitemap too.
  for (const m of html.matchAll(/href="(\/[\w./-]*\/)(?:#[^"]*)?"/g)) if (!['/', '/en/'].includes(m[1])) linkedPages.add(m[1]);
}
fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/en/', ...[...linkedPages].sort()].map(p => `<url><loc>${origin}${p}</loc></url>`).join('')}</urlset>\n`);
console.log('Built Korean and English static pages from data/*.json');
