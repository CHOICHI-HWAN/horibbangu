const assert=require('node:assert/strict'),path=require('node:path');
const{pathToFileURL}=require('node:url');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});try{
for(const width of [390,1440]){const p=await b.newPage({viewport:{width,height:900},reducedMotion:'no-preference'});await p.addInitScript(()=>window.requestAnimationFrame=()=>0);await p.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);
const r=await p.evaluate(()=>{lastLakeFrame=-Infinity;drawLake(1000);const cv=$('lakeCanvas'),ctx=cv.getContext('2d'),a=ctx.getImageData(0,0,cv.width,cv.height).data;drawLake(4000);const z=ctx.getImageData(0,0,cv.width,cv.height).data;let changed=0;for(let i=0;i<a.length;i+=4)if(a[i]!==z[i])changed++;const topClear=ctx.getImageData(0,0,cv.width,Math.floor(cv.height/2)).data.every(v=>v===0);reduceMotion=true;applyMotionChoice();drawLake(5000);const paused=ctx.getImageData(0,0,cv.width,cv.height).data.every(v=>v===0);return{changed,topClear,paused,noSun:!$('sun'),animation:getComputedStyle(document.querySelector('.landscape-motion')).animationName};});assert(r.changed>100);assert(r.topClear&&r.paused&&r.noSun);assert.equal(r.animation,'none');console.log(width,'moving lake, steady mountain, no sun and paused-motion checks passed');await p.close();}
// Verify the real frame loop, rather than only calling drawLake manually.
const live=await b.newPage({viewport:{width:1200,height:844},reducedMotion:'no-preference'});
await live.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);
await live.waitForFunction(()=>lastLakeFrame>0);
const snap=()=>live.evaluate(()=>({t:lastLakeFrame,pixels:Array.from($('lakeCanvas').getContext('2d').getImageData(0,0,$('lakeCanvas').width,$('lakeCanvas').height).data)}));
const a=await snap();await live.waitForTimeout(700);const z=await snap();
assert(z.t>a.t+300);let distance=0,count=0;for(let i=0;i<a.pixels.length;i+=4){if(a.pixels[i+3]){distance+=Math.abs(a.pixels[i]-z.pixels[i]);count++;}}
assert(distance/count>2,'Visible water must move by more than imperceptible pixel noise');
await live.screenshot({path:'/tmp/horibbangu-visible-lake.png'});await live.close();console.log('Real animation loop advances; visible water change verified.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
