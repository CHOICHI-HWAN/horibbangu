// Real-time endurance check: do not replace the browser animation clock.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.desktopHost={passive:true,setHitRegions:()=>{},setBackground:()=>{},quit:()=>{},onCommand:cb=>window.nativeCommand=cb};});
  await page.goto(pathToFileURL(path.join(__dirname,'../desktop/windows/playground.html')).href);
  await page.evaluate(()=>{nativeCommand('layer-top');setDesktopBackground(false);});
  assert(await page.locator('body').evaluate(el=>el.classList.contains('controls-visible')));
  await page.locator('#closeControls').click();
  assert(await page.locator('#desktopMenuButton').isVisible());
  await page.locator('#desktopMenuButton').click();
  assert(await page.locator('body').evaluate(el=>el.classList.contains('controls-visible')));
  await page.locator('#closeControls').click();
  await page.evaluate(()=>{const c=cats[0];c.x=400;c.y=0;c.air=false;c.stand=null;setMode(c,'watch',performance.now(),1e9);renderCatPosition(c);});
  await page.locator('.cat').first().click({force:true});
  assert(await page.locator('body').evaluate(el=>el.classList.contains('controls-visible')));
  await page.locator('#closeControls').click();
  // Freeze all clocks on hide, then resume through repeated native commands.
  for(let i=0;i<3;i++){
   await page.evaluate(()=>nativeCommand('host-hidden'));
   const a=await page.evaluate(()=>({t:lastT,lake:lastLakeFrame}));
   await page.waitForTimeout(150);
   assert.deepEqual(await page.evaluate(()=>({t:lastT,lake:lastLakeFrame})),a);
   assert(await page.evaluate(()=>document.getAnimations().filter(a=>a instanceof CSSAnimation).every(a=>a.playState!=='running')));
   await page.evaluate(()=>nativeCommand('host-visible'));
   await page.waitForFunction(t=>lastT>t,a.t);
  }
  const cdp=await page.context().newCDPSession(page);
  await page.evaluate(()=>{
   window.frameTimes=[];const tick=tickCats;
   tickCats=t=>{frameTimes.push(t);if(frameTimes.length>600)frameTimes.shift();return tick(t);};
   window.cycleCount=0;
   window.cycleTimer=setInterval(()=>{
    const t=performance.now(),modes=['walk','sleep','groom','watch','stretch','yawn'];
    cats.forEach((c,i)=>{leave(c,t);setMode(c,modes[(cycleCount+i)%modes.length],t,1100);});
    cycleCount++;
   },1000);
  });
  const samples=[];
  const seconds=Number(process.env.SOAK_SECONDS||120);
  for(let n=0;n<Math.ceil(seconds/10);n++){
   await page.waitForTimeout(10000);
   await cdp.send('HeapProfiler.collectGarbage');
   const sample=await page.evaluate(()=>{
    const gaps=frameTimes.slice(1).map((t,i)=>t-frameTimes[i]).sort((a,b)=>a-b);
    return {cycles:cycleCount,nodes:document.getElementsByTagName('*').length,catNodes:Object.fromEntries(cats.map(c=>[c.id,c.el.querySelectorAll('*').length])),animations:document.getAnimations().length,running:document.getAnimations().filter(a=>a.playState==='running').length,fps:frameTimes.length>1?(frameTimes.length-1)*1000/(frameTimes.at(-1)-frameTimes[0]):0,p95ms:gaps[Math.floor(gaps.length*.95)]};
   });
   sample.heap=(await cdp.send('Runtime.getHeapUsage')).usedSize;samples.push(sample);
   console.log(JSON.stringify(sample));
  }
  const first=samples[0],last=samples.at(-1);
  assert(last.fps>35,'Cat movement must remain smooth at normal resolution');
  assert(last.fps>=first.fps*.75,'Sustained frame cadence degraded');
  assert(last.heap<first.heap+4e6,'Live heap grew after forced collection');
  for(const id of new Set(samples.flatMap(s=>Object.keys(s.catNodes)))){
   const counts=samples.filter(s=>id in s.catNodes).map(s=>s.catNodes[id]);
   assert(Math.max(...counts)-Math.min(...counts)<12,'Transient DOM accumulated for '+id);
  }
  const outside=s=>s.nodes-Object.values(s.catNodes).reduce((a,n)=>a+n+1,0);
  assert(Math.abs(outside(last)-outside(first))<20,'Room DOM accumulated');
  assert(last.animations<first.animations+80,'Animations accumulated');
  assert(last.running>0,'CSS animations must use the native browser clock');
  await page.evaluate(()=>{clearInterval(cycleTimer);nativeCommand('layer-background');});
  assert(await page.locator('#desktopMenuButton').isHidden());
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'../build/desktop-lifecycle.json'),JSON.stringify({seconds,samples},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
