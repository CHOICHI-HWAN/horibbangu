const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
  try {
    for (const width of [390, 1200]) {
      const page = await browser.newPage({viewport:{width,height:844},reducedMotion:'no-preference'});
      const errors = [];
      page.on('pageerror',e => errors.push(e.message));
      await page.addInitScript(() => window.requestAnimationFrame = () => 0);
      await page.goto(pathToFileURL(path.join(process.env.HORI_SITE_DIR || path.join(__dirname,'..'),'index.html')).href);
      const result = await page.evaluate(() => {
        let t = performance.now(); lastT = t;
        cats.forEach(c => { c.mode='sit';c.until=Infinity;c.air=false;c.x=innerWidth/2-CAT_W/2;c.y=0;c.stand=null;c.goal=null;c.cozy=null;c.restUntil=0; });
        const c=cats[0], step=ms => tickCats(t+=ms);
        const wake = ['sleep','chin','house-low','house-top','hammock','sofa','bed'].map(mode => {
          c.x=innerWidth/2-CAT_W/2;c.y=0;c.air=false;c.stand=null;c.cozy=null;c.goal=null;c.edge=null;
          setMode(c,mode,t,0); step(1);
          const yawn=c.mode==='yawn' && c.el.classList.contains('yawn');
          const x=c.x,y=c.y;
          step(3201);
          const stretch=c.mode==='stretch' && c.el.classList.contains('stretch');
          const stable=c.x===x&&Math.abs(c.y-y)<=14; // Existing support settling remains active.
          step(3601);
          return {mode,yawn,stretch,finished:!['yawn','stretch'].includes(c.mode),stable};
        });
        const random=Math.random;Math.random=()=>.05;
        c.gestureAfter=0;pickIdle(c,t);const idleYawn=c.mode==='yawn';
        const cooldown=!idleGesture(c,t+10);
        c.gestureAfter=0;c.stand=nodes.find(n=>n.kind==='tower');pickPerch(c,t);const perchYawn=c.mode==='yawn';
        c.gestureAfter=0;c.air=true;const noAirGesture=!idleGesture(c,t);c.air=false;c.stand=null;
        Math.random=()=>.18;c.gestureAfter=0;const idleStretch=idleGesture(c,t)&&c.mode==='stretch';Math.random=random;
        setMode(c,'sleep',t,0);c.restUntil=t+10000;step(1);const rest=['sleep','chin'].includes(c.mode);c.restUntil=0;
        yawnNow(c,t);step(1);
        const mouth=c.el.querySelector('.yawn-mouth');
        const mouthAnimation=mouth.getAnimations()[0];mouthAnimation.pause();mouthAnimation.currentTime=1600;
        const open=+getComputedStyle(mouth).transform.split(',')[3];
        mouthAnimation.currentTime=0;const closed=+getComputedStyle(mouth).transform.split(',')[3];
        const face=getComputedStyle(c.el.querySelector('.eyes')).visibility==='hidden'&&getComputedStyle(c.el.querySelector('.eyec')).display!=='none';
        reduceMotion=true;step(1);const paused=c.mode==='sleep'&&!c.el.classList.contains('yawn')&&!c.el.classList.contains('stretch');
        return {wake,idleYawn,cooldown,perchYawn,noAirGesture,idleStretch,rest,open,closed,face,paused};
      });
      assert(result.wake.every(r=>r.yawn&&r.stretch&&r.finished&&r.stable),JSON.stringify(result));
      for(const key of ['idleYawn','cooldown','perchYawn','noAirGesture','idleStretch','rest','face','paused']) assert(result[key],key);
      assert(result.open>.9&&result.closed<.1,JSON.stringify(result));
      assert.deepEqual(errors,[]);
      console.log('yawn and stretch',width,'passed');await page.close();
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
