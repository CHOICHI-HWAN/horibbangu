const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const b=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  for(const width of [390,1440]){
   const p=await b.newPage({viewport:{width,height:900},reducedMotion:'no-preference'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(()=>window.requestAnimationFrame=()=>0);await p.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);
   const visit=await p.evaluate(()=>{
    const resident=cats[0],el=resident.el;resident.mode='pawWrap';resident.until=1e10;
    nextGuestVisit=0;let t=performance.now();tickRoomGuests(t,.1);
    const initial={same:cats[0]===resident&&resident.el===el&&resident.mode==='pawWrap',names:cats.filter(c=>c.guest).map(c=>c.name),count:cats.length,recordPets:state.pets.length};
    const guests=cats.filter(c=>c.guest);const blue=guests.find(c=>c.name==='소양'),orange=guests.find(c=>c.name==='소미'),pink=guests.find(c=>c.name==='팡이');
    initial.looks=blue.lookCls.includes('soyang')&&orange.lookCls.includes('tabby')&&pink.lookCls.includes('pang');
    initial.skin=getComputedStyle(pink.el.querySelector('.skin-folds')).display;
    initial.noSkin=getComputedStyle(resident.el.querySelector('.skin-folds')).display;
    // A harmless rerender preserves held guests as well as resident animations.
    blue.mode='bubble';const held=blue.el;renderCats();initial.drag=cats.includes(blue)&&blue.el===held&&blue.mode==='bubble';blue.mode='watch';
    // Expiring a visit on a high perch must route down before walking out.
    const high=highSpots().at(-1);orange.stand=high;orange.y=hOf(high,high.xc);orange.x=high.xc-CAT_W/2;orange.air=false;
    guestVisitEnds=guestElapsed;nextGuestVisit=Infinity;tickRoomGuests(t,.1);initial.route=orange.goal===GROUND;
    lastT=t;
    for(let i=0;i<12000&&activeRoomGuests.length;i++)tickCats(t+=1000/60);
    const departure={left:activeRoomGuests.length===0,count:cats.length,connected:resident.el.isConnected,next:nextGuestVisit>guestElapsed};
    // Hidden motion does not advance the visitor clock.
    const before=guestElapsed;reduceMotion=true;tickRoomGuests(t,100);const paused=guestElapsed===before;reduceMotion=false;
    inviteRoomFriends(t);inviteRoomFriends(t);const repeat=cats.filter(c=>c.guest).length;
    updateRoomTime(new Date(2026,9,23,14));setRoomWeather('clear');
    cats.filter(c=>c.guest).forEach((c,i)=>{c.x=innerWidth/2-110+i*85;c.y=100;c.air=false;c.stand=null;setMode(c,'watch',t,1e9);});tickCats(t+16);
    return{initial,departure,paused,repeat};
   });
   assert(visit.initial.same&&visit.initial.drag&&visit.initial.route&&visit.initial.looks);assert.deepEqual(visit.initial.names,['소양','소미','팡이']);assert.equal(visit.initial.recordPets,7);assert.equal(visit.initial.skin,'inline');assert.equal(visit.initial.noSkin,'none');
   assert(visit.departure.left&&visit.departure.connected&&visit.departure.next,JSON.stringify(visit));assert.equal(visit.departure.count,8);assert(visit.paused);assert.equal(visit.repeat,3);assert.deepEqual(errors,[]);
   if(process.env.GUEST_SCREENSHOT)await p.screenshot({path:process.env.GUEST_SCREENSHOT.replace('.png',`-${width}.png`)});
   console.log(width,'guest arrivals, markings, state retention, high-perch departure and revisit passed');await p.close();
  }
  const p=await b.newPage();await p.route('https://**',r=>r.abort());await p.goto(pathToFileURL(path.join(__dirname,'../records.html')).href);assert.equal(await p.evaluate(()=>cats.some(c=>c.guest)),false);assert.equal(await p.evaluate(()=>state.pets.some(p=>['소양','소미','팡이'].includes(p.name))),false);await p.close();
  console.log('Guest cats never enter weight records.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
