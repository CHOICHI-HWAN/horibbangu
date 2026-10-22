// Published defaults contain size ratios only, never kilogram values.
let roomSizes = Object.assign({}, /*ROOM_SIZES*/);
try { Object.assign(roomSizes,JSON.parse(localStorage.getItem('horibbangu-cat-sizes-v1')||'{}')); } catch(e) {}
addEventListener('storage',e=>{if(e.key==='horibbangu-cat-sizes-v1'){try {Object.assign(roomSizes,JSON.parse(e.newValue||'{}'));renderCats();}catch(err){}}});
// Room-only scenery and events. Time is the device's local clock; weather is fictional.
let housePlatforms = [], tunnelPlatform = null, tunnelX=0, roomWeather = 'clear', weatherChoice = 'auto';
let acorns=[];
let eventState = null, nextVisitAt = 0, nextBusAt = 0, lastRoomDate = '', weatherFrame = 0;
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
function totoroSVG(umbrella=false){
  const id=umbrella?'rain-totoro':'meal-totoro';
  return `<svg viewBox="0 ${umbrella?-42:0} 180 ${umbrella?202:160}" aria-hidden="true"><defs>
  <radialGradient id="${id}-fur" cx="35%" cy="25%" r="85%"><stop stop-color="#a5b2a8"/><stop offset=".65" stop-color="#87998f"/><stop offset="1" stop-color="#667d73"/></radialGradient>
  <radialGradient id="${id}-belly" cx="40%" cy="25%" r="80%"><stop stop-color="#fff5d9"/><stop offset="1" stop-color="#d8d6ba"/></radialGradient>
  <linearGradient id="${id}-blue" x2="1" y2="1"><stop stop-color="#9ebdc5"/><stop offset="1" stop-color="#6d98a6"/></linearGradient>
  </defs><ellipse cx="87" cy="151" rx="72" ry="6" fill="#455c4a" opacity=".1"/>
  ${umbrella?`<path d="M129-12V99q0 17-11 12" fill="none" stroke="#82664a" stroke-width="3" stroke-linecap="round"/><path d="M8-3Q19-40 91-40q68 0 82 37-21-14-41 1-21-16-42 0Q68-19 48-2 27-18 8-3Z" fill="#527f69" stroke="#426951" stroke-width="1.3"/><path d="M91-40Q54-27 48-2m43-38Q122-27 132-2M91-40v38" fill="none" stroke="#87aa86" stroke-width="1"/><path d="M90-41v-5" stroke="#82664a" stroke-width="2"/>`:''}
  <g class="guest-big">
  <path d="M50 48Q43 19 52 5q7-8 12 6l10 32M103 42l9-31q7-16 13-4 7 17-1 41" fill="url(#${id}-fur)" stroke="#6c8376" stroke-width="1"/>
  <path d="m53 13 6 24 4-4-6-20m62 1-8 22 4 1 7-22" fill="#bec7ac" opacity=".6"/>
  <path d="M39 78Q28 92 31 113q2 9 10 0l11-23M127 77q21 10 19 31-1 15-10 6l-12-21" fill="#82978b" stroke="#70867a" stroke-width="1"/>
  <path d="M41 135q-7 15 7 17h15q10-2 7-14m32-2q-4 16 9 17h13q11-2 3-17" fill="#788e81"/>
  <path d="M40 77Q40 41 76 36q41-7 55 29 15 29 3 61-10 25-47 24-38 0-47-23-10-27 0-50Z" fill="url(#${id}-fur)" stroke="#718779" stroke-width="1.1"/>
  <path d="M55 106q4-28 31-29 31 0 36 29 8 33-34 37-41-2-33-37Z" fill="url(#${id}-belly)"/>
  <path d="m62 101 7-6 7 6-7-2Zm20-6 7-6 7 6-7-2Zm19 6 7-6 7 6-7-2ZM64 116l6-6 6 6-6-2Zm18-2 7-6 7 6-7-2Zm20 2 6-6 6 6-6-2Z" fill="#7c9281"/>
  <g class="guest-eyes"><ellipse cx="62" cy="65" rx="9.3" ry="8.2" fill="#fffdf1"/><ellipse cx="111" cy="65" rx="9.3" ry="8.2" fill="#fffdf1"/><ellipse cx="65" cy="65" rx="3.4" ry="4.3" fill="#34463e"/><ellipse cx="108" cy="65" rx="3.4" ry="4.3" fill="#34463e"/><circle cx="66" cy="63.5" r="1.1" fill="white"/><circle cx="109" cy="63.5" r="1.1" fill="white"/></g>
  <path d="M80 71q7-5 14 0l-7 5Z" fill="#40594a"/><path d="M77 79q10 7 20 0" fill="none" stroke="#536d59" stroke-width="1.3" stroke-linecap="round"/>
  <ellipse cx="55" cy="77" rx="7" ry="3" fill="#d5ac9a" opacity=".3"/><ellipse cx="119" cy="77" rx="7" ry="3" fill="#d5ac9a" opacity=".3"/>
  <path d="m43 73-20-5m19 12-22 1m22 4-18 6m107-18 19-5m-18 11 21 2m-20 4 17 6" stroke="#5f7869" stroke-width="1.3" stroke-linecap="round"/>
  <path d="m55 145-1 5m8-5v5m49-5v5m8-5 1 5" stroke="#c3cbb3" stroke-width="1"/>
  ${umbrella?'':`<path d="M73 36q2-14 22-18 3 17-15 18" fill="#80a36c" stroke="#6c8c55"/><path d="m77 36 12-12" stroke="#bfd09d" stroke-width="1"/>`}
  </g>
  <g transform="translate(127 104)"><path d="m3 17 1-23q2-9 7-1l7 18L29-7q5-7 6 2l-1 24q14 25-3 32-22 8-32-7-8-11 4-27Z" fill="url(#${id}-blue)" stroke="#7599a0" stroke-width=".8"/><ellipse cx="17" cy="35" rx="14" ry="15" fill="#eaf0d8"/><path d="m9 31 4-3 4 3m3 7 4-3 4 3" fill="none" stroke="#8fae9e" stroke-width="1.3"/><g class="guest-eyes baby-eyes"><circle cx="10" cy="18" r="4" fill="#fffef0"/><circle cx="27" cy="18" r="4" fill="#fffef0"/><circle cx="11" cy="18" r="1.8" fill="#385555"/><circle cx="26" cy="18" r="1.8" fill="#385555"/></g><path d="m16 22 3 2 3-2" fill="#5b7873"/><path d="M1 37q-7-4-6-8m40 8q7-4 5-8" fill="none" stroke="#789ba1" stroke-width="4" stroke-linecap="round"/></g>
  <g transform="translate(4 116)"><path d="m4 12 1-21q2-6 6 0l7 15 7-16q4-6 6 1l1 22q10 22-3 27-17 6-26-4-8-9 1-24Z" fill="#f4f1dd" stroke="#dbdfc8" stroke-width=".7"/><g class="guest-eyes baby-eyes" style="animation-delay:-3s"><ellipse cx="10" cy="15" rx="2.4" ry="3" fill="#5c776a"/><ellipse cx="25" cy="15" rx="2.4" ry="3" fill="#5c776a"/><circle cx="10.5" cy="14" r=".7" fill="white"/><circle cx="25.5" cy="14" r=".7" fill="white"/></g><path d="m15 21 3 2 3-2" fill="#9fae90"/></g>
  </svg>`;
}
function catbusSVG(){
  const foot=(x,rear=false)=>`<g class="bus-feet ${rear?'feet-back':'feet-front'}"><path d="M${x} 120q-7 11-4 25 0 9 14 8h7q6-3 1-7l-5-2 2-23" fill="${rear?'#bd935e':'#d5ac70'}" stroke="#a27c50" stroke-width="1"/><path d="m${x-2} 130 13 3m-14 5 13 3" stroke="#a57a4c" stroke-width="3"/><path d="m${x+4} 147v4m6-4v4" stroke="#f2d9aa" stroke-width="1.5"/></g>`;
  return `<svg viewBox="0 0 320 180" aria-hidden="true"><defs><radialGradient id="bus-fur" cx="40%" cy="20%" r="90%"><stop stop-color="#e6be7b"/><stop offset=".7" stop-color="#cca063"/><stop offset="1" stop-color="#a97d49"/></radialGradient><linearGradient id="bus-glass" x2="0" y2="1"><stop stop-color="#ffedb9"/><stop offset="1" stop-color="#ebc98c"/></linearGradient></defs>
  <ellipse cx="161" cy="161" rx="139" ry="8" fill="#83663e" opacity=".12"/>
  <path d="M49 108Q7 103 10 69q1-16 13-19-8 24 4 31 13 10 29 2" fill="url(#bus-fur)" stroke="#a37b4b" stroke-width="2"/>
  <path d="m18 62-7 4m13 13-13 4m28 9-5 12" stroke="#956c3e" stroke-width="5"/>
  ${[61,99,139,179,218,257].map(x=>foot(x,true)).join('')}
  <path d="M36 92Q33 48 72 34q45-15 131-7 59 5 80 35 17 26 6 57-10 21-47 24H86q-43-1-50-27Z" fill="url(#bus-fur)" stroke="#a98350" stroke-width="1.5"/>
  <path d="M62 39q-1-17 7-25 9-7 15 12l2 12m140-2 13-19q6-8 11-4 6 8 3 26" fill="#d7ad71" stroke="#aa824d" stroke-width="1.5"/>
  <path d="m70 22 2 12 8-2m161-10-9 13 12 1" fill="#dda391"/>
  <path d="M52 98q84 19 171 2v32H71q-21-5-19-34" fill="#edcf96" opacity=".6"/>
  <rect x="65" y="50" width="157" height="56" rx="20" fill="#aa7f48"/><rect x="69" y="54" width="149" height="46" rx="16" fill="url(#bus-glass)"/>
  <path d="M103 53v48m38-49v49m38-49v49" stroke="#ba8e54" stroke-width="5"/>
  <path d="m78 59-3 17m42-18-4 19m42-19-4 18m41-18-4 18" stroke="#fff9df" stroke-width="2" opacity=".6"/>
  <path d="M51 48q3 10 12 12m-20 9 15 3m-18 10 15 2m28-47 7 12m14-17 5 17m22-19 1 16m23-17-1 16m24-14-4 16m25-12-6 15M64 115l7 13m14-12 5 14m19-13 1 13m22-13-2 13m23-13-4 14m26-13-5 13m26-14-6 14" stroke="#ad7f45" stroke-width="4" stroke-linecap="round"/>
  <path d="M231 58Q250 39 273 49q32 14 28 48-2 24-31 29-35 2-42-25-6-25 3-43" fill="#e0b87b" stroke="#b98e54" stroke-width="1"/>
  <path d="M239 99q26-11 53-1-1 23-27 23-22-2-26-22" fill="#efd6a5"/>
  <g class="guest-eyes"><ellipse cx="246" cy="78" rx="11" ry="13" fill="#fff5ba"/><ellipse cx="281" cy="78" rx="11" ry="13" fill="#fff5ba"/><ellipse cx="249" cy="78" rx="4.2" ry="7.5" fill="#536552"/><ellipse cx="278" cy="78" rx="4.2" ry="7.5" fill="#536552"/><circle cx="251" cy="74" r="2" fill="#fffef2"/><circle cx="280" cy="74" r="2" fill="#fffef2"/></g>
  <path d="m258 91 8-3 8 3-8 6Z" fill="#9d6c52"/>
  <path d="M244 102q22 9 43-1-7 18-23 17-15-1-20-16Z" fill="#fff4da" stroke="#a67d51" stroke-width="1.3"/><path d="M253 105v9m11-8v11m11-12v9" stroke="#cfb180" stroke-width="1"/>
  <path d="m236 93-21-5m20 11-22 4m81-10 19-5m-19 11 19 4" stroke="#99754e" stroke-width="1.3" stroke-linecap="round"/>
  <ellipse cx="236" cy="96" rx="6" ry="3" fill="#d99c86" opacity=".6"/><ellipse cx="292" cy="96" rx="6" ry="3" fill="#d99c86" opacity=".6"/>
  <rect x="110" y="16" width="84" height="20" rx="6" fill="#f2dfad" stroke="#bd9860"/><text x="152" y="30" text-anchor="middle" font-size="10" fill="#92714d">호수 한 바퀴 ♡</text>
  <circle cx="70" cy="17" r="5" fill="#e9ddbd"/><path d="m67 12 4-6 4 6" fill="#be9c73"/><circle cx="73" cy="17" r="1" fill="#675d4a"/>
  ${[50,89,130,172,213,254].map(x=>foot(x,false)).join('')}
  </svg>`;
}

