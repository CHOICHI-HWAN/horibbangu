// Hit testing keeps the desktop usable through every empty transparent pixel.
const host=window.desktopHost;
// Hoisted because initRoom runs the shared clock before this overlay initializes.
var desktopSuspended=false;
// Let Chromium animate CSS on its own compositor clock. Pausing and seeking every
// Animation each cat frame also drives transitions and forces repeated style work.
function suspendDesktop(suspended){
 desktopSuspended=suspended;
 document.body.classList.toggle('desktop-suspended',suspended);
 if(!suspended){lastT=performance.now();queueCatFrame();updateRoomTime();}
}
let passiveDesktop=host?.passive===true;
if(passiveDesktop)document.body.classList.add("passive-desktop");
let holding=false,lastInteractive=null,lastHitRect='',lastPointer={x:-1,y:-1};
function updateDesktopHit(x=lastPointer.x,y=lastPointer.y){
 if(passiveDesktop||host?.setHitRegions)return;
 lastPointer={x,y};
 const target=document.elementFromPoint(x,y);
 const hit=target?.closest('.cat,button,a,select');
 const interactive=holding||!!hit;
 const box=hit?.getBoundingClientRect();
 const rect=box?[box.left,box.top,box.right,box.bottom].map(value=>Math.round(value*devicePixelRatio)):null;
 const signature=rect?.join(',')||'';
 if(interactive!==lastInteractive||signature!==lastHitRect){lastInteractive=interactive;lastHitRect=signature;host?.setInteractive(interactive,rect);}
}
addEventListener('mousemove',event=>updateDesktopHit(event.clientX,event.clientY));
addEventListener('pointerdown',event=>{if(!passiveDesktop&&event.button===0&&event.target.closest('.cat'))holding=true;updateDesktopHit(event.clientX,event.clientY);},true);
for(const type of ['pointerup','pointercancel','lostpointercapture'])addEventListener(type,event=>{holding=false;updateDesktopHit(event.clientX,event.clientY);},true);
addEventListener('blur',()=>{holding=false;host?.setInteractive(false);lastInteractive=false;});
// Cats can move away from the pointer without another native mouse message.
if(!host?.setHitRegions)setInterval(()=>updateDesktopHit(),120);
let lastRegions='',lastRegionsAt=0;
let catGeometry=new WeakMap();
addEventListener('resize',()=>{catGeometry=new WeakMap();});
function publishDesktopRegions(){
 if(passiveDesktop||document.hidden||desktopSuspended||!host?.setHitRegions)return;
 const modal=document.querySelector('dialog[open]');
 const rects=[];
 if(!modal&&catsOn&&!$('cats').hidden)for(const c of cats){
  const el=c.el;if(el.hidden||el.style.display==='none'||el.style.pointerEvents==='none'||el.style.visibility==='hidden')continue;
  let box=catGeometry.get(el);
  if(!box){const style=getComputedStyle(el);box={width:parseFloat(style.width),height:parseFloat(style.height),bottom:parseFloat(style.bottom)};catGeometry.set(el,box);}
  const left=Number((c.renderedX??c.x).toFixed(1)),bottom=innerHeight-box.bottom-Number((c.renderedY??c.y).toFixed(1));
  rects.push([left-8,bottom-box.height-8,left+box.width+8,bottom+8].map(v=>Math.round(v*devicePixelRatio)));
 }
 const controls=modal?[modal]:document.body.classList.contains('controls-visible')?document.querySelectorAll('button,a,select'):[desktopMenuButton];
 for(const el of controls){
  if(!el.getClientRects().length||getComputedStyle(el).visibility==='hidden'||getComputedStyle(el).pointerEvents==='none')continue;
  const r=el.getBoundingClientRect();rects.push([r.left,r.top,r.right,r.bottom].map(v=>Math.round(v*devicePixelRatio)));
 }
 const regions=rects.slice(0,64);
 const signature=JSON.stringify(regions),now=performance.now();
 if(signature!==lastRegions||now-lastRegionsAt>500){lastRegions=signature;lastRegionsAt=now;host.setHitRegions(regions);}
}
setInterval(publishDesktopRegions,125);
host?.onCommand(command=>{
 if(command==='host-hidden')suspendDesktop(true);
 if(command==='host-visible'&&desktopSuspended)suspendDesktop(false);
 if(command==='layer-top'||command==='layer-background'){
  passiveDesktop=command==='layer-background';holding=false;lastRegions='';lastRegionsAt=0;
  document.body.classList.toggle('passive-desktop',passiveDesktop);
  if(passiveDesktop){
   document.querySelector('dialog[open]')?.close();
   const t=performance.now();for(const c of cats)if(c.mode==='bubble'){
    c.el.classList.remove('in-bubble');c.air=true;c.vx=0;c.vy=0;c.stand=null;c.flight=null;setMode(c,'sit',t,2000);
   }
   setRoomControls(false);
  }
  if(!passiveDesktop)setRoomControls(true);
  publishDesktopRegions();
 }
 if(command==='controls'&&!passiveDesktop)setRoomControls(!document.body.classList.contains('controls-visible'));
 if(command==='rest')$('restBtn').click();
 if(command==='view')$('viewBtn').click();
 if(command==='wings')$('wingsBtn').click();
 if(command.startsWith('weather-'))setRoomWeather(command.slice(8));
 if(command==='friends')inviteRoomFriends();
 if(command==='motion')$('motionBtn').click();
 if(command==='background-on'||command==='background-off')setDesktopBackground(command==='background-on',false);
 updateDesktopHit();
});
// A permanent entry point in topmost mode does not depend on the taskbar being
// reachable through a topmost scene. Leave empty desktop pixels click-through.
const desktopMenuButton=document.createElement('button');
desktopMenuButton.id='desktopMenuButton';desktopMenuButton.textContent='☰ 메뉴';
desktopMenuButton.setAttribute('aria-label','고양이 메뉴 열기');
desktopMenuButton.onclick=()=>{setRoomControls(!document.body.classList.contains('controls-visible'));publishDesktopRegions();};
document.body.append(desktopMenuButton);
addEventListener('click',event=>{
 if(passiveDesktop||!event.target.closest('.cat'))return;
 const c=cats.find(c=>c.el.contains(event.target));
 if(c&&performance.now()<(c.ignoreClickUntil||0))return;
 setRoomControls(true);publishDesktopRegions();
});
const desktopSettings=document.createElement('button');desktopSettings.id='desktopSettings';desktopSettings.textContent='화면 설정';
desktopSettings.onclick=()=>host?.openSettings?.();$('roomControls').append(desktopSettings);
const desktopLayer=document.createElement('button');desktopLayer.id='desktopLayer';desktopLayer.textContent='배경 모드';
desktopLayer.onclick=()=>host?.setLayer?.(2);$('roomControls').append(desktopLayer);
const quit=document.createElement('button');quit.id='desktopQuit';quit.textContent='종료';quit.onclick=()=>host?.quit();$('roomControls').append(quit);
$('closeControls').textContent='메뉴 접기';
document.querySelector('.brand').textContent='바탕화면의 작은 친구들';
document.querySelector('.small-copy').textContent='고양이나 왼쪽 위 메뉴 버튼을 클릭하면 메뉴가 열려요.';
// Keep the user's choice in the host's persistent local profile.
const backgroundButton=document.createElement('button');backgroundButton.id='desktopBackground';
backgroundButton.onclick=()=>setDesktopBackground(!desktopBackground);
$('roomControls').insertBefore(backgroundButton,quit);
function setDesktopBackground(enabled,notify=true){
 desktopBackground=!!enabled;document.body.classList.toggle('desktop-background',desktopBackground);
 backgroundButton.textContent=desktopBackground?'배경 끄기':'배경 켜기';
 backgroundButton.setAttribute('aria-pressed',String(desktopBackground));
 $('viewBtn').hidden=!desktopBackground;
 try{localStorage.setItem('horibbangu-desktop-background',String(desktopBackground));}catch(e){}
 sceneDimensions=null;weatherDimensions=null;lastLakeFrame=-Infinity;lastWeatherFrame=-Infinity;
 if(!desktopBackground){
  const t=performance.now();
  for(const c of cats){
   if(c.sceneryGoal||['goScenery','scenery'].includes(c.mode)){
    leave(c,t);c.goal=null;c.edge=null;setMode(c,'sit',t,1500);
   }
  }
 }
 if(notify)host?.setBackground(desktopBackground);
 updateDesktopHit();
}
let savedBackground=false;
try{savedBackground=localStorage.getItem('horibbangu-desktop-background')==='true';}catch(e){}
setDesktopBackground(savedBackground);
setRoomControls(false);updateDesktopHit();
