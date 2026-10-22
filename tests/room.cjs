const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const roomURL = pathToFileURL(path.join(__dirname, '../index.html')).href;
(async () => {
  const browser = await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
  try {
    for (const [width,height] of [[320,568],[390,844],[844,390],[560,700],[768,1024],[1200,844],[1920,1080]]) {
      const page=await browser.newPage({viewport:{width,height},reducedMotion:'no-preference'});
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
        art:document.querySelectorAll('.painting').length,clock:!!document.getElementById('clockHour'),guests:document.querySelectorAll('#visitors .guest-eyes').length,blink:getComputedStyle(cats[0].el.querySelector('.eyes')).animationName
      }));
      assert.equal(result.cats,8);assert(result.noData&&result.noAuth&&result.routes&&!result.overflow);assert.equal(result.link,'records.html');assert.equal(result.art,4);assert(result.clock&&result.guests===3);assert.notEqual(result.blink,'none');assert(result.wheelFrame);assert.equal(result.furniture.filter(k=>k==='house-top').length,2);assert(result.furniture.includes('tunnel'));
      assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
      console.log('room',width,height,'routes and public view passed');await page.close();
    }
    const page=await browser.newPage({viewport:{width:1200,height:844},reducedMotion:'no-preference'});
    await page.addInitScript(()=>window.requestAnimationFrame=()=>0);await page.goto(roomURL);
    const scenes=await page.evaluate(()=>{
      updateRoomTime(new Date(2026,9,22,8,0));const morning={x:$('sun').style.left,night:getComputedStyle(document.documentElement).getPropertyValue('--night')};
      updateRoomTime(new Date(2026,9,22,16,0));const afternoon=$('sun').style.left;const clock=$('clockHour').getAttribute('transform');
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
      // Verify a complete visit, then boarding/return without leaving hidden cats behind.
      cats.forEach(c=>{c.mode='sit';c.air=false;c.until=1e9;c.cozy=null;c.x=innerWidth/2;c.y=0;c.stand=null;});
      nextBusAt=Infinity;const visitStart=nextVisitAt;tickRoomEvents(visitStart-1);const early=eventState===null;
      tickRoomEvents(visitStart);const visit=eventState?.kind;
      tickRoomEvents(visitStart+3000);const entryX=parseFloat($('visitors').style.left);
      tickRoomEvents(visitStart+9000);const drops=document.querySelectorAll('.trail-acorn').length;
      const forward=parseFloat($('visitors').style.left)>entryX,profile=!!document.querySelector('#visitors .profile-eye');
      const walking=eventState.walkDuration;tickRoomEvents(visitStart+(walking+1.8)*1000);
      const jump=$('visitors').classList.contains('leaping')&&$('visitors').style.transform.includes('translateY(-');
      const noFeeding=!$('bowls')&&cats.every(c=>c.mode!=='eat');
      tickRoomEvents(visitStart+33000);const visitEnded=eventState===null&&!$('orangeDoor').classList.contains('open');
      const now=visitStart+34000;beginBus(now);tickRoomEvents(now+7000);const boarded=cats.filter(c=>c.mode==='busRide').length;tickRoomEvents(now+27000);const returned=cats.every(c=>c.mode!=='busRide'&&!c.el.classList.contains('bus-passenger'));tickRoomEvents(now+38000);
      const c=cats[0];c.mode='watch';c.until=t+5000;c.el.click();const kiss=c.mode==='kiss';
      return{morning,afternoon,clock,night,weather,shared,early,visit,drops,forward,profile,jump,noFeeding,visitEnded,boarded,returned,kiss};
    });
    assert.notEqual(scenes.morning.x,scenes.afternoon);assert.equal(scenes.clock,'rotate(120 60 78)');assert(scenes.night.moon&&+scenes.night.shade===1);assert.deepEqual(scenes.weather,['clear','rain','snow','hail']);assert(scenes.early&&scenes.visit==='stroll'&&scenes.drops>0&&scenes.forward&&scenes.profile&&scenes.jump&&scenes.noFeeding&&scenes.visitEnded);assert(scenes.boarded>0&&scenes.returned&&scenes.kiss);assert.equal(scenes.shared[0].kind,'house-top');assert.equal(scenes.shared[1].kind,'house-top');assert.notEqual(scenes.shared[0].x,scenes.shared[1].x);assert.equal(scenes.shared[2].kind,'house-low');
    // Pointer-driven dragging must show the bubble and release the cat back to physics.
    await page.evaluate(()=>{const c=cats[0];c.x=140;c.y=20;c.air=false;c.mode='sit';c.until=1e9;renderCatPosition(c);});
    const box=await page.locator('.cat').first().boundingBox();await page.mouse.move(box.x+32,box.y+20);await page.mouse.down();await page.mouse.move(box.x+230,box.y-180,{steps:8});
    assert(await page.locator('.cat').first().evaluate(el=>el.classList.contains('in-bubble')));await page.mouse.up();
    assert(await page.evaluate(()=>cats[0].air&&cats[0].mode!=='bubble'));
    await page.locator('#guestsBtn').click();assert.equal(await page.evaluate(()=>eventState?.kind),'stroll');assert(await page.locator('#busBtn').isDisabled());
    await page.evaluate(()=>{tickRoomEvents(eventState.start+33000);});
    await page.locator('#busBtn').click();assert.equal(await page.evaluate(()=>eventState?.kind),'bus');
    console.log('clock, weather, guest buttons, acorn stroll, bus, co-sleeping targets, eye kiss, bubble drag passed');await page.close();
    // Honor system motion preference initially; an explicit user choice enables play and persists.
    const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(roomURL);assert.equal(await reduced.locator('#motionBtn').textContent(),'움직임 켜기');await reduced.locator('#motionBtn').click();assert.equal(await reduced.locator('#motionBtn').textContent(),'움직임 쉬기');await reduced.reload();assert.equal(await reduced.locator('#motionBtn').textContent(),'움직임 쉬기');await reduced.close();
    const records=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});await records.route('https://**/*',r=>r.abort());await records.goto(pathToFileURL(path.join(__dirname,'../records.html')).href);
    await records.locator('#summary .pet').first().tap();assert(await records.locator('#todayBox').isHidden());assert.notEqual(await records.evaluate(()=>document.activeElement?.id),'todayVal');assert(await records.locator('.moving-average').count()>0);
    await records.locator('#summary .pet').first().tap();assert(await records.locator('#todayBox').isVisible());assert.equal(await records.evaluate(()=>document.activeElement.id),'todayVal');await records.close();console.log('motion preference and mobile single/double-tap passed');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
