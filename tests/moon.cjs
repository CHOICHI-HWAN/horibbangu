const assert=require('node:assert/strict'),path=require('node:path');
const{pathToFileURL}=require('node:url');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});try{
const p=await b.newPage({viewport:{width:1440,height:960}});await p.addInitScript(()=>window.requestAnimationFrame=()=>0);await p.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);
const phases=await p.evaluate(()=>[0,.25,.5,.75,1].map(f=>{
 const date=new Date(Date.UTC(2000,0,6,18,14)+f*29.530588*86400000);updateRoomTime(date);
 const moon=roomMoonPhase(date),coords=$('clockMoonLight').getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number),pts=[];for(let i=0;i<coords.length;i+=2)pts.push([coords[i],coords[i+1]]);
 const area=Math.abs(pts.reduce((a,p,i)=>{const n=pts[(i+1)%pts.length];return a+p[0]*n[1]-n[0]*p[1];},0)/2);
 return{light:moon.light,name:moon.name,min:Math.min(...pts.map(p=>p[0])),max:Math.max(...pts.map(p=>p[0])),area,label:$('clockMoon').getAttribute('aria-label'),hands:$('clockMinute').getAttribute('transform')};
}));
assert(phases[0].area<.01&&phases[4].area<.01);assert(phases[1].min>=59.99&&phases[1].max===69);assert(phases[3].max<=60.01&&phases[3].min===51);assert(phases[2].area>250);assert(phases[2].light>.999);assert(phases[1].area>120&&phases[1].area<130);assert(phases.every(p=>p.label.includes(p.name)&&p.hands));
await p.evaluate(()=>{updateRoomTime(new Date());document.querySelector('.cat-wall-clock').style.width='240px';});await p.locator('.cat-wall-clock').screenshot({path:'/tmp/horibbangu-moon-clock.png'});console.log('New, waxing quarter, full, waning quarter and rollover moon shapes verified; clock hands stay active.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
