const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  for(const [width,height,dpr] of [[390,844,2],[1920,1080,1],[3840,2160,1],[3840,2160,2],[5120,1440,1]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'no-preference'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
   await page.goto(pathToFileURL(path.join(process.env.HORI_SITE_DIR||path.join(__dirname,'..'),'index.html')).href);
   await page.locator('#landscape').evaluate(img=>img.decode());
   for(const weather of ['rain','snow','hail']){
    const result=await page.evaluate(weather=>{
     setRoomWeather(weather);lastWeatherFrame=-Infinity;drawWeather(10000);
     const canvas=$('weatherCanvas'),ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
     const cells=Array(6).fill(0);
     for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>40)cells[Math.min(1,Math.floor(y/canvas.height*2))*3+Math.min(2,Math.floor(x/canvas.width*3))]++;
     const first=new Uint8ClampedArray(pixels);lastWeatherFrame=-Infinity;drawWeather(11000);
     const second=ctx.getImageData(0,0,canvas.width,canvas.height).data;
     let changed=0;for(let i=3;i<second.length;i+=4)if(first[i]!==second[i])changed++;
     return{cells,changed,backing:canvas.width*canvas.height,css:canvas.clientWidth*canvas.clientHeight};
    },weather);
    assert(result.cells.every(n=>n>8),`${width}x${height} ${weather}: precipitation missing from a scene region: ${result.cells}`);
    assert(result.changed>30,`${weather} must animate`);
    assert(result.backing<=8500000,'high-DPI canvas exceeds pixel budget');
    if(width===3840)assert(result.cells.reduce((a,b)=>a+b)/result.backing>.001,'large-screen density too low');
   }
   await page.setViewportSize({width:1200,height:800});
   const resized=await page.evaluate(()=>{lastWeatherFrame=-Infinity;drawWeather(12000);const c=$('weatherCanvas');return{w:c.width,css:c.clientWidth};});
   assert(Math.abs(resized.w-resized.css*dpr)<=1,'resize must update backing size');
   const clear=await page.evaluate(()=>{setRoomWeather('clear');lastWeatherFrame=-Infinity;drawWeather(13000);return $('weatherCanvas').getContext('2d').getImageData(0,0,$('weatherCanvas').width,$('weatherCanvas').height).data.some((v,i)=>i%4===3&&v);});
   assert(!clear,'clear weather must erase particles');assert.deepEqual(errors,[]);
   console.log(`weather ${width}x${height} @${dpr}: rain/snow/hail cover all six regions, animate, resize and clear`);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
