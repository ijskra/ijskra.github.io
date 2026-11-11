// npm install --no-save --package-lock=false playwright@1.51.1
// npx playwright install chromium
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch();
 try{
 fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
 for(const width of [320,390,768,1024,1119,1120,1440])for(const lang of ['ko','en']){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<760,isMobile:width<760});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+(lang==='ko'?'/':'/en/'));await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1);
  assert(await page.evaluate(expected=>document.documentElement.scrollWidth<=expected+1,width),`${lang} ${width}: overflow`);
  const work=page.locator('details.work').first();const summary=work.locator('summary');
  await summary.focus();await page.keyboard.press('Enter');assert(await work.evaluate(el=>el.open));
  assert(await page.evaluate(expected=>document.documentElement.scrollWidth<=expected+1,width),`${lang} ${width}: expanded overflow`);
  await page.keyboard.press('Enter');assert(!(await work.evaluate(el=>el.open)));
  await page.locator('nav a[href="#sec-contact"]').click();await page.waitForTimeout(1700);
  assert.equal(await page.locator('nav a[aria-current]').getAttribute('href'),'#sec-contact');
  await page.goto(base+(lang==='ko'?'/':'/en/'));await page.evaluate(()=>document.fonts.ready);
  if([390,768,1440].includes(width))await page.screenshot({path:path.join(root,`test-results/${lang}-${width}.png`),fullPage:true});

  // Design-review variants are injected only into screenshots, never the built site.
  if(lang==='ko' && [390,1440].includes(width)){
   const palettes=[
    {name:'lilac',paper:'#eee9f1',ink:'#3d3147',muted:'#706079',accent:'#74528c',staff:'#cfc3d7',wash:'238,233,241',mark:'190,168,202'},
    {name:'olive',paper:'#edeee2',ink:'#383e29',muted:'#666d50',accent:'#637232',staff:'#c9ccb4',wash:'237,238,226',mark:'177,186,129'}
   ];
   for(const p of palettes){
    const svg=fs.readFileSync(path.join(root,'assets/staff-celadon.svg'),'utf8').replaceAll('#bdcbc2',p.staff);
    const style=await page.addStyleTag({content:`:root{--paper:${p.paper};--ink:${p.ink};--muted:${p.muted};--accent:${p.accent};--staff:url("data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}")}
     .about-prose::before{background:rgba(${p.wash},.42)}
     mark{background:rgba(${p.mark},.38)}`});
    await page.screenshot({path:path.join(root,`test-results/${p.name}-${width}.png`),fullPage:true});
    await style.evaluate(el=>el.remove());
   }
  }
  assert.deepEqual(errors,[]);await context.close();
 }

 // The Concertante landing page must remain readable without JavaScript.
 for(const width of [320,390,1024,1440]){
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width,height:900}});
  const page=await context.newPage();
  const response=await page.goto(base+'/concertante/');
  assert.equal(response.status(),200);
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1);
  assert(await page.evaluate(w=>document.documentElement.scrollWidth<=w+1,width),`concertante ${width}: overflow`);
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
  assert(await page.locator('img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)),'Concertante images must load');
  assert.equal(await page.locator('img[data-portrait="jungwoong"]').count(),1);
  assert.equal((await page.locator('[data-selection-project]').textContent()).replace(/\s+/g,' ').trim(),'2026년 서울문화재단 예술창작활동지원 선정 프로젝트');
  assert.equal(await page.locator('[data-sponsor-credit]').textContent(),'후원 서울특별시, 서울문화재단');
  assert.equal(await page.locator('img[data-sponsor]').count(),2);
  assert(await page.locator('[data-organizer-credits]').evaluate(el=>el.scrollWidth<=el.clientWidth),'Organizer and sponsor credits must fit one line');
  assert.equal(await page.locator('img[data-venue="lotte-concert-hall"]').count(),2);
  assert.equal(await page.locator('[data-sponsor-logos] img[data-venue]').count(),0,'The venue must not be classified as a funding sponsor');
  assert(await page.locator('[data-funding-credits] img').evaluateAll(images=>images.every(img=>{
   const rect=img.getBoundingClientRect();
   const panel=img.closest('[data-funding-credits]').getBoundingClientRect();
   const style=getComputedStyle(img);
   const hasOriginalRatio=Math.abs(rect.width/rect.height-img.naturalWidth/img.naturalHeight)<0.02;
   return img.complete&&img.naturalWidth>0&&rect.width>0&&rect.height>0&&
    rect.left>=panel.left&&rect.right<=panel.right&&rect.top>=panel.top&&rect.bottom<=panel.bottom&&
    rect.left>=0&&rect.right<=innerWidth&&hasOriginalRatio&&style.filter==='none'&&style.opacity==='1';
  })),'All logos must load, retain their proportions/colors and stay within the panel and viewport');
  assert(await page.locator('[data-venue]').first().evaluate(img=>img.getBoundingClientRect().width*(314.39/366.39)>=36),'Lotte visible lockup must exceed the official web minimum');
  await page.locator('[data-funding-credits]').screenshot({path:path.join(root,`test-results/concertante-sponsors-${width}.png`)});

  assert(await page.evaluate(()=>document.fonts.check('300 128px "ConcertanteOriginalCormorant"','11.16')),'Concertante date font must load');
  assert(await page.evaluate(()=>document.fonts.check('400 12px "ConcertanteOriginalCinzel"','PROGRAM')),'Concertante label font must load');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://ijskra.github.io/concertante/');
  assert.equal(await page.locator('a').filter({hasText:'예매하기'}).getAttribute('href'),'https://www.lotteconcerthall.com/product/performance/261250');
  assert.equal(await page.locator('[data-program-note-link]').getAttribute('href'),'/concertante/program_note/');
  assert.equal(await page.locator('[data-movements]').count(),2);
  assert(await page.locator('[data-movements]>span>span').evaluateAll(units=>units.every(unit=>{
   const box=unit.getBoundingClientRect(),row=unit.closest('[data-movements]').getBoundingClientRect();
   return box.right<=row.right+1;
  })),'Movement names must not be clipped');
  if(width===390){
   const title=await page.locator('h1').evaluate(el=>({height:el.getBoundingClientRect().height,line:parseFloat(getComputedStyle(el).lineHeight)}));
   assert(title.height<title.line*1.5,'Concertante desktop-sized mobile title should fit one line');
   await page.screenshot({path:path.join(root,'test-results/concertante-390-top.png')});
  }
  await page.screenshot({path:path.join(root,`test-results/concertante-${width}.png`),fullPage:true});
  await context.close();
 }
 console.log('PASS: Concertante at 320/390/1024/1440px, official sponsor and venue logos without clipping/distortion, date font loading, booking link and no-JS content');

 // The programme note mirrors the printed programme and must also read without JavaScript.
 for(const width of [320,390,1024,1440]){
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width,height:900}});
  const page=await context.newPage();
  const response=await page.goto(base+'/concertante/program_note/');
  assert.equal(response.status(),200);
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.locator('h1').textContent(),'프로그램 노트');
  assert(await page.evaluate(w=>document.documentElement.scrollWidth<=w+1,width),`programme note ${width}: overflow`);
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
  assert(await page.locator('img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)),'Programme note images must load');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://ijskra.github.io/concertante/program_note/');
  assert.deepEqual(await page.locator('[data-note]').evaluateAll(notes=>notes.map(note=>note.dataset.note)),['sonata','concerto-grosso','concertante']);
  assert.equal(await page.locator('[data-section="from-the-composer"]').count(),0);
  assert.equal(await page.locator('a.home').getAttribute('href'),'/concertante/');
  assert.equal(await page.locator('a.back').getAttribute('href'),'/concertante/');
  assert.equal(await page.locator('a[href*="lotteconcerthall.com"]').count(),0,'The programme note carries no booking link');
  assert.deepEqual(await page.locator('[data-sources-link]').evaluateAll(links=>links.map(link=>link.getAttribute('href'))),['/concertante/program_note/sources/','/concertante/program_note/sources/']);
  assert.equal(await page.locator('.hero img[data-venue="lotte-concert-hall"]').count(),1,'The cover must show the venue with its official logotype');
  assert.equal(await page.locator('.info img[data-venue="lotte-concert-hall"]').count(),1);
  assert(!(await page.locator('.hero').innerText()).includes('롯데콘서트홀'),'The venue must not be set in type on the cover');
  assert(await page.locator('img[data-venue]').evaluateAll(images=>images.every(img=>{
   const rect=img.getBoundingClientRect(),style=getComputedStyle(img);
   // The SVG is 275.05 x 44.80; naturalWidth/naturalHeight round that to 275 x 45.
   return Math.abs(rect.width/rect.height-275.05/44.8)<0.02&&rect.width*(314.39/366.39)>=36&&
    rect.left>=0&&rect.right<=innerWidth&&style.filter==='none'&&style.opacity==='1';
  })),'Lotte logotype must keep its proportions and colour and exceed the official web minimum');
  assert(await page.locator('.movements>span>span').evaluateAll(units=>units.every(unit=>{
   const box=unit.getBoundingClientRect(),row=unit.closest('.movements').getBoundingClientRect();
   return box.right<=row.right+1;
  })),'Movement names must not be clipped');
  assert(await page.evaluate(()=>document.fonts.check('400 44px "ConcertanteOriginalMaru"','프로그램 노트')),'Programme note title font must load');
  assert(await page.evaluate(()=>document.fonts.check('400 12px "ConcertanteOriginalCinzel"','PROGRAM NOTE')),'Programme note label font must load');
  await page.screenshot({path:path.join(root,`test-results/concertante-program-note-${width}.png`),fullPage:true});
  await context.close();
 }
 console.log('PASS: Concertante programme note at 320/390/1024/1440px, three notes, composer quote, official venue logotype, links back to the landing page and no-JS content');
 // The sources page gives the originals behind the programme note; it must also read without JavaScript.
 for(const width of [320,390,1024,1440]){
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width,height:900}});
  const page=await context.newPage();
  const response=await page.goto(base+'/concertante/program_note/sources/');
  assert.equal(response.status(),200);
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.locator('h1').textContent(),'자세한 이야기');
  assert(await page.evaluate(w=>document.documentElement.scrollWidth<=w+1,width),`sources ${width}: overflow`);
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
  assert(await page.locator('img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)),'Sources page images must load');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://ijskra.github.io/concertante/program_note/sources/');
  assert.deepEqual(await page.locator('[data-group]').evaluateAll(groups=>groups.map(group=>group.dataset.group)),['introduction','sonata','concerto-grosso','concertante']);
  assert(await page.locator('[data-entry]').evaluateAll(entries=>entries.length>=10&&entries.every(entry=>entry.querySelector('.lemma')&&(entry.querySelector('.orig')||entry.querySelector('.src')))),'Every entry needs the phrase from the note and its original or source');
  assert(await page.locator('.orig').evaluateAll(quotes=>quotes.every(quote=>{
   const box=quote.getBoundingClientRect();
   return quote.lang&&quote.scrollWidth<=quote.clientWidth+1&&box.left>=0&&box.right<=innerWidth;
  })),'Original-language quotations must carry their language and fit the column');
  assert.equal(await page.locator('a.home').getAttribute('href'),'/concertante/');
  assert.equal(await page.locator('.head a.label').getAttribute('href'),'/concertante/program_note/');
  assert.equal(await page.locator('a.back').getAttribute('href'),'/concertante/program_note/');
  assert.equal(await page.locator('a.buy').getAttribute('href'),'https://www.lotteconcerthall.com/product/performance/261250');
  assert.equal(await page.locator('.info img[data-venue="lotte-concert-hall"]').count(),1);
  assert(!(await page.locator('.head').innerText()).includes('롯데콘서트홀'),'The venue must not be set in type');
  assert(await page.locator('img[data-venue]').evaluateAll(images=>images.every(img=>{
   const rect=img.getBoundingClientRect(),style=getComputedStyle(img);
   return Math.abs(rect.width/rect.height-275.05/44.8)<0.02&&rect.width*(314.39/366.39)>=36&&
    rect.left>=0&&rect.right<=innerWidth&&style.filter==='none'&&style.opacity==='1';
  })),'Lotte logotype must keep its proportions and colour and exceed the official web minimum');
  assert(await page.evaluate(()=>document.fonts.check('400 44px "ConcertanteOriginalMaru"','자세한 이야기')),'Sources title font must load, including the supplement for 야');
  assert(await page.evaluate(()=>document.fonts.check('400 19px "ConcertanteOriginalCormorant"','Cum ergo sit in medio')),'Quotation font must load');
  await page.screenshot({path:path.join(root,`test-results/concertante-sources-${width}.png`),fullPage:true});
  await context.close();
 }
 console.log('PASS: Concertante sources page at 320/390/1024/1440px, four groups of entries, quotations within the column, links back to the programme note and no-JS content');
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 const page=await context.newPage();await page.goto(base);await page.locator('summary').first().focus();await page.keyboard.press('Enter');assert(await page.locator('details').first().evaluate(el=>el.open));
 await page.locator('.language-link').click();assert.equal(await page.locator('html').getAttribute('lang'),'en');await context.close();
 console.log('PASS: both languages at 7 widths, native disclosure, navigation and no-JS access');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});

