const assert=require('node:assert/strict'),path=require('node:path');
const{pathToFileURL}=require('node:url');const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});try{for(const width of [390,1440]){
const p=await b.newPage({viewport:{width,height:900},reducedMotion:'no-preference'});await p.addInitScript(()=>window.requestAnimationFrame=()=>0);await p.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);await p.keyboard.press('Tab');await p.locator('#viewBtn').click();
const result=await p.evaluate(()=>{
 const invited=cats.filter(c=>c.sceneryGoal).length;setRoomControls(false);
 cats.forEach(c=>{leave(c,performance.now());c.goal=null;c.edge=null;c.air=false;c.stand=null;c.y=0;c.x=50;c.mode='sit';c.until=Infinity;c.angelAfter=Infinity;});
 let t=performance.now();lastT=t;const c=cats[0],accepted=chooseRoomScenery(c,t);let steps=0;for(;steps<24000&&c.mode!=='scenery';steps++)tickCats(t+=1000/60);
 const arrived=c.mode==='scenery'&&!c.air&&nodeOf(c)===c.sceneryGoal;
 const rear=getComputedStyle(c.el.querySelector('.scenery-back')).display,front=getComputedStyle(c.el.querySelector('.all')).display;
 const x=c.x,y=c.y;for(let i=0;i<120;i++)tickCats(t+=1000/60);const settled=Math.abs(c.x-x)<1&&Math.abs(c.y-y)<1;
 c.el.click();t=performance.now();lastT=t;tickCats(t+16);const turnsBack=c.mode==='purr'&&getComputedStyle(c.el.querySelector('.scenery-back')).display==='none'&&!c.sceneryGoal;
 // The system motion setting must prevent a fresh walk to the window.
 reduceMotion=true;const paused=!chooseRoomScenery(c,t);reduceMotion=false;
 updateRoomTime(new Date(2026,9,23,14));setRoomWeather('clear');
 // Arrange an illustrative snapshot on reachable scenery ledges.
 cats.forEach(o=>o.sceneryGoal=null);for(const o of cats.slice(0,3)){if(chooseRoomScenery(o,t)){const spot=o.sceneryGoal;o.stand=spot;o.x=spot.xc-CAT_W/2;o.y=hOf(spot,spot.xc);o.air=false;o.mode='scenery';o.until=t+30000;}}tickCats(t+32);
 return{invited,accepted,arrived,rear,front,settled,turnsBack,paused,steps};
});assert.equal(result.invited,3);assert(result.accepted&&result.arrived&&result.settled&&result.turnsBack&&result.paused,JSON.stringify(result));assert.equal(result.rear,'inline');assert.equal(result.front,'none');await p.screenshot({path:`/tmp/horibbangu-scenery-${width}.png`});console.log(width,'walk to viewing perch, rear pose, pet-to-turn and paused motion passed');await p.close();
}}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
