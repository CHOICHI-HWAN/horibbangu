const assert=require('node:assert/strict'),path=require('node:path');
const{pathToFileURL}=require('node:url');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1050,height:650}});
  await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
  await page.goto(pathToFileURL(path.join(process.env.HORI_SITE_DIR||path.join(__dirname,'..'),'index.html')).href);
  const result=await page.evaluate(()=>{
   inviteRoomFriends();
   const gallery=document.createElement('div');
   gallery.style.cssText='position:fixed;inset:0;z-index:1000;background:#f3ebd9;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:18px';
   document.body.append(gallery);
   const failures=[];let checks=0;
   for(const cat of cats){
    for(const pose of ['', 'watch','kiss']){
     const clone=cat.el.cloneNode(true);clone.className='cat '+cat.lookCls+' '+pose;
     clone.style.cssText=cat.el.style.cssText+';position:relative;left:0;bottom:auto;transform:none;width:256px;height:176px;--blink-delay:-8.3s';
     clone.querySelector('.flip').style.transform='none';clone.querySelector('svg').style.cssText='width:256px;height:176px;overflow:visible';
     clone.querySelectorAll('.bubble,.note').forEach(e=>e.remove());gallery.append(clone);
     const eyes=clone.querySelector('.eyes');
     // Use a fixed phase for the looping blink; kisses must reset the delay themselves.
     if(pose!=='kiss')clone.style.setProperty('--blink-delay','0s');
     const animation=eyes.getAnimations()[0];
     if(!animation){failures.push(cat.name+' '+pose+' missing eye animation');clone.remove();continue;}
     clone.getAnimations({subtree:true}).forEach(a=>a.pause());
     if(pose==='kiss'&&getComputedStyle(eyes).animationDelay!=='0s')failures.push(cat.name+' delayed kiss');
     const duration=Number(animation.effect.getTiming().duration);
     for(const phase of [0,pose==='kiss'?.5:.45,1]){
      animation.currentTime=phase===1?duration-.1:duration*phase;
      const lid=clone.querySelector('.blink-lid'),lidAnimation=lid.getAnimations()[0];lidAnimation.currentTime=animation.currentTime;
      if(phase===(pose==='kiss'?.5:.45)&&Number(getComputedStyle(lid).opacity)<.99)failures.push(cat.name+' missing closed eyelid');
      const center=new DOMPoint(46.75,21.2),actual=center.matrixTransform(eyes.getCTM()),fixed=center.matrixTransform(eyes.parentElement.getCTM());
      if(Math.hypot(actual.x-fixed.x,actual.y-fixed.y)>.05)failures.push(cat.name+' '+pose+' eye drift at '+phase);
      checks++;
     }
     clone.remove();
    }
   }
   // A visual contact sheet includes the actual open/closing/closed eye animation.
   for(const phase of [0,.44,.45]){
    const cat=cats.find(c=>c.name==='팡이'),clone=cat.el.cloneNode(true);
    clone.className='cat '+cat.lookCls;clone.style.cssText=cat.el.style.cssText+';position:relative;left:0;bottom:auto;transform:none;width:256px;height:176px;--blink-delay:0s';
    clone.querySelector('.flip').style.transform='none';clone.querySelector('svg').style.cssText='width:256px;height:176px;overflow:visible';clone.querySelectorAll('.bubble,.note').forEach(e=>e.remove());gallery.append(clone);
    clone.getAnimations({subtree:true}).forEach(a=>a.pause());const a=clone.querySelector('.eyes').getAnimations()[0];a.currentTime=7000*phase;clone.querySelector('.blink-lid').getAnimations()[0].currentTime=a.currentTime;
   }
   for(const pose of ['', 'airplane-ears ear-left','airplane-ears ear-right']){
    const cat=cats.find(c=>c.name==='건빵'),clone=cat.el.cloneNode(true);clone.className='cat '+cat.lookCls+' '+pose;clone.style.cssText=cat.el.style.cssText+';position:relative;left:0;bottom:auto;transform:none;width:256px;height:176px';clone.querySelector('.flip').style.transform='none';clone.querySelector('svg').style.cssText='width:256px;height:176px;overflow:visible';clone.querySelectorAll('.bubble,.note').forEach(e=>e.remove());gallery.append(clone);clone.getAnimations({subtree:true}).forEach(a=>a.pause());clone.querySelectorAll('.ear-unit').forEach(e=>e.style.transition='none');
   }
   return{checks,failures};
  });
  assert.equal(result.checks,99);assert.deepEqual(result.failures,[]);
  await page.screenshot({path:'/tmp/horibbangu-expressions.png'});
  console.log('11 cats: blink center stays fixed through open/closed/reopened phases; kisses start without inherited delay.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
