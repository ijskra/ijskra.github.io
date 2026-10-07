const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const decode = s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
for (const lang of ['ko','en']) {
 const file = lang === 'ko' ? 'index.html' : 'en/index.html';
 test(`${lang}: real content and all published works exist without executing JavaScript`, () => {
  const html = read(file);
  assert(!html.includes('【'), 'Editorial placeholders must not be published');
  assert(!html.includes('{{'));assert(!html.includes('<x-dc'));
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  assert.equal((html.match(/<h2[ >]/g)||[]).length,6);
  assert.match(html,new RegExp(`<html lang="${lang}"`));
  const works = JSON.parse(read('data/works.json')).filter(w=>w['웹']===undefined||w['웹']==='Y');
  assert.equal((html.match(/<details /g)||[]).length,works.length);
  for(const w of works)assert(html.includes(`id="work-${w.id}"`));
  const about = JSON.parse(read('data/about.json'))[lang==='ko'?'국문':'영문'];
  const text = decode(html.replace(/<[^>]+>/g,''));
  for(const p of about)for(const segment of p)assert(text.includes(segment.t));
  assert(!/src="[^"]*(support\.js|react)/.test(html));
  assert(!html.includes('href="#"'));
 });
 test(`${lang}: canonical, language alternatives and share metadata are complete`,()=>{
  const html=read(file),url='https://ijskra.github.io'+(lang==='ko'?'/':'/en/');
  assert(html.includes(`rel="canonical" href="${url}"`));
  for(const key of ['description','og:title','og:description','og:image','og:url','twitter:card'])assert(html.includes(`="${key}"`));
  for(const locale of ['ko','en','x-default'])assert(html.includes(`hreflang="${locale}"`));
  const person=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(person['@type'],'Person');assert.equal(person.url,url);
 });
 test(`${lang}: local links resolve and offscreen scores are not fetched initially`,()=>{
  const html=read(file);
  for(const m of html.matchAll(/(?:src|href|data-src)="(\/[^"#]*)"/g)){
   let local=m[1].slice(1);if(!local||local.endsWith('/'))local+='index.html';
   assert(fs.existsSync(path.join(root,local)),`Missing ${local}`);
  }
  for(const m of html.matchAll(/href="#([^"]+)"/g))assert(html.includes(`id="${m[1]}"`));

  assert(!/<img src="[^"]*score/.test(html));
  assert.match(html,/class="portrait"[^>]+width="700" height="870"/);
 });
}
test('Building is deterministic and generated outputs are current',()=>{
 const files=['index.html','en/index.html','robots.txt','sitemap.xml'];
 const before=files.map(read);execFileSync(process.execPath,['scripts/build.cjs'],{cwd:root});
 files.forEach((p,i)=>assert.equal(read(p),before[i],`Rebuild and commit ${p}`));
});
test('Content is escaped and unsafe links never become executable HTML',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'homepage-build-'));
 try{
  for(const p of ['scripts','src','data','assets'])fs.cpSync(path.join(root,p),path.join(temp,p),{recursive:true});
  const about=JSON.parse(fs.readFileSync(path.join(temp,'data/about.json')));
  about['국문'][0].push({t:'<img src=x onerror=alert(1)>'});
  fs.writeFileSync(path.join(temp,'data/about.json'),JSON.stringify(about));
  const works=JSON.parse(fs.readFileSync(path.join(temp,'data/works.json')));
  works[0]['악보이미지']='works/deluge-score.webp';
  fs.writeFileSync(path.join(temp,'data/works.json'),JSON.stringify(works));
  const strings=JSON.parse(fs.readFileSync(path.join(temp,'data/strings.json')));
  strings['contact.soundcloud']['국문']='javascript:alert(1)';
  fs.writeFileSync(path.join(temp,'data/strings.json'),JSON.stringify(strings));
  execFileSync(process.execPath,['scripts/build.cjs'],{cwd:temp});
  const html=fs.readFileSync(path.join(temp,'index.html'),'utf8');
  assert(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert(!html.includes('href="javascript:'));
  assert.match(html,/<img data-src="\/assets\/works\/deluge-score.webp"[^>]+loading="lazy"/);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