function travelerSVG(){
  return `<svg viewBox="0 0 240 180" aria-hidden="true"><defs>
  <radialGradient id="traveler-fur" cx="35%" cy="25%" r="85%"><stop stop-color="#a7b3a8"/><stop offset=".7" stop-color="#84998b"/><stop offset="1" stop-color="#6b8273"/></radialGradient>
  <radialGradient id="traveler-bag" cx="35%" cy="30%" r="90%"><stop stop-color="#9bac7b"/><stop offset="1" stop-color="#667c54"/></radialGradient>
  </defs>
  <ellipse cx="127" cy="168" rx="94" ry="5" fill="#5d6b50" opacity=".1"/>
  <g class="trail-baby white-traveler"><path class="traveler-foot foot-back" d="M18 148q-6 12 6 13h8l-2-13" fill="#e2e4cd"/>
  <path d="M16 138 16 110 24 90q3-5 6 1l3 20 9-15q4-5 6 1l-3 24q14 11 12 23-4 16-23 15-22-2-18-21Z" fill="#f4f0dc" stroke="#dde1c7" stroke-width=".8"/>
  <path class="traveler-foot foot-front" d="M36 150q-3 12 8 12h8q4-4-3-6l-2-7" fill="#f4f0dc"/>
  <g class="guest-eyes baby-eyes"><ellipse cx="45" cy="126" rx="2.7" ry="3.3" fill="#526e5c"/><circle cx="46" cy="125" r=".8" fill="white"/></g><path d="m53 132 4 1-3 2" fill="#91a184"/></g>
  <g class="trail-baby blue-traveler"><path class="traveler-foot foot-back" d="M59 147q-5 14 8 15h9l-3-14" fill="#789aa5"/>
  <path d="M58 128q-1-13 6-22l-2-27q2-8 7-1l8 23 10-21q4-6 6 1l-2 28q15 6 17 22 4 25-22 31-29 1-28-34Z" fill="#92b2bc" stroke="#759ca2" stroke-width="1"/>
  <path d="M89 120q19 3 14 24-7 14-19 10-11-9 5-34Z" fill="#e6ebd0"/>
  <path class="traveler-foot foot-front" d="M84 151q-3 13 9 13h10q5-4-4-6l-2-7" fill="#92b2bc"/>
  <g class="guest-eyes baby-eyes" style="animation-delay:-2s"><ellipse cx="94" cy="115" rx="4" ry="4.5" fill="#fffdf1"/><ellipse cx="95" cy="115" rx="1.8" ry="2.4" fill="#426267"/></g><path d="m103 122 5 2-5 2" fill="#638b89"/></g>
  <g class="traveler-body">
  <path class="traveler-foot foot-back" d="M119 147q-11 17 3 19h21q7-4-2-10l-2-10" fill="#758e7a" stroke="#667e6d" stroke-width="1"/>
  <path d="M111 73q-3-24 5-49 6-14 11-2l7 38m13-4 13-38q7-12 12-2 4 21-6 47" fill="url(#traveler-fur)" stroke="#738b77" stroke-width="1"/>
  <path d="m119 28 3 25 5-3-3-21m40-5-10 27 5-1 9-25" fill="#bac5a8" opacity=".65"/>
  <path d="M106 83q8-29 37-30 25-2 42 17l10 17q20 8 12 19l-12 5q12 38-21 50-43 16-69-11-20-27 1-67Z" fill="url(#traveler-fur)" stroke="#6e8573" stroke-width="1.1"/>
  <path d="M167 98q24 5 22 30-3 27-28 29-16-6-12-24 3-23 18-35Z" fill="#ece7cd"/>
  <path d="m165 116 6-5 4 6-5-2Zm-9 16 6-5 4 6-5-2Zm14 8 6-5 4 6-5-2Z" fill="#8b9d7f"/>
  <g class="guest-eyes profile-eye"><ellipse cx="180" cy="84" rx="8" ry="8.5" fill="#fffdf1"/><ellipse cx="183" cy="84" rx="3.3" ry="4.3" fill="#3c5546"/><circle cx="184" cy="82" r="1.1" fill="white"/></g>
  <path d="M199 91q8-2 10 4l-8 3Z" fill="#4c6651"/><path d="M188 105q7 3 12-2" stroke="#6a805e" fill="none" stroke-width="1.2" stroke-linecap="round"/>
  <ellipse cx="179" cy="98" rx="6" ry="3" fill="#cca795" opacity=".35"/>
  <path d="m193 100 23-3m-23 8 23 4m-36 4 14 5" stroke="#5e775e" stroke-width="1.2" stroke-linecap="round"/>
  <path class="traveler-foot foot-front" d="M156 150q-5 16 7 17h20q7-4-3-8l-6-10" fill="#819682" stroke="#6c846f" stroke-width="1"/>
  <path d="m165 163 1 3m6-3 1 3" stroke="#c7cfb3" stroke-width="1"/>
  <path d="M163 103q-5 13 5 15 11-1 9-15" fill="#7e9480" stroke="#6d8470" stroke-width="1"/>
  </g>
  <g class="traveler-bundle">
  <path d="m81 47 89 57" stroke="#886d48" stroke-width="4.5" stroke-linecap="round"/><path d="m86 50-5-11m3 10-11-3" stroke="#886d48" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M102 65q-18 2-24 27-4 24 22 29 26 2 29-21-2-24-18-34Z" fill="url(#traveler-bag)" stroke="#5f784e" stroke-width="1"/>
  <path d="M103 69q-12-8-12-15 11-2 16 9 6-13 15-10-1 10-13 16Z" fill="#8fa06d" stroke="#687f51" stroke-width="1"/>
  <path d="M105 69q-7 19-3 45m8-42q13 21 8 35" stroke="#b4bc8a" stroke-width="1" opacity=".6" fill="none"/>
  <g fill="#e5e2b9" opacity=".7"><circle cx="89" cy="88" r="2.3"/><circle cx="116" cy="89" r="2.3"/><circle cx="94" cy="105" r="2"/><circle cx="115" cy="107" r="2"/></g>
  <path d="m102 117 5-3 5 4" stroke="#516d45" stroke-width="1.6" fill="none"/>
  </g></svg>`;
}
function acornSVG(){
  return '<svg viewBox="0 0 20 25" aria-hidden="true"><path d="M4 10q-1 10 6 14 8-4 7-14Z" fill="#b2844f" stroke="#8e673e" stroke-width="1"/><path d="M2 11q-1-9 8-9 9 0 9 9Z" fill="#795d3f"/><path d="m10 3 2-3" stroke="#795d3f" stroke-width="2" stroke-linecap="round"/><path d="m5 7 3 2m1-4 3 3m2-2 2 3" stroke="#a58b62" stroke-width="1"/><path d="M7 14q-1 4 2 6" stroke="#d5b481" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
}
function dropAcorn(x,born){
  const el=document.createElement('span');el.className='trail-acorn';el.innerHTML=acornSVG();el.style.left=x+'px';$('wanderers').append(el);
  acorns.push({el,born});
}
function updateAcorns(now){
  acorns=acorns.filter(a=>{
    const age=Math.max(0,(now-a.born)/1000);
    if(age>=10){a.el.remove();return false;}
    const fall=Math.min(1,age/.65),bounce=age>.65&&age<1.05?Math.sin((age-.65)/.4*Math.PI)*6:0;
    a.el.style.bottom=(26+78*Math.pow(1-fall,2)+bounce)+'px';
    a.el.style.transform=`rotate(${-26+fall*48}deg)`;a.el.style.opacity=age<7?'1':String((10-age)/3);
    return true;
  });
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
function beginStroll(now=Date.now()){
  if(eventState||reduceMotion)return false;
  const width=$('visitors').offsetWidth;
  eventState={kind:'stroll',start:now,width,walkDuration:Math.max(12,Math.min(24,(innerWidth+width)/52)),dropped:0};
  $('visitors').className='strolling';$('visitors').style.opacity='1';$('visitors').style.left=(-width-24)+'px';
  $('orangeDoor').classList.add('open');$('status').textContent='봇짐 메고 쪼르르… 도토리 손님들이 산책을 왔어요.';updateVisitButtons();return true;
}
function beginBus(now=Date.now()){
  if(eventState||reduceMotion)return false;
  const passengers=cats.filter(c=>!c.air&&!['angel','bubble'].includes(c.mode)).slice(0,4);
  if(!passengers.length)return false;
  eventState={kind:'bus',start:now,passengers,boarded:false};$('status').textContent='고양이버스가 호수 드라이브를 왔어요.';updateVisitButtons();return true;
}
function tickRoomEvents(now=Date.now()){
  updateAcorns(now);
  if(!eventState){
    if(now>=nextVisitAt&&!document.hidden&&!reduceMotion){nextVisitAt=now+FIFTY_MINUTES;beginStroll(now);}
    else if(now>=nextBusAt&&!document.hidden&&!reduceMotion){nextBusAt=now+(18+Math.random()*12)*60000;beginBus(now);}
    return;
  }
  const e=eventState,sec=(now-e.start)/1000;
  if(e.kind==='stroll'){
    const walkers=$('visitors'),walk=Math.min(1,sec/e.walkDuration),run=Math.max(0,Math.min(1,(sec-e.walkDuration)/3.6));
    const runStart=innerWidth-e.width*1.1;
    const x=sec<e.walkDuration?-e.width+(runStart+e.width)*walk:runStart+(innerWidth+e.width+30-runStart)*Math.pow(run,1.3);
    const jump=Math.max(0,Math.min(1,(sec-e.walkDuration-1.2)/1.8));
    const lift=Math.sin(jump*Math.PI)*85;
    walkers.style.left=x+'px';walkers.style.transform=`translateY(${-lift}px) rotate(${jump>0&&jump<1?-Math.sin(jump*Math.PI)*7:0}deg)`;
    walkers.classList.toggle('running',sec>=e.walkDuration);walkers.classList.toggle('leaping',jump>0&&jump<1);
    // Each acorn has its own birth time/position, even when a background frame arrives late.
    while(e.dropped<10){
      const dropAt=2.5+e.dropped*1.75;
      if(dropAt>=e.walkDuration-.7||sec<dropAt)break;
      const dropX=-e.width+(runStart+e.width)*(dropAt/e.walkDuration)+e.width*107/240;
      dropAcorn(dropX,e.start+dropAt*1000);e.dropped++;
    }
    updateAcorns(now);
    if(sec>6)$('orangeDoor').classList.remove('open');
    if(sec>=e.walkDuration+3.6){walkers.className='';walkers.style.left=(-e.width-24)+'px';walkers.style.transform='';$('orangeDoor').classList.remove('open');eventState=null;updateVisitButtons();$('status').textContent='도토리를 나누고, 폴짝! 다음에 또 만나요 ♡';}
  }else{
    const bus=$('catbus'),target=Math.max(20,innerWidth/2-140);
    const x=sec<5?-320+(target+320)*sec/5:sec<10?target:sec<20?target+(innerWidth+320-target)*Math.min(1,(sec-10)/5):sec<25?-320+(target+320)*(sec-20)/5:sec<31?target:target+(innerWidth+320-target)*Math.min(1,(sec-31)/5);
    bus.style.left=x+'px';bus.classList.toggle('driving',sec<5||(sec>=10&&sec<25)||sec>=31);
    if(sec>=6&&!e.boarded){e.boarded=true;e.passengers.forEach(c=>{leave(c,performance.now());c.goal=null;c.edge=null;c.air=false;c.mode='busRide';c.el.classList.add('bus-passenger');});
      bus.querySelector('.bus-riders').replaceChildren(...e.passengers.map((c,i)=>{const face=c.el.cloneNode(true);face.className='cat '+c.lookCls+' bus-face';face.style.transform='';face.removeAttribute('id');face.querySelectorAll('.bubble,.note').forEach(el=>el.remove());const svg=face.querySelector('svg');svg.setAttribute('viewBox','26 0 42 40');svg.innerHTML=svg.innerHTML.replaceAll('cat-'+cats.indexOf(c)+'-', 'rider-'+i+'-');return face;}));}
    if(sec>=26&&e.passengers.length){e.passengers.forEach((c,i)=>{c.el.classList.remove('bus-passenger');c.x=Math.max(0,Math.min(innerWidth-CAT_W,target+40+i*45));c.y=0;c.air=false;c.stand=null;c.until=performance.now()+2000;c.mode='watch';});e.passengers=[];bus.querySelector('.bus-riders').innerHTML='';}
    if(sec>=37){eventState=null;updateVisitButtons();bus.style.left='-320px';$('status').textContent='호수 한 바퀴, 다녀왔어요 ♡';}
  }
}
function updateVisitButtons(){
  $('guestsBtn').disabled=!!eventState;$('busBtn').disabled=!!eventState;
  $('guestsBtn').textContent=eventState?.kind==='stroll'?'산책 중…':'손님 초대';
  $('busBtn').textContent=eventState?.kind==='bus'?'드라이브 중…':'버스 부르기';
}
function initRoom(){
  document.body.append(document.querySelector('.cat-wall-clock'));
  $('guestsBtn').onclick=()=>{if(reduceMotion)$('motionBtn').click();const now=Date.now();if(beginStroll(now))nextVisitAt=now+FIFTY_MINUTES;};
  $('busBtn').onclick=()=>{if(reduceMotion)$('motionBtn').click();const now=Date.now();if(beginBus(now))nextBusAt=now+(18+Math.random()*12)*60000;};
  $('visitors').innerHTML=travelerSVG();$('rain-friend').innerHTML=totoroSVG(true);
  $('catbus').insertAdjacentHTML('afterbegin',catbusSVG());
  $('weather').onchange=e=>setRoomWeather(e.target.value);
  $('catBtn').addEventListener('click',()=>{$('catBtn').textContent=catsOn?'고양이 숨기기':'고양이 보이기';});
  $('restBtn').onclick=()=>{const t=performance.now();cats.forEach(c=>{if(!c.air&&!['angel','bubble','busRide'].includes(c.mode)){leave(c,t);if(!chooseFavorite(c,t))sleepNow(c,t);}});$('status').textContent='각자 좋아하는 폭신한 자리로 가요.';};
  $('wingsBtn').onclick=()=>{if(reduceMotion){$('status').textContent='움직임을 켜면 로이와 동글이가 날개를 펼쳐요.';return;}const t=performance.now();cats.filter(c=>['로이','동글이'].includes(c.name)).forEach(c=>{c.angelAfter=0;c.restUntil=0;if(!c.air)startAngelFlight(c,t);});};
  updateRoomTime();nextVisitAt=Date.now()+FIFTY_MINUTES;nextBusAt=Date.now()+(18+Math.random()*12)*60000;
  setInterval(()=>{updateRoomTime();},1000);
  weatherFrame=requestAnimationFrame(drawWeather);
}
