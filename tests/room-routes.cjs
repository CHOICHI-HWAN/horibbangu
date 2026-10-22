const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
  try {
    for(const width of [390,1200]) {
      const page=await browser.newPage({viewport:{width,height:844}});
      await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
      await page.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);
      const result=await page.evaluate(()=>{
        let seed=42;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
        const failures=[];let checked=0;
        for(const from of nodes.filter(n=>n.kind==='tower')) for(const goal of nodes.filter(n=>['tower','bridge'].includes(n.kind))) {
          if(from===goal)continue;checked++;lastT=0;
          cats.forEach(c=>{c.mode='sit';c.until=1e9;c.air=false;c.goal=null;c.zoom=0;c.edge=null;c.cozy=null;c.flight=null;c.restUntil=0;c.blockedRoute=null;c.angelAfter=1e9;c.foodTarget=null;c.wind=0;});
          const c=cats[0];c.x=Math.max(0,Math.min(innerWidth-CAT_W,from.xc-CAT_W/2));c.y=hOf(from,c.x+CAT_W/2);c.stand=from;
          travelTo(c,goal,0);let reached=false;
          for(let frame=1;frame<=9000;frame++) {tickCats(frame*1000/60);if(nodeOf(c)===goal&&!c.air){reached=true;break;}}
          if(!reached)failures.push({from:[from.kind,from.xc,from.h],goal:[goal.kind,goal.xc,goal.h]});
        }
        return{checked,failures};
      });
      assert.deepEqual(result.failures,[]);console.log(width,result.checked,'complete tower/perch journeys passed');await page.close();
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
