// Published defaults contain size ratios only, never kilogram values.
let roomSizes = Object.assign({}, /*ROOM_SIZES*/);
try { Object.assign(roomSizes,JSON.parse(localStorage.getItem('horibbangu-cat-sizes-v1')||'{}')); } catch(e) {}
addEventListener('storage',e=>{if(e.key==='horibbangu-cat-sizes-v1'){try {Object.assign(roomSizes,JSON.parse(e.newValue||'{}'));renderCats();}catch(err){}}});
// Room-only scenery and events. Time is the device's local clock; weather is fictional.
let housePlatforms = [], tunnelPlatform = null, tunnelX=0, roomWeather = 'clear', weatherChoice = 'auto';
let lastRoomDate='',weatherFrame=0;
// Guests are visual companions only; they never enter the records or size cache.
const visitingFriends = [
  {id:'guest-soyang',name:'소양',color:'#83949d',guest:true},
  {id:'guest-somi',name:'소미',color:'#d7a36a',guest:true},
  {id:'guest-pang',name:'팡이',color:'#d6a399',guest:true}
];
let activeRoomGuests=[], guestElapsed=0, nextGuestVisit=45+Math.random()*45, guestVisitEnds=Infinity;
const friendLooks = {
 '팡이':{body:'#d4a69b',stripe:'none',leg:'#d4a69b',head:'#d6a89d',muzzle:'#c9978d',ear:'#d5a094',tail:'#c99a90',nose:'#aa7875',eye:'#a9b5a8',belly:'none',blaze:'none',cap:'none',patch:'none',cls:'pang guest-cat',scale:.94},
 '소양':{body:'#84929c',stripe:'none',leg:'#84929c',head:'#8b9aa3',muzzle:'#8a98a0',ear:'#7b8b95',tail:'#7c8b95',nose:'#454f56',eye:'#b2cc88',belly:'none',blaze:'none',cap:'none',patch:'none',cls:'soyang guest-cat',scale:.97},
 '소미':{body:'#d8a469',stripe:'#b68046',leg:'#f9f3e7',head:'#d8a469',muzzle:'#fff9ed',ear:'#cb975d',tail:'#d2a06a',nose:'#d99a95',eye:'#b3b584',belly:'#fff9ed',blaze:'#fff9ed',cap:'none',patch:'none',cls:'tabby somi guest-cat',scale:1.04}
};
function roomGuestPets(){ return visitingFriends.filter(p=>activeRoomGuests.includes(p.id)); }
function inviteRoomFriends(t=performance.now()){
  if(activeRoomGuests.length) return;
  activeRoomGuests=visitingFriends.map(p=>p.id);renderCats();
  guestVisitEnds=guestElapsed+120+Math.random()*60;
  cats.filter(c=>c.guest).forEach((c,i)=>{
    c.x=i*34;c.y=0;c.air=false;c.stand=null;c.dir=1;c.speed=30;
    setMode(c,'walk',t,3500+i*800);renderCatPosition(c);
    say(c,c.name+' · 놀러 왔어요 ♡',2600);
  });
}
function tickRoomGuests(t,dt){
  if(reduceMotion) return;
  guestElapsed+=dt;
  if(!activeRoomGuests.length){if(guestElapsed>=nextGuestVisit)inviteRoomFriends(t);return;}
  if(guestElapsed<guestVisitEnds)return;
  const finished=[];
  for(const c of cats.filter(c=>c.guest)){
    // Let a held cat land before saying goodbye; never interrupt a drag or jump.
    if(c.air||c.mode==='bubble')continue;
    if(nodeOf(c)===GROUND){
      if(c.mode==='guestExit'&&c.x>=Math.max(0,innerWidth-CAT_W)-2){finished.push(c.id);continue;}
      if(c.mode!=='guestExit'){leave(c,t);c.goal=null;c.edge=null;c.zoom=0;setMode(c,'guestExit',t,Infinity);say(c,'또 놀러 올게요 ♡',1800);}
      c.dir=1;c.speed=32;
    }else if(c.goal!==GROUND||c.mode!=='travel'){
      leave(c,t);c.zoom=0;travelTo(c,GROUND,t);
    }
  }
  if(finished.length){
    activeRoomGuests=activeRoomGuests.filter(id=>!finished.includes(id));renderCats();
    if(!activeRoomGuests.length)nextGuestVisit=guestElapsed+300+Math.random()*180;
  }
}
function furnitureElement(className, left, bottom, width, height, svg) {
  const el=document.createElement('div');el.className='room-furniture '+className;
  el.style.cssText=`left:${left}px;bottom:${bottom}px;width:${width}px;height:${height}px`;
  el.innerHTML=`<svg viewBox="0 0 ${width} ${height}" aria-hidden="true">${svg}</svg>`;
  $('props').append(el);return el;
}
function roomFurniture(W,H,y) {
  housePlatforms=[];
  const width=W<650?150:184, houseX=Math.max(18,Math.min(W-width-24,W*.73-width/2));
  const roof=150, low=33, high=103;
  const lower={x0:houseX+18,x1:houseX+width-18,h:low,xc:houseX+width/2,kind:'bridge',type:'house',node:true};
  const upper={...lower,h:high};housePlatforms=[lower,upper];platforms.push(lower,upper);
  furnitureElement('house',houseX,0,width,180,`<path d="M5 44 ${width/2} 2 ${width-5} 44V175H5Z" fill="#e5d1b2" stroke="#b8a082" stroke-width="2"/><path d="M0 46 ${width/2} 0 ${width} 46" fill="none" stroke="#b28e6b" stroke-width="7" stroke-linecap="round"/><path d="M17 174v-42q0-26 27-26h${width-88}q27 0 27 26v42Z" fill="#b9a58b"/><path d="M17 101V65q0-18 20-18h${width-74}q20 0 20 18v36Z" fill="#a99076"/><rect x="12" y="75" width="${width-24}" height="7" rx="3" fill="#d8b78f"/><rect x="12" y="145" width="${width-24}" height="7" rx="3" fill="#e9c9a2"/><path d="M22 76q${width/2-22}-12 ${width-44} 0" stroke="#e9c9be" stroke-width="8" fill="none"/><path d="M24 146q${width/2-24}-12 ${width-48} 0" stroke="#b2c4b5" stroke-width="8" fill="none"/><text x="${width/2}" y="36" text-anchor="middle" font-size="9" fill="#8d7258">보리 &amp; 건빵</text><text x="${width/2}" y="173" text-anchor="middle" font-size="9" fill="#8d7258">호야의 방</text>`);
  // A donut tunnel with a front entrance and a separate central peek hole.
  const tx=Math.max(20,Math.min(W-184,W*.40-84));
  tunnelPlatform=GROUND;tunnelX=tx+82;
  furnitureElement('tunnel-prop',tx,0,168,67,`<ellipse cx="84" cy="35" rx="80" ry="28" fill="#c1aa8b"/><ellipse cx="84" cy="27" rx="77" ry="24" fill="#e6d4b3" stroke="#b9a486"/><ellipse cx="84" cy="26" rx="37" ry="11" fill="#af9879" stroke="#c4ad8d" stroke-width="5"/><ellipse cx="37" cy="40" rx="24" ry="22" fill="#9c8267" stroke="#d2bd98" stroke-width="8"/><path d="M128 12q22 20 8 39M143 19q15 12 4 28M10 26q-10 12 1 22" stroke="#c3ad8c" stroke-width="2" fill="none"/>`);
  furnitureElement('tunnel-front tunnel-prop',tx,0,168,67,`<path d="M9 44Q10 66 40 65Q66 63 65 43" fill="none" stroke="#d6c19d" stroke-width="9"/><ellipse cx="96" cy="17" rx="22" ry="12" fill="#8f795e" stroke="#d5c19d" stroke-width="5"/><path d="M73 20q23 22 47 0" fill="none" stroke="#e9d6b3" stroke-width="5"/>`);
  // A rigid arch sits around the spinning wheel; the top is a usable resting ledge.
  if(wheel){const wx=wheel.xc;const frame={x0:wx-68,x1:wx+68,h:139,xc:wx,kind:'bridge',type:'wheel-frame',node:true};platforms.push(frame);
    furnitureElement('wheel-frame',wx-75,0,150,148,`<path d="M8 147V17Q8 8 18 8H132Q142 8 142 17V147" fill="none" stroke="#ae9170" stroke-width="7"/><rect x="0" y="4" width="150" height="8" rx="4" fill="#d2b99a"/><rect x="35" y="0" width="80" height="5" rx="3" fill="#c5d1c1"/><path d="M8 115 26 97M142 115 124 97" stroke="#ae9170" stroke-width="3"/>`);
  }
}
function roomCozySpots(){
  if(housePlatforms.length){const[low,high]=housePlatforms;
    cozySpots.push({kind:'house-low',platform:low,xc:low.xc,h:low.h});
    cozySpots.push({kind:'house-top',platform:high,xc:high.xc-29,h:high.h},{kind:'house-top',platform:high,xc:high.xc+29,h:high.h});
  }
  if(tunnelPlatform)cozySpots.push({kind:'tunnel',platform:tunnelPlatform,xc:tunnelX,h:0});
}
function inviteHouseBuddy(c,t) {
  if (!['보리','건빵'].includes(c.name)) return;
  const buddy=cats.find(o=>o.name===(c.name==='보리'?'건빵':'보리'));
  if (!buddy||buddy.air||['bubble','angel'].includes(buddy.mode)) return;
  const spot=cozySpots.find(p=>p.kind==='house-top'&&p!==c.cozy&&!cats.some(o=>o!==buddy&&o.cozy===p));
  if (!spot) return;
  buddy.cozy=spot;buddy.favorite='house-top';buddy.tx=spot.xc;buddy.goal=null;buddy.edge=null;buddy.zoom=0;
  if(nodeOf(buddy)===spot.platform)setMode(buddy,'goFavorite',t,45000);else travelTo(buddy,spot.platform,t);
}
function updateRoomTime(date=new Date()){
  const hour=date.getHours()+date.getMinutes()/60+date.getSeconds()/3600;
  const daylight=hour>=6&&hour<18, progress=((hour-(daylight?6:18)+24)%24)/12;
  const x=10+Math.min(1,progress)*80, top=40-Math.sin(Math.min(1,progress)*Math.PI)*33;
  const night=hour<5||hour>=20?1:hour<7?(7-hour)/2:hour>17?(hour-17)/3:0;
  const root=document.documentElement;root.style.setProperty('--night',Math.max(0,Math.min(1,night)).toFixed(3));
  root.style.setProperty('--reflection-x',x+'%');
  root.style.setProperty('--sun-angle',`${-30+progress*60}deg`);root.style.setProperty('--warmth',daylight?(hour<9||hour>16?.85:.4):.04);
  for(const[id,visible]of[['sun',daylight],['moon',!daylight]]){$(id).hidden=!visible;$(id).style.left=x+'%';$(id).style.top=top+'%';}
  $('clockHour').setAttribute('transform',`rotate(${(hour%12)*30} 60 78)`);
  $('clockMinute').setAttribute('transform',`rotate(${(date.getMinutes()+date.getSeconds()/60)*6} 60 78)`);
  $('catClockText').textContent=date.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false});
  $('roomClock').textContent=date.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})+(night>.7?' · 달빛의 방':hour>16?' · 노을의 방':' · 호수의 방');
  document.body.dataset.time=night>.7?'night':'day';
  const dateKey=`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}-${Math.floor(hour*2)}`;
  if(dateKey!==lastRoomDate){lastRoomDate=dateKey;if(weatherChoice==='auto')setRoomWeather('auto',date);}
}
function setRoomWeather(choice,date=new Date()){
  weatherChoice=choice;
  if(choice==='auto'){
    // A stable, half-hour story-weather slot shared by reloads; no location permission.
    const key=Math.floor(date.getTime()/1800000), value=((key*9301+49297)%233280)/233280;
    roomWeather=value<.62?'clear':value<.88?'rain':value<.98?'snow':'hail';
  }else roomWeather=choice;
  document.body.dataset.weather=roomWeather;
}
function drawWeather(t){
  if(reduceMotion)t=0;
  const canvas=$('weatherCanvas'),ctx=canvas.getContext('2d'),rect=canvas.getBoundingClientRect();
  if(canvas.width!==Math.round(rect.width)||canvas.height!==Math.round(rect.height)){canvas.width=Math.round(rect.width);canvas.height=Math.round(rect.height);}
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(roomWeather!=='clear'){
    const snow=roomWeather==='snow',hail=roomWeather==='hail',speed=snow?18:hail?160:230;
    ctx.strokeStyle='rgba(224,241,247,.65)';ctx.fillStyle=snow?'#fffcf1dc':'#eef8f9d9';ctx.lineWidth=1;
    for(let i=0;i<(snow?45:65);i++){
      const x=((i*137.2+Math.sin(t/2000+i)*(snow?14:2))%Math.max(1,canvas.width));
      const yy=(i*71+t/1000*speed)%Math.max(1,canvas.height);
      if(snow||hail){ctx.beginPath();ctx.arc(x,yy,snow?1.8:2.6,0,Math.PI*2);ctx.fill();}
      else{ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x-4,yy+13);ctx.stroke();}
    }
  }
  weatherFrame=requestAnimationFrame(drawWeather);
}
function setRoomControls(visible){
  document.body.classList.toggle('controls-visible',visible);
  $('roomScene').setAttribute('aria-expanded',String(visible));
}
function initRoom(){
  document.body.append(document.querySelector('.cat-wall-clock'));
  let press=null;
  const isControl=target=>target.closest('button,a,input,select,label,.cat,[role="button"]');
  document.addEventListener('pointerdown',e=>{
    press=e.isPrimary&&e.button===0&&!isControl(e.target)?{id:e.pointerId,x:e.clientX,y:e.clientY}:null;
  });
  document.addEventListener('pointerup',e=>{
    if(press&&press.id===e.pointerId&&Math.hypot(e.clientX-press.x,e.clientY-press.y)<8&&!isControl(e.target))setRoomControls(!document.body.classList.contains('controls-visible'));
    press=null;
  });
  document.addEventListener('pointercancel',()=>{press=null;});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){setRoomControls(false);$('roomScene').focus({preventScroll:true});}
    else if(e.key==='Tab')setRoomControls(true);
    else if((e.key==='Enter'||e.key===' ')&&e.target===$('roomScene')){e.preventDefault();setRoomControls(!document.body.classList.contains('controls-visible'));}
  });
  $('friendsBtn').onclick=()=>{inviteRoomFriends();$('status').textContent='소양이, 소미, 팡이가 놀러 왔어요.';};
  $('closeControls').onclick=()=>setRoomControls(false);
  $('weather').onchange=e=>setRoomWeather(e.target.value);
  $('catBtn').addEventListener('click',()=>{$('catBtn').textContent=catsOn?'고양이 숨기기':'고양이 보이기';});
  $('restBtn').onclick=()=>{const t=performance.now();cats.forEach(c=>{if(!c.air&&!['angel','bubble'].includes(c.mode)){leave(c,t);if(!chooseFavorite(c,t))sleepNow(c,t);}});$('status').textContent='각자 좋아하는 폭신한 자리로 가요.';};
  $('wingsBtn').onclick=()=>{if(reduceMotion){$('status').textContent='움직임을 켜면 로이와 동글이가 날개를 펼쳐요.';return;}const t=performance.now();cats.filter(c=>['로이','동글이'].includes(c.name)).forEach(c=>{c.angelAfter=0;c.restUntil=0;if(!c.air)startAngelFlight(c,t);});};
  setRoomControls(false);updateRoomTime();setInterval(updateRoomTime,1000);
  weatherFrame=requestAnimationFrame(drawWeather);
}
