// Hit testing keeps the desktop usable through every empty transparent pixel.
const host=window.desktopHost;
// Hoisted because initRoom runs the shared clock before this overlay initializes.
var desktopSuspended=false;
// Drive the original CSS keyframes and transitions from the same modest frame
// clock as the cats. Otherwise every SVG keeps the compositor busy at 60–144 Hz.
const desktopAnimations=new Map();
let desktopAnimationsDirty=true,lastDesktopAnimationTime=null;
new MutationObserver(()=>{desktopAnimationsDirty=true;}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-motion']});
for(const type of ['animationstart','transitionrun'])document.addEventListener(type,()=>{desktopAnimationsDirty=true;});
document.addEventListener('visibilitychange',()=>{lastDesktopAnimationTime=null;desktopAnimationsDirty=true;});
function tickDesktopAnimations(t){
 const dt=lastDesktopAnimationTime===null?0:Math.min(100,t-lastDesktopAnimationTime);lastDesktopAnimationTime=t;
 if(document.hidden||desktopSuspended||reduceMotion)return;
 if(desktopAnimationsDirty){
  desktopAnimationsDirty=false;
  for(const animation of document.getAnimations())if(!desktopAnimations.has(animation)&&animation.playState==='running'){
   const time=animation.currentTime??0;
   animation.pause();animation.currentTime=time;
   desktopAnimations.set(animation,{time,added:t});
  }
 }
 for(const [animation,state] of desktopAnimations){
  if(animation.playState==='idle'||!animation.effect?.target?.isConnected){desktopAnimations.delete(animation);continue;}
  const time=state.time+(state.added===t?0:dt*animation.playbackRate),end=animation.effect.getComputedTiming().endTime;
  if(Number.isFinite(end)&&time>=end){animation.finish();desktopAnimations.delete(animation);}
  else {animation.currentTime=time;state.time=time;}
 }
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
 const controls=modal?[modal]:document.body.classList.contains('controls-visible')?document.querySelectorAll('button,a,select'):[];
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
 if(command==='host-hidden')desktopSuspended=true;
 if(command==='host-visible'&&desktopSuspended){desktopSuspended=false;lastDesktopAnimationTime=null;lastT=performance.now();queueCatFrame();updateRoomTime();}
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
const quit=document.createElement('button');quit.id='desktopQuit';quit.textContent='종료';quit.onclick=()=>host?.quit();$('roomControls').append(quit);
$('closeControls').textContent='메뉴 접기';
document.querySelector('.brand').textContent='바탕화면의 작은 친구들';
document.querySelector('.small-copy').textContent='트레이의 고양이 아이콘에서 메뉴를 열 수 있어요.';
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
