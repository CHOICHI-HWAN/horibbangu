const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  for(const width of [390,1200]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'no-preference'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
   await page.goto(pathToFileURL(path.join(process.env.HORI_SITE_DIR||path.join(__dirname,'..'),'index.html')).href);
   const result=await page.evaluate(()=>{
    inviteRoomFriends();let t=performance.now();lastT=t;
    cats.forEach(c=>{c.x=innerWidth/2-CAT_W/2;c.y=0;c.air=false;c.stand=null;c.goal=null;c.cozy=null;c.mode='sit';c.until=Infinity;});
    const c=cats[0],step=ms=>tickCats(t+=ms),x=c.x;
    groomNow(c,t);const start=t,front=c.groomFrontMs,hind=c.groomHindMs,end=c.until;
    step(1);const frontPose=c.el.classList.contains('groom-front');
    const frontVisible=getComputedStyle(c.el.querySelector('.groom-front-arm')).display!=='none'&&getComputedStyle(c.el.querySelector('.l4')).visibility==='hidden';
    step(front);const pause=c.el.classList.contains('groom-pause');
    step(1000);const hindPose=c.el.classList.contains('groom-hind');
    const hindVisible=getComputedStyle(c.el.querySelector('.groom-hind-leg')).display!=='none'&&getComputedStyle(c.el.querySelector('.l3')).visibility==='hidden'&&getComputedStyle(c.el.querySelector('.l4')).visibility!=='hidden';
    step(hind);const settle=c.el.classList.contains('groom-pause');
    step(end-t+1);const finished=c.mode==='sit'&&!c.el.classList.contains('groom');
    const stable=c.x===x&&!c.air;
    const random=Math.random;Math.random=()=>.1;const cooldown=!tryGroom(c,t);c.groomAfter=0;const selected=tryGroom(c,t);Math.random=random;
    c.air=true;const noAir=!groomNow(c,t);c.air=false;
    const count=c.el.querySelectorAll('*').length;
    for(let i=0;i<100;i++){groomNow(c,t);step(1);step(c.groomFrontMs+1001);step(c.until-t+1);}
    const noGrowth=count===c.el.querySelectorAll('*').length;
    groomNow(c,t);step(1);reduceMotion=true;step(1);const reduced=c.mode==='sleep'&&!c.el.classList.contains('groom');reduceMotion=false;
    const gallery=document.createElement('div');gallery.style.cssText='position:fixed;inset:0;z-index:1000;overflow:auto;background:#f3ebd9;display:grid;grid-template-columns:repeat(3,1fr);align-content:start;gap:12px;padding:20px';document.body.append(gallery);
    for(const name of ['호야','보리','살구','동글이','팡이','건빵'])for(const pose of ['groom-front','groom-pause','groom-hind']){
     const original=cats.find(c=>c.name===name);if(!original)continue;
     const card=document.createElement('div');card.style.cssText='text-align:center;background:#fff9ed;border-radius:18px;padding:14px';
     const clone=original.el.cloneNode(true);clone.className='cat '+original.lookCls+' groom '+pose;clone.style.cssText=original.el.style.cssText+';position:relative;left:0;bottom:auto;transform:none;width:192px;height:132px;margin:auto';
     clone.querySelector('.flip').style.cssText='transform:none;width:192px;height:132px';clone.querySelector('svg').style.cssText='width:192px;height:132px;overflow:visible';clone.querySelectorAll('.bubble,.note').forEach(e=>e.remove());
     card.append(clone,document.createTextNode(name+' · '+pose.replace('groom-','')));gallery.append(card);
     clone.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=380;});
    }
    return {frontPose,frontVisible,pause,hindPose,hindVisible,settle,finished,stable,cooldown,selected,noAir,noGrowth,reduced};
   });
   for(const [key,value]of Object.entries(result))assert(value,key+' '+JSON.stringify(result));
   assert.deepEqual(errors,[]);
   if(width===1200){await page.setViewportSize({width:1200,height:1200});await page.screenshot({path:path.join(__dirname,'../build/grooming-gallery.png')});}
   console.log('Seated front/hind grooming, pauses, supported position, cooldown, reduced motion and 100-cycle DOM stability passed:',width);await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
