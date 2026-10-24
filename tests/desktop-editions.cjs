const assert=require('node:assert/strict');
const path=require('node:path');
const version=require('../desktop/windows/package.json').version;
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  const root=path.join(__dirname,'..');
  const context=await browser.newContext({viewport:{width:1440,height:900},offline:true});
  const original=await context.newPage();
  await original.goto(pathToFileURL(path.join(root,'desktop/windows/playground.html')).href);
  await original.evaluate(()=>inviteRoomFriends());
  const originals=await original.evaluate(()=>Object.fromEntries(cats.filter(c=>c.guest).map(c=>[c.name,{svg:c.el.querySelector('svg').outerHTML,body:c.el.style.getPropertyValue('--body'),head:c.el.style.getPropertyValue('--head'),eye:c.el.style.getPropertyValue('--eye'),scale:c.scale}])));
  for(const [edition,names] of [['park',['소양','소미']],['kim',['팡이']]]){
   const page=await context.newPage();const errors=[],requests=[];
   await page.addInitScript(()=>{window.desktopHost={passive:true,setInteractive:()=>{},setBackground:()=>{},onCommand:()=>{},quit:()=>{}};});
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
   await page.goto(pathToFileURL(path.join(root,'build/editions',edition,'playground.html')).href);
   assert.deepEqual(await page.evaluate(()=>cats.map(c=>c.name)),names);
   const actual=await page.evaluate(()=>Object.fromEntries(cats.map(c=>[c.name,{svg:c.el.querySelector('svg').outerHTML,body:c.el.style.getPropertyValue('--body'),head:c.el.style.getPropertyValue('--head'),eye:c.el.style.getPropertyValue('--eye'),scale:c.scale}])));
   for(const name of names)assert.deepEqual(actual[name],originals[name],name+' artwork changed');
   await page.evaluate(()=>{inviteRoomFriends();for(let t=0;t<7200;t+=60)tickRoomGuests(performance.now()+t*1000,60);renderCats();setRoomControls(true);});
   assert.deepEqual(await page.evaluate(()=>cats.map(c=>c.name)),names);
   assert(await page.locator('#friendsBtn').isHidden());assert(await page.locator('#wingsBtn').isHidden());
   assert.equal(await page.locator('[id^="windows"],#recordsLink').count(),0);
   await page.evaluate(()=>setDesktopBackground(true));await page.waitForFunction(()=>lastLakeFrame>0);
   await page.screenshot({path:path.join(root,'build/editions',edition,'preview.png')});
   await page.evaluate(()=>setDesktopBackground(false));
   await page.setViewportSize({width:800,height:600});await page.waitForTimeout(250);
   assert.deepEqual(await page.evaluate(()=>cats.map(c=>c.name)),names);
   await page.evaluate(()=>{const c=cats[0];c.x=200;c.y=0;c.stand=GROUND;c.air=false;c.mode='sit';c.until=1e12;renderCatPosition(c);});
   const box=await page.locator('.cat').first().boundingBox();
   await page.mouse.move(box.x+32,box.y+20);await page.mouse.down();await page.mouse.move(box.x+120,box.y-60,{steps:8});
   assert(await page.evaluate(()=>cats[0].mode!=='bubble'));await page.mouse.up();
   assert.equal(await page.locator('.cat').first().evaluate(el=>getComputedStyle(el).pointerEvents),'none');
   assert(await page.locator('.header-actions').isHidden());
   assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
   console.log(edition+': exact resident-only roster, unchanged guest artwork, no visitor arrivals/departures, offline background and passive non-interactive renderer verified.');
   await page.close();
  }
  const web=await context.newPage();await web.goto(pathToFileURL(path.join(root,'index.html')).href);
  await web.evaluate(()=>setRoomControls(true));
  for(const [id,file] of [['windowsPark','Park'],['windowsKim','Kim']]){
   assert(await web.locator('#'+id).isVisible());assert.equal(await web.locator('#'+id).getAttribute('href'),'/releases/Horibbangu-'+file+'-Windows-v'+version+'.zip');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
