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
let failed = 0;
for (const [name, run] of tests) {
  try { run(); console.log('PASS ' + name); }
  catch (error) { failed++; console.error('FAIL ' + name + '\n' + error.message); }
}
process.exitCode = failed ? 1 : 0;
