const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const roomURL = pathToFileURL(path.join(__dirname, '../index.html')).href;
(async () => {
  const browser = await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
  try {
    for (const [width,height] of [[320,568],[390,844],[844,390],[560,700],[768,1024],[1200,844],[1920,1080]]) {
      const page=await browser.newPage({viewport:{width,height},reducedMotion:'no-preference',hasTouch:width<600});
      const errors=[], requests=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
      await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
      await page.goto(roomURL);
      const result=await page.evaluate(()=>({
        cats:cats.length,noData:!('records' in state),noAuth:!document.querySelector('dialog'),
        link:document.getElementById('recordsLink').getAttribute('href'),
        furniture:cozySpots.map(p=>p.kind),wheelFrame:nodes.some(p=>p.type==='wheel-frame'),
        routes:nodes.filter(p=>p.node).every(p=>distTo(p).has(GROUND)&&distTo(GROUND).has(p)),
        overflow:document.documentElement.scrollWidth>innerWidth,
        art:document.querySelectorAll('.painting').length,clock:!!document.getElementById('clockHour'),removed:document.querySelectorAll('#orangeDoor,#wanderers,#rain-friend,#guestsBtn,#busBtn').length===0,blink:getComputedStyle(cats[0].el.querySelector('.eyes')).animationName
      }));
      assert.equal(result.cats,8);assert(result.noData&&result.noAuth&&result.routes&&!result.overflow);assert.equal(result.link,'records.html');assert.equal(result.art,4);assert(result.clock&&result.removed);assert.notEqual(result.blink,'none');assert(result.wheelFrame);assert.equal(result.furniture.filter(k=>k==='house-top').length,2);assert(result.furniture.includes('tunnel'));
      assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
      assert(await page.locator('.header-actions').isHidden());assert(await page.locator('#recordsLink').isHidden());
      if(width<600)await page.touchscreen.tap(3,3);else await page.mouse.click(3,3);
      assert(await page.locator('.header-actions').isVisible());assert(await page.locator('#recordsLink').isVisible());
      await page.locator('#restBtn').click();assert(await page.locator('.header-actions').isVisible());
      if(width<600)await page.touchscreen.tap(3,3);else await page.mouse.click(3,3);
      assert(await page.locator('.header-actions').isHidden());
      await page.keyboard.press('Tab');assert(await page.locator('.header-actions').isVisible());
      await page.keyboard.press('Escape');assert(await page.locator('.header-actions').isHidden());
      console.log('room',width,height,'routes and public view passed');await page.close();
    }
    const page=await browser.newPage({viewport:{width:1200,height:844},reducedMotion:'no-preference'});
    await page.addInitScript(()=>window.requestAnimationFrame=()=>0);await page.goto(roomURL);
    const scenes=await page.evaluate(()=>{
      updateRoomTime(new Date(2026,9,22,8,0));const morning={x:getComputedStyle(document.documentElement).getPropertyValue('--reflection-x'),night:getComputedStyle(document.documentElement).getPropertyValue('--night')};
      updateRoomTime(new Date(2026,9,22,16,0));const afternoon=getComputedStyle(document.documentElement).getPropertyValue('--reflection-x');const clock=$('clockHour').getAttribute('transform');
      updateRoomTime(new Date(2026,9,22,23,0));const night={moon:!$('moon').hidden,shade:getComputedStyle(document.documentElement).getPropertyValue('--night')};
      const weather=['clear','rain','snow','hail'].map(w=>{setRoomWeather(w,new Date(2026,9,22,14,5));return document.body.dataset.weather;});
      let t=performance.now();lastT=t;
      function frames(n){for(let i=0;i<n;i++)tickCats(t+=1000/60);}
      cats.forEach(c=>{c.air=false;c.x=innerWidth/2-CAT_W/2;c.y=0;c.mode='sit';c.until=1e9;c.angelAfter=1e9;c.cozy=null;c.goal=null;c.edge=null;c.stand=null;});
      const shared=[];
      const random=Math.random;Math.random=()=>0;
      for(const name of ['보리','건빵','호야']) { const c=cats.find(c=>c.name===name);chooseFavorite(c,t);shared.push({name,kind:c.cozy?.kind,x:c.cozy?.xc}); }
      Math.random=random;frames(10000);
      const resting=shared.map(({name})=>({name,mode:cats.find(c=>c.name===name).mode}));
      const c=cats[0];c.mode='watch';c.until=t+5000;c.el.click();const kiss=c.mode==='kiss';
      return{morning,afternoon,clock,night,weather,shared,kiss};
    });
    assert.notEqual(scenes.morning.x,scenes.afternoon);assert.equal(scenes.clock,'rotate(120 60 78)');assert(scenes.night.moon&&+scenes.night.shade===1);assert.deepEqual(scenes.weather,['clear','rain','snow','hail']);assert(scenes.kiss);assert.equal(scenes.shared[0].kind,'house-top');assert.equal(scenes.shared[1].kind,'house-top');assert.notEqual(scenes.shared[0].x,scenes.shared[1].x);assert.equal(scenes.shared[2].kind,'house-low');
    // Pointer-driven dragging must show the bubble and release the cat back to physics.
    await page.evaluate(()=>{const c=cats[0];c.x=140;c.y=20;c.air=false;c.mode='sit';c.until=1e9;renderCatPosition(c);});
    const box=await page.locator('.cat').first().boundingBox();await page.mouse.move(box.x+32,box.y+20);await page.mouse.down();await page.mouse.move(box.x+230,box.y-180,{steps:8});
    assert(await page.locator('.cat').first().evaluate(el=>el.classList.contains('in-bubble')));await page.mouse.up();
    assert(await page.evaluate(()=>cats[0].air&&cats[0].mode!=='bubble'));
    assert(await page.locator('.header-actions').isHidden());
    console.log('clock, weather, co-sleeping, eye kiss, bubble drag and quiet controls passed');await page.close();
    // Honor system motion preference initially; an explicit user choice enables play and persists.
    const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(roomURL);await reduced.keyboard.press('Tab');assert.equal(await reduced.locator('#motionBtn').textContent(),'움직임 켜기');await reduced.locator('#motionBtn').click();assert.equal(await reduced.locator('#motionBtn').textContent(),'움직임 쉬기');await reduced.reload();await reduced.keyboard.press('Tab');assert.equal(await reduced.locator('#motionBtn').textContent(),'움직임 쉬기');await reduced.close();
    const records=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});await records.route('https://**/*',r=>r.abort());await records.goto(pathToFileURL(path.join(__dirname,'../records.html')).href);
    await records.locator('#summary .pet').first().tap();assert(await records.locator('#todayBox').isHidden());assert.notEqual(await records.evaluate(()=>document.activeElement?.id),'todayVal');assert(await records.locator('.moving-average').count()>0);
    await records.locator('#summary .pet').first().tap();assert(await records.locator('#todayBox').isVisible());assert.equal(await records.evaluate(()=>document.activeElement.id),'todayVal');await records.close();console.log('motion preference and mobile single/double-tap passed');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
