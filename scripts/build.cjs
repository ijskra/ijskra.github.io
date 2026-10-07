// Dependency-free build: JSON remains the content source; visitors receive real HTML.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
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
const safeURL = s => /^(https?:\/\/|mailto:|#sec-)/i.test(s || '') ? esc(s) : '';
const asset = s => /^[\w./-]+$/.test(s || '') && !s.includes('..') ? '/' + s.replace(/^\//, '') : '';
const e = (tag, props, children) => `<${tag}${Object.entries(props || {}).map(([k,v]) => ` ${k}="${esc(v)}"`).join('')}>${children || ''}</${tag}>`;
function icon(node) {
  if (!node || typeof node !== 'object') return '';
  const names = { strokeWidth: 'stroke-width', strokeLinecap: 'stroke-linecap', strokeLinejoin: 'stroke-linejoin', className: 'class' };
  return e(node.tag, Object.fromEntries(Object.entries(node.props).map(([k,v]) => [names[k] || k,v])), node.children.map(icon).join(''));
}
function parts(items = []) {
  return items.map(p => {
    if (p.sep) return '<span class="separator" aria-hidden="true">·</span>';
    if (p.linkKr || p.linkEn) {
      const href = safeURL(p.href); if (!href) return '';
      return `<a href="${href}"${href.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener noreferrer"'}${p.ariaLabel ? ` aria-label="${esc(p.ariaLabel)}"` : ''} class="${esc(p.className || 'text-link')}">${icon(p.icon)}${esc(p.text)}</a>`;
    }
    const cl = p.label ? 'label' : p.meta ? 'meta' : (p.t2En || p.t2Kr) ? 'translation' : (p.t1En || p.t1Kr) ? 'primary' : '';
    return `<span${cl ? ` class="${cl}"` : ''}>${esc(p.text)}</span>`;
  }).join('');
}
function headline(items) { return parts(items); }
function record(r) {
  if (r.line1.some(p => p.subKr || p.subEn)) return `<h3 class="subheading">${parts(r.line1)}</h3>`;
  return `<article class="record"><div class="record-inner"><span class="year">${esc(r.year)}</span><div class="record-heading">${headline(r.line1)}</div>${r.right.length ? `<div class="record-links">${parts(r.right)}</div>` : ''}${r.line2.length ? `<div class="record-meta">${parts(r.line2)}</div>` : ''}${r.performers ? `<div class="record-meta"><span class="label">${esc(r.performersLabel)}</span>${esc(r.performers)}</div>` : ''}${r.videoHref ? `<a class="channel-link record-video" href="${safeURL(r.videoHref)}" target="_blank" rel="noopener noreferrer">${esc(r.videoLabel)} ↗</a>` : ''}</div></article>`;
}
const origin = 'https://ijskra.github.io';
for (const lang of ['ko','en']) {
  const c = new Component();c.state.data = data;c.state.lang = lang;
  const v = c.renderVals();
  const t = key => data.strings[key][lang === 'ko' ? '국문' : '영문'];
  const url = origin + (lang === 'ko' ? '/' : '/en/');
  const description = lang === 'ko' ? '작곡가·하프시코드 연주자 오정웅의 공식 홈페이지. 작품, 연주와 영화 음악, 연구 및 소식을 소개합니다.' : 'The official website of Jung-Woong Oh, composer and harpsichordist. Explore compositions, performances, film music, research and news.';
  const dimensions = id => {
    const svg = fs.readFileSync(path.join(root, data.handwriting[id]), 'utf8');
    const box = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
    return `width="${box[2]}" height="${box[3]}"`;
  };
  const heading = id => `<div class="section-heading"><div class="section-heading-inner"><img src="${asset(data.handwriting[id])}" alt="" class="section-handwriting" ${dimensions(id)} loading="lazy" decoding="async"><h2 id="heading-${id}">${esc(t('nav.'+id))}<span class="heading-translation" lang="${lang === 'ko' ? 'en' : 'ko'}">${esc(data.strings['nav.'+id][lang === 'ko' ? '영문' : '국문'])}</span></h2></div></div>`;
  const about = v.about.map(p => `<p>${p.segs.map(s => {let txt=esc(s.t);if(s.iOnly || s.ihl)txt=`<em>${txt}</em>`;if(s.hlOnly || s.ihl)txt=`<mark>${txt}</mark>`;return txt;}).join('')}</p>`).join('');
  const works = v.works.map(w => {
    c.state.pinned = w.id;
    const expanded = c.renderVals().works.find(x => x.id === w.id);
    const raw = data.works.find(x => x.id === w.id);
    const ko = raw['제목_국문'], en = raw['제목_영문'];
    const other = lang === 'ko' ? en : ko;
    const mainTitle = w.line1.map(x => x.text).join('');
    const scorePath = raw['악보이미지'];
    const scoreURL = scorePath ? (/^https?:\/\//.test(scorePath) ? safeURL(scorePath) : asset('assets/'+scorePath)) : '';
    return `<details class="work record" id="work-${esc(w.id)}"><summary><span class="year">${esc(w.year)}</span><span class="record-heading">${headline(w.line1)}${other && other !== mainTitle ? `<span class="translation" lang="${lang === 'ko' ? 'en' : 'ko'}">${esc(other)}</span>` : ''}</span><span class="instrumentation">${esc(w.inst)}</span><span class="disclosure" aria-hidden="true"></span>${w.links.length ? `<span class="work-links">${parts(w.links)}</span>` : ''}</summary><div class="work-details">${expanded.details.map(line => `<p>${parts(line.parts)}</p>`).join('')}${scoreURL ? `<figure class="score"><img data-src="${scoreURL}" alt="${esc(t('label.score'))}" width="300" height="166" loading="lazy" decoding="async"><noscript><a href="${scoreURL}">${esc(t('label.score'))} ↗</a></noscript></figure>` : ''}</div></details>`;
  }).join('\n');
  const nav = c.IDS.map(id=>`<a href="#sec-${id}">${esc(t('nav.'+id))}</a>`).join('');
  const structured = JSON.stringify({'@context':'https://schema.org','@type':'Person',name:v.heroName,alternateName:lang==='ko'?'Jung-Woong Oh':'오정웅',url,jobTitle:v.heroRole,image:origin+'/assets/photo-lines-cut.png',sameAs:[t('contact.soundcloud'),t('contact.instagram')].filter(Boolean)}).replace(/</g,'\\u003c');
  const html = `<!doctype html>
<html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(v.heroName)} — ${esc(v.heroRole)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}"><link rel="alternate" hreflang="ko" href="${origin}/"><link rel="alternate" hreflang="en" href="${origin}/en/"><link rel="alternate" hreflang="x-default" href="${origin}/">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(v.heroName+' — '+v.heroRole)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="${lang==='ko'?'ko_KR':'en_US'}"><meta property="og:image" content="${origin}/assets/photo-lines-cut.png"><meta property="og:image:width" content="700"><meta property="og:image:height" content="870"><meta property="og:image:alt" content="${esc(v.heroName)}"><meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap">
<script type="application/ld+json">${structured}</script><script src="/assets/site.js" defer></script>
</head><body>
<a class="skip-link" href="#sec-about">${lang==='ko'?'본문으로 건너뛰기':'Skip to content'}</a>
<header><div class="header-inner"><nav aria-label="${lang==='ko'?'주 메뉴':'Main navigation'}">${nav}</nav><a class="language-link" href="${lang==='ko'?'/en/':'/'}" lang="${lang==='ko'?'en':'ko'}" hreflang="${lang==='ko'?'en':'ko'}">${esc(v.langLabel)}</a></div></header>
<main>
<section id="sec-about" aria-labelledby="heading-about"><div class="hero"><img class="hero-handwriting" src="${asset(data.handwriting.name)}" alt="" width="1207" height="430" fetchpriority="high"><div class="hero-identity"><h1>${esc(v.heroName)}</h1><p>${esc(v.heroRole)}</p><div class="hero-actions"><a class="channel-link" href="${safeURL(v.recitalHref)}" target="_blank" rel="noopener noreferrer">${esc(v.listenLabel)} ↗</a><a class="channel-link" href="#sec-works">${esc(v.worksLabel)} ↓</a></div></div><img class="portrait" src="/assets/portrait-700.webp" srcset="/assets/portrait-350.webp 350w, /assets/portrait-700.webp 700w" sizes="(min-width:1120px) 325px, 240px" alt="${esc(v.heroName)}" width="700" height="870" fetchpriority="high" decoding="async"></div>${heading('about')}<div class="about-prose">${about}${v.recitalHref?`<a class="channel-link recital-link" href="${safeURL(v.recitalHref)}" target="_blank" rel="noopener noreferrer">${esc(v.recitalLabel)} ↗</a>`:''}</div></section>
<section id="sec-works" aria-labelledby="heading-works">${heading('works')}${works}</section>
${['performances','research','news'].map(id=>`<section id="sec-${id}" aria-labelledby="heading-${id}">${heading(id)}${v.rows[id].map(record).join('\n')}</section>`).join('\n')}
<section id="sec-contact" aria-labelledby="heading-contact">${heading('contact')}${v.rows.contact.filter(r=>r.line1.some(p=>safeURL(p.href))).map(r=>`<div class="record"><div class="contact-inner">${parts(r.line1)}</div></div>`).join('')}<footer>${esc(v.footer)}</footer></section>
</main></body></html>\n`;
  const dest = path.join(root, lang === 'ko' ? 'index.html' : 'en/index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });fs.writeFileSync(dest, html);
}
fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url><url><loc>${origin}/en/</loc></url></urlset>\n`);
console.log('Built Korean and English static pages from data/*.json');
