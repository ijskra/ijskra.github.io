const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
const data = Object.fromEntries(['strings', 'works', 'performances', 'film', 'research', 'news', 'about', 'handwriting'].map(name => [name, JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'))]));

function create({ width = 390, screenWidth = width, screenHeight = 844, touch = true, hover = false } = {}) {
  const window = { innerWidth: width, screen: { width: screenWidth, height: screenHeight }, navigator: { maxTouchPoints: touch ? 5 : 0 }, matchMedia: () => ({ matches: hover }) };
  if (touch) window.ontouchstart = null;
  const context = vm.createContext({ window, screen: window.screen, navigator: window.navigator, matchMedia: window.matchMedia,
    DCLogic: class { constructor() { this.props = {}; } setState(patch, cb) { Object.assign(this.state, typeof patch === 'function' ? patch(this.state) : patch); if (cb) cb(); } },
    React: { createRef: () => ({ current: null }), createElement: (...args) => ({ args }) }
  });
  const Component = vm.runInContext(script + '\nComponent', context);
  const component = new Component(); component.state.data = structuredClone(data);
  return { component, window };
}

const tests = [];
const test = (name, run) => tests.push([name, run]);
test('Phone stays mobile while expanding, collapsing and switching language after viewport inflation', () => {
  for (const width of [320, 390, 430]) {
    const { component: c, window } = create({ width });
    assert.equal(c.layout().mobile, true);
    window.innerWidth = 1120; // Layout viewport can widen when content overflows on a phone.
    for (const lang of ['ko', 'en']) {
      c.state.lang = lang;
      let w = c.renderVals().works[0];
      w.enter(); // A tap may synthesize mouseenter before click.
      w.toggle();
      assert.equal(c.layout().mobile, true);
      assert.equal(c.layout().colW, width - 40);
      assert.equal(c.renderVals().S.main.minWidth || 0, 0);
      w = c.renderVals().works[0]; assert.equal(w.expanded, true);
      w.toggle(); assert.equal(c.renderVals().works[0].expanded, false);
    }
  }
});
test('Touch-generated mouseenter cannot keep a tapped row open', () => {
  const { component: c } = create();
  c.renderVals().works[0].enter();
  assert.equal(c.state.hover, null);
  c.renderVals().works[0].toggle();
  c.renderVals().works[0].enter();
  c.renderVals().works[0].toggle();
  assert.equal(c.renderVals().works[0].expanded, false);
});
test('Landscape phones remain mobile while desktop hover and resizing still work', () => {
  const phone = create({ width: 844, screenWidth: 844, screenHeight: 390 });
  assert.equal(phone.component.layout().mobile, true);
  const { component: c, window } = create({ width: 1440, screenHeight: 900, touch: false, hover: true });
  assert.equal(c.layout().mobile, false);
  c.renderVals().works[0].enter(); assert.equal(c.renderVals().works[0].expanded, true);
  c.renderVals().works[0].leave(); assert.equal(c.renderVals().works[0].expanded, false);
  window.innerWidth = 600; assert.equal(c.layout().mobile, true);
  window.innerWidth = 1440; assert.equal(c.layout().mobile, false);
});
test('Recent recital, channel and concert-title edits are preserved', () => {
  const { component: c } = create();
  const values = c.renderVals();
  assert.equal(values.recitalHref, 'https://www.youtube.com/playlist?list=PL8Nlwer_Hmze78ksg_CAu7tqcc9dFKL08');
  const links = values.rows.contact.flatMap(row => row.line1.map(part => part.href));
  assert(links.includes('https://soundcloud.com/ijskra'));
  assert(links.includes('https://www.instagram.com/ijskra/'));
  assert(c.state.data.news.find(row => row.id === 'n02')['제목_국문'].startsWith('「콘체르탄테:'));
});
function assertFlow(style) {
  assert.equal(style.position, 'relative');
  assert.equal(style.whiteSpace, 'normal');
  assert.equal(style.overflowWrap, 'anywhere');
  assert(style.height === undefined || style.height === 'auto', 'Text must not have a fixed height');
  assert(style.maxHeight === undefined || style.maxHeight === 'none', 'Text must not have a height cap');
  assert(!['hidden', 'clip'].includes(style.overflow), 'Text must not be clipped');
}
test('Long phone descriptions retain every detail and grow in normal document flow', () => {
  for (const width of [320, 390, 430, 759]) for (const lang of ['ko', 'en']) {
    const { component: c, window } = create({ width });
    c.state.lang = lang;
    const r = c.state.data.works[0];
    const long = '긴 설명과 연주자 명단 Long description and performers '.repeat(30);
    r['편성_국문'] = r['편성_영문'] = 'LongUnbrokenInstrumentation'.repeat(40);
    r['초연장소_국문'] = r['초연장소_영문'] = long + 'PREMIERE_END';
    r['연주자'] = r['연주자_영문'] = long + 'PERFORMERS_END';
    r['재연'] = long + 'REPEAT_END';
    r['지원기관'] = long + 'SUPPORT_END';
    c.state.pinned = r.id;
    window.innerWidth = 1120;
    const v = c.renderVals(), w = v.works[0];
    const text = w.details.flatMap(line => line.parts.map(p => p.text || '')).join(' ');
    for (const suffix of ['PREMIERE_END', 'PERFORMERS_END', 'REPEAT_END', ...(lang === 'ko' ? ['SUPPORT_END'] : [])]) {
      assert(text.includes(suffix), 'Truncated detail: ' + suffix);
    }
    assert(w.rowStyle.height === undefined || w.rowStyle.height === 'auto');
    assert(!['hidden', 'clip'].includes(w.rowStyle.overflow));
    w.details.forEach(line => assertFlow(line.style));
    for (const key of ['titleRow', 'inst', 'linksRow', 'line2', 'rightRow', 'contactRow', 'performanceVideo']) assertFlow(v.S[key]);
    w.toggle(); assert.equal(c.renderVals().works[0].details.length, 0);
    c.renderVals().works[0].toggle(); assert.equal(c.renderVals().works[0].details.length, w.details.length);
  }
});
test('Other mobile records and contact links have no fixed-height ancestor', () => {
  const { component: c } = create({ width: 320 });
  const v = c.renderVals();
  assert.equal(v.S.row.height, undefined);
  assert.equal(v.S.rowLines.backgroundRepeat, 'no-repeat');
  for (const row of v.rows.performances) assert.equal(row.rowStyle.height, undefined);
  for (const row of v.rows.contact) assertFlow(row.rowStyle);
  for (const list of ['research', 'news', 'contact']) {
    const start = html.indexOf('<sc-for list="{{ rows.' + list + ' }}"');
    assert(start >= 0);
    const firstDiv = html.slice(start).match(/<div\b[^>]*>/)[0];
    assert.equal(firstDiv, '<div style="{{ S.row }}">');
  }
});

test('Tablet widths and browser zoom use flowing rows without offscreen hero or prose decoration', () => {
  for (const width of [320, 390, 430, 600, 759, 760, 768, 820, 1024, 1119, 1120, 1440]) {
    const { component: c } = create({ width, screenWidth: 1440, screenHeight: 900, touch: false });
    const layout = c.layout();
    assert.equal(layout.mobile, width < 1120);
    for (const lang of ['ko', 'en']) {
      c.state.lang = lang;
      const v = c.renderVals();
      assert((v.S.main.minWidth || 0) <= width);
      for (const name of ['prose', 'proseBack']) {
        const box = v.S[name];
        assert(box.left >= 0 && box.left + box.width <= Math.min(width, 1440), `${width}: ${name} overflows`);
      }
      const photo = v.S.photo;
      assert((photo.left ?? photo.right) + photo.width <= width);
      if (layout.tablet) assert(v.S.hwName.left + v.S.hwName.width < width - photo.right - photo.width);
      if (layout.mobile) {
        assertFlow(v.S.workTitleRow);
        for (const work of v.works) {
          work.toggle();
          const expanded = c.renderVals().works.find(w => w.id === work.id);
          assert.equal(expanded.expanded, true);
          expanded.details.forEach(line => assertFlow(line.style));
          expanded.toggle();
        }
      }
    }
  }
});
test('First-screen links lead to the recital and works before the long biography', () => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const { component: c } = create({ width, touch: false });
    for (const lang of ['ko', 'en']) {
      c.state.lang = lang;
      const v = c.renderVals();
      assert(v.S.heroActions.top + 88 < v.S.prose.top);
      assert(v.S.heroActions.top + 88 < 600);
      assert(v.recitalHref.startsWith('https://www.youtube.com/playlist?'));
      let destination;
      c.go = id => { destination = id; };
      v.goWorks();
      assert.equal(destination, 'works');
      assert(v.listenLabel && v.worksLabel);
      assert(v.S.prose.fontSize >= 15);
      assert(parseFloat(v.S.prose.lineHeight) >= 24);
    }
  }
});
test('Disclosure marks follow touch and keyboard state without consuming link activation', () => {
  const { component: c } = create();
  let w = c.renderVals().works[0];
  assert.equal(w.toggleMark, '+');
  w.toggle();
  w = c.renderVals().works[0];
  assert.equal(w.toggleMark, '−');
  let prevented = false;
  w.keyToggle({ key: 'Enter', target: { closest: () => ({ tagName: 'A' }) }, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, false);
  assert.equal(c.renderVals().works[0].expanded, true);
  w.keyToggle({ key: ' ', target: { closest: () => null }, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(c.renderVals().works[0].toggleMark, '+');
});
test('All five staff lines fit each tile, section head and expanded/collapsed row', () => {
  const svg = fs.readFileSync(path.join(root, 'assets/staff-lines.svg'), 'utf8');
  const centers = [...svg.matchAll(/M0 ([\d.]+)H100/g)].map(m => Number(m[1]));
  const thickness = Number(svg.match(/stroke-width="([\d.]+)"/)[1]);
  assert.equal(centers.length, 5);
  for (let i = 1; i < centers.length; i++) assert(Math.abs(centers[i] - centers[i - 1] - 6.5) < 1e-8);
  for (const width of [320, 390, 768, 1024, 1120, 1440]) {
    const { component: c } = create({ width, touch: false });
    const P = c.P, v = c.renderVals();
    assert(centers[0] - thickness / 2 > 0);
    assert(centers.at(-1) + thickness / 2 < P);
    // Section heads end in the gap after a complete five-line group.
    const lastTile = Math.floor(v.S.head.height / P) * P;
    assert(lastTile + centers.at(-1) + thickness / 2 <= v.S.head.height);
    if (c.layout().mobile) {
      // Bottom-anchored separator is entirely in the row's trailing padding,
      // regardless of how much wrapped text precedes it.
      const paddingBottom = Number(v.S.row.padding.split(' ')[2].replace('px', ''));
      const firstFromBottom = -P + 21.8 + centers[0] - thickness / 2;
      const lastFromBottom = -P + 21.8 + centers.at(-1) + thickness / 2;
      assert(firstFromBottom >= -paddingBottom);
      assert(lastFromBottom <= 0);
    } else {
      for (const expanded of [false, true]) {
        if (expanded) v.works[0].toggle();
        const row = c.renderVals().works[0].rowStyle;
        assert(Math.abs(row.height / P - Math.round(row.height / P)) < 1e-8);
        assert.equal(row.transition, 'none');
        const lastStart = (Math.round(row.height / P) - 1) * P + 21.8;
        assert(lastStart + centers.at(-1) + thickness / 2 < row.height);
      }
    }
  }
});

let failed = 0;
for (const [name, run] of tests) {
  try { run(); console.log('PASS ' + name); }
  catch (error) { failed++; console.error('FAIL ' + name + '\n' + error.message); }
}
process.exitCode = failed ? 1 : 0;

