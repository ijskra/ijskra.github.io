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
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 const page=await context.newPage();await page.goto(base);await page.locator('summary').first().click();assert(await page.locator('details').first().evaluate(el=>el.open));
 await page.locator('.language-link').click();assert.equal(await page.locator('html').getAttribute('lang'),'en');await context.close();
 console.log('PASS: both languages at 7 widths, native disclosure, navigation and no-JS access');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
