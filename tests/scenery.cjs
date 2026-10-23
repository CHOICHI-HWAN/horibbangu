const assert=require('node:assert/strict'),path=require('node:path');
const{pathToFileURL}=require('node:url');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{for(const [width,height] of [[390,900],[1440,900],[1200,1440]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'no-preference'});
  await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
  await page.goto(pathToFileURL(path.join(process.env.HORI_SITE_DIR||path.join(__dirname,'..'),'index.html')).href);
  const result=await page.evaluate(()=>{
   let t=performance.now();lastT=t;nextGuestVisit=Infinity;setRoomControls(false);
   cats.forEach((c,i)=>{leave(c,t);c.goal=null;c.edge=null;c.air=false;c.stand=GROUND;c.y=0;c.x=50+i*30;c.mode='sit';c.until=Infinity;c.angelAfter=Infinity;});
   const group=cats.slice(0,3),first=group[0],margin=Math.max(28,32*first.scale);
   const highest=Math.max(...highSpots().filter(p=>p.h>innerHeight*.2&&p.h<innerHeight-80&&p.x1-p.x0>=margin*2&&distTo(p).has(GROUND)).map(p=>p.h));
   const accepted=group.map(c=>chooseRoomScenery(c,t));
   const targets=group.map(c=>({h:c.sceneryGoal?.h,x:c.sceneryX}));
   const cap=!chooseRoomScenery(cats[3],t),sameRail=group.every(c=>c.sceneryGoal===first.sceneryGoal);
   let steps=0;
   for(;steps<18000&&!group.every(c=>c.mode==='scenery');steps++){
    tickCats(t+=1000/60);
    // Hold the earlier arrivals while verifying every real route to the top.
    group.filter(c=>c.mode==='scenery').forEach(c=>c.until=Infinity);
   }
   const arrived=group.every(c=>c.mode==='scenery'&&!c.air&&nodeOf(c)===c.sceneryGoal&&Math.abs(c.x+CAT_W/2-c.sceneryX)<3);
   const poses=group.every(c=>getComputedStyle(c.el.querySelector('.scenery-back')).display==='inline'&&getComputedStyle(c.el.querySelector('.all')).display==='none');
   const before=group.map(c=>({x:c.x,y:c.y}));for(let i=0;i<120;i++)tickCats(t+=1000/60);
   const settled=group.every((c,i)=>Math.abs(c.x-before[i].x)<1&&Math.abs(c.y-before[i].y)<1);
   const gap=Math.min(...targets.flatMap((a,i)=>targets.slice(i+1).filter(b=>Math.abs(a.h-b.h)<1).map(b=>Math.abs(a.x-b.x))));
   updateRoomTime(new Date(2026,9,23,14));setRoomWeather('clear');
   return{accepted,cap,highest,targets,sameRail,arrived,poses,settled,gap,steps};
  });
  assert(result.accepted.every(Boolean)&&result.cap&&result.arrived&&result.poses&&result.settled,JSON.stringify(result));
  assert.equal(result.targets[0].h,result.highest);assert(result.gap>=87,JSON.stringify(result));
  if(width>=1000)assert(result.sameRail,'Wide screens should seat the group together on the upper rail');
  await page.screenshot({path:`/tmp/horibbangu-scenery-${width}x${height}.png`});
  const interaction=await page.evaluate(()=>{
   const c=cats[0];c.el.click();const t=performance.now();lastT=t;tickCats(t+16);
   const turnsBack=c.mode==='purr'&&!c.sceneryGoal&&c.sceneryX==null&&getComputedStyle(c.el.querySelector('.scenery-back')).display==='none';
   reduceMotion=true;return{turnsBack,paused:!chooseRoomScenery(c,t)};
  });
  assert(interaction.turnsBack&&interaction.paused);
  console.log(width,height,'highest reachable seats, side-by-side spacing, real travel, rear pose and motion preference passed');
  await page.close();
 }}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
