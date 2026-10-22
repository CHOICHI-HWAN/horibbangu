// Room-only scenery and events. Time is the device's local clock; weather is fictional.
let housePlatforms = [], tunnelPlatform = null, tunnelX=0, roomWeather = 'clear', weatherChoice = 'auto';
let bowlsUntil=0;
let eventState = null, nextMealAt = 0, nextBusAt = 0, lastRoomDate = '', weatherFrame = 0;
const FIFTY_MINUTES = 50 * 60 * 1000;
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
  if (!buddy||buddy.air||['bubble','angel','busRide'].includes(buddy.mode)) return;
  const spot=cozySpots.find(p=>p.kind==='house-top'&&p!==c.cozy&&!cats.some(o=>o!==buddy&&o.cozy===p));
  if (!spot) return;
  buddy.cozy=spot;buddy.favorite='house-top';buddy.tx=spot.xc;buddy.goal=null;buddy.edge=null;buddy.zoom=0;
  if(nodeOf(buddy)===spot.platform)setMode(buddy,'goFavorite',t,45000);else travelTo(buddy,spot.platform,t);
}
function totoroSVG(umbrella=false){return `<svg viewBox="0 0 180 160"><g ${umbrella?'transform="translate(24 25) scale(.8)"':''}><path d="M48 62 51 14q5-12 12 2l8 35M100 50l8-37q8-12 12 2l1 48" fill="#89948b"/><ellipse cx="86" cy="101" rx="51" ry="54" fill="#89948b"/><ellipse cx="86" cy="113" rx="36" ry="37" fill="#eee8cd"/><g fill="#536358"><path d="m63 99 7-6 7 6-7-2ZM84 96l7-6 7 6-7-2ZM66 114l6-5 6 5-6-2ZM91 113l6-5 6 5-6-2Z"/></g><g fill="white"><ellipse cx="64" cy="75" rx="9" ry="8"/><ellipse cx="106" cy="75" rx="9" ry="8"/></g><g fill="#303c35"><circle cx="66" cy="75" r="3"/><circle cx="104" cy="75" r="3"/><path d="m79 81 7 5 7-5Z"/></g><path d="M39 83 20 79m18 10-20 2m114-8 20-4m-20 10 20 2" stroke="#47584c" stroke-width="1.5"/>${umbrella?'<path d="M107 9v108q0 11-9 5" fill="none" stroke="#775b3e" stroke-width="3"/><path d="M36 28Q54-35 109-26Q164-22 180 28q-23-16-48 0-23-16-46 0-23-16-50 0Z" fill="#5a8c74" stroke="#3f6b57"/>':''}</g><g transform="translate(131 113)"><path d="m0 12 4-22 10 20 12-19 4 22q22 34-13 34T0 12" fill="#bbc5bb"/><circle cx="10" cy="19" r="3" fill="white"/><circle cx="22" cy="19" r="3" fill="white"/><circle cx="10" cy="19" r="1.5"/><circle cx="22" cy="19" r="1.5"/></g><g transform="translate(7 126) scale(.7)"><path d="m0 9 4-20 9 18 13-16 3 20q17 30-14 30T0 9" fill="#eee9d9"/><circle cx="9" cy="16" r="2"/><circle cx="21" cy="16" r="2"/></g></svg>`;}
function catbusSVG(){return `<svg viewBox="0 0 280 145"><g fill="#b48b53" stroke="#80633e" stroke-width="1.5"><path d="M35 106q-30-60 12-83l18-18 10 24h130l16-23 11 31q50 26 30 69Z"/><path d="M34 90Q-3 72 8 43Q8 86 45 78"/><path d="M44 103q-12 26 2 28h10l1-27M76 103q-12 28 2 28h10l1-27M109 103q-12 28 2 28h10l1-27M144 103q-12 28 2 28h10l1-27M178 103q-12 28 2 28h10l1-27M213 103q-12 28 2 28h10l1-27"/></g><rect x="55" y="38" width="153" height="44" rx="16" fill="#f2d8a0"/><path d="M88 39v42m40-42v42m40-42v42" stroke="#9c7544" stroke-width="4"/><ellipse cx="231" cy="59" rx="16" ry="23" fill="#d4b37a"/><g fill="#f7ed9c"><ellipse cx="225" cy="53" rx="6" ry="7"/><ellipse cx="244" cy="53" rx="6" ry="7"/></g><circle cx="226" cy="53" r="2"/><circle cx="243" cy="53" r="2"/><path d="m231 64 5 3 5-3" fill="#7b593e"/><path d="M219 75q17 16 34-2Z" fill="#faf3d5" stroke="#775a3b"/><path d="M228 77v9m9-8v8m9-10v7M231 69l-23 1m35 0 26-1" stroke="#886a48"/><rect x="107" y="17" width="66" height="17" rx="4" fill="#eaddae"/><text x="140" y="29" text-anchor="middle" font-size="10" fill="#796244">바다 한 바퀴</text></svg>`;}
function updateRoomTime(date=new Date()){
  const hour=date.getHours()+date.getMinutes()/60+date.getSeconds()/3600;
  const daylight=hour>=6&&hour<18, progress=((hour-(daylight?6:18)+24)%24)/12;
  const x=10+Math.min(1,progress)*80, top=40-Math.sin(Math.min(1,progress)*Math.PI)*33;
  const night=hour<5||hour>=20?1:hour<7?(7-hour)/2:hour>17?(hour-17)/3:0;
  const root=document.documentElement;root.style.setProperty('--night',Math.max(0,Math.min(1,night)).toFixed(3));
  root.style.setProperty('--reflection-x',x+'%');
  root.style.setProperty('--sun-angle',`${-30+progress*60}deg`);root.style.setProperty('--warmth',daylight?(hour<9||hour>16?.85:.4):.04);
  for(const[id,visible]of[['sun',daylight],['moon',!daylight]]){$(id).hidden=!visible;$(id).style.left=x+'%';$(id).style.top=top+'%';}
  $('roomClock').textContent=date.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})+(night>.7?' · 달빛의 방':hour>16?' · 노을의 방':' · 바다의 방');
  document.body.dataset.time=night>.7?'night':'day';
  $('rain-friend').classList.toggle('visible',roomWeather==='rain'&&date.getMinutes()%20<12);
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
  $('rain-friend').classList.toggle('visible',roomWeather==='rain'&&date.getMinutes()%20<12);
}
function drawWeather(t){
  if(reduceMotion)t=0;
  tickRoomEvents();
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
function beginMeal(now=Date.now()){
  if(eventState||reduceMotion)return false;
  const door=$('orangeDoor').getBoundingClientRect();
  eventState={kind:'meal',start:now,served:false,doorX:door.left+door.width/2-90};$('orangeDoor').classList.add('open');$('status').textContent='주황색 문이 열렸어요. 작은 친구들이 밥을 차리러 왔어요.';return true;
}
function beginBus(now=Date.now()){
  if(eventState||reduceMotion)return false;
  const passengers=cats.filter(c=>!c.air&&!['angel','bubble'].includes(c.mode)).slice(0,4);
  if(!passengers.length)return false;
  eventState={kind:'bus',start:now,passengers,boarded:false};$('status').textContent='고양이버스가 바다 드라이브를 왔어요.';return true;
}
function tickRoomEvents(now=Date.now()){
  if(bowlsUntil && now>bowlsUntil){$('bowls').classList.remove('visible');bowlsUntil=0;}
  if(!eventState){
    if(now>=nextMealAt&&!document.hidden&&!reduceMotion){nextMealAt=now+FIFTY_MINUTES;beginMeal(now);}
    else if(now>=nextBusAt&&!document.hidden&&!reduceMotion){nextBusAt=now+(18+Math.random()*12)*60000;beginBus(now);}
    return;
  }
  const e=eventState,sec=(now-e.start)/1000;
  if(e.kind==='meal'){
    const progress=sec<6?Math.min(1,sec/6):sec<25?1:Math.max(0,1-(sec-25)/6);
    const x=e.doorX+(innerWidth*.26-e.doorX)*progress;
    $('visitors').style.left=x+'px';$('visitors').style.opacity=String(Math.min(1,progress*3));$('visitors').style.transform=`scale(${.25+.75*progress})`;
    if(sec>=8&&!e.served){e.served=true;bowlsUntil=now+120000;$('bowls').classList.add('visible');cats.forEach((c,i)=>{if(!c.air&&c.mode!=='bubble'){leave(c,performance.now());c.goal=null;c.edge=null;c.foodTarget=innerWidth*(.23+i*.065);c.zoom=0;if(nodeOf(c)===GROUND){c.tx=c.foodTarget;c.foodTarget=null;c.favorite='eat';setMode(c,'goFavorite',performance.now(),45000);}else travelTo(c,GROUND,performance.now());}});}
    if(sec>=32){$('orangeDoor').classList.remove('open');$('visitors').style.left='-230px';eventState=null;$('status').textContent='맛있게 먹고, 또 느긋하게 놀아요.';}
  }else{
    const bus=$('catbus'),target=Math.max(20,innerWidth/2-140);
    const x=sec<5?-320+(target+320)*sec/5:sec<10?target:sec<20?target+(innerWidth+320-target)*Math.min(1,(sec-10)/5):sec<25?-320+(target+320)*(sec-20)/5:sec<31?target:target+(innerWidth+320-target)*Math.min(1,(sec-31)/5);
    bus.style.left=x+'px';
    if(sec>=6&&!e.boarded){e.boarded=true;e.passengers.forEach(c=>{leave(c,performance.now());c.goal=null;c.edge=null;c.air=false;c.mode='busRide';c.el.classList.add('bus-passenger');});
      bus.querySelector('.bus-riders').replaceChildren(...e.passengers.map((c,i)=>{const face=c.el.cloneNode(true);face.className='cat '+c.lookCls+' bus-face';face.style.transform='';face.removeAttribute('id');face.querySelectorAll('.bubble,.note').forEach(el=>el.remove());const svg=face.querySelector('svg');svg.setAttribute('viewBox','26 0 42 40');svg.innerHTML=svg.innerHTML.replaceAll('cat-'+cats.indexOf(c)+'-', 'rider-'+i+'-');return face;}));}
    if(sec>=26&&e.passengers.length){e.passengers.forEach((c,i)=>{c.el.classList.remove('bus-passenger');c.x=Math.max(0,Math.min(innerWidth-CAT_W,target+40+i*45));c.y=0;c.air=false;c.stand=null;c.until=performance.now()+2000;c.mode='watch';});e.passengers=[];bus.querySelector('.bus-riders').innerHTML='';}
    if(sec>=37){eventState=null;bus.style.left='-320px';$('status').textContent='바다 한 바퀴, 다녀왔어요 ♡';}
  }
}
function initRoom(){
  $('visitors').innerHTML=totoroSVG();$('rain-friend').innerHTML=totoroSVG(true);
  $('catbus').insertAdjacentHTML('afterbegin',catbusSVG());
  $('bowls').innerHTML=Array.from({length:8},()=>'<span class="food-bowl"></span>').join('');
  $('weather').onchange=e=>setRoomWeather(e.target.value);
  $('catBtn').addEventListener('click',()=>{$('catBtn').textContent=catsOn?'고양이 숨기기':'고양이 보이기';});
  $('restBtn').onclick=()=>{const t=performance.now();cats.forEach(c=>{if(!c.air&&!['angel','bubble','busRide'].includes(c.mode)){leave(c,t);if(!chooseFavorite(c,t))sleepNow(c,t);}});$('status').textContent='각자 좋아하는 폭신한 자리로 가요.';};
  $('wingsBtn').onclick=()=>{if(reduceMotion){$('status').textContent='움직임을 켜면 로이와 동글이가 날개를 펼쳐요.';return;}const t=performance.now();cats.filter(c=>['로이','동글이'].includes(c.name)).forEach(c=>{c.angelAfter=0;c.restUntil=0;if(!c.air)startAngelFlight(c,t);});};
  updateRoomTime();nextMealAt=Date.now()+FIFTY_MINUTES;nextBusAt=Date.now()+(18+Math.random()*12)*60000;
  setInterval(()=>{updateRoomTime();},1000);
  weatherFrame=requestAnimationFrame(drawWeather);
}
