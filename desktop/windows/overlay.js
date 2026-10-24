// Hit testing keeps the desktop usable through every empty transparent pixel.
const host=window.desktopHost;
const passiveDesktop=host?.passive===true;
if(passiveDesktop)document.body.classList.add("passive-desktop");
let holding=false,lastInteractive=null,lastHitRect='',lastPointer={x:-1,y:-1};
function updateDesktopHit(x=lastPointer.x,y=lastPointer.y){
 if(passiveDesktop)return;
 lastPointer={x,y};
 const target=document.elementFromPoint(x,y);
 const hit=target?.closest('.cat,button,a,select');
 const interactive=holding||!!hit;
 const box=hit?.getBoundingClientRect();
 const rect=box?[box.left,box.top,box.right,box.bottom].map(value=>Math.round(value*devicePixelRatio)):null;
 const signature=rect?.join(',')||'';
 if(interactive!==lastInteractive||signature!==lastHitRect){lastInteractive=interactive;lastHitRect=signature;host?.setInteractive(interactive,rect);}
}
if(!passiveDesktop){
addEventListener('mousemove',event=>updateDesktopHit(event.clientX,event.clientY));
addEventListener('pointerdown',event=>{if(event.button===0&&event.target.closest('.cat'))holding=true;updateDesktopHit(event.clientX,event.clientY);},true);
for(const type of ['pointerup','pointercancel','lostpointercapture'])addEventListener(type,event=>{holding=false;updateDesktopHit(event.clientX,event.clientY);},true);
addEventListener('blur',()=>{holding=false;host?.setInteractive(false);lastInteractive=false;});
// Cats can move away from the pointer without another native mouse message.
setInterval(()=>updateDesktopHit(),120);
}
host?.onCommand(command=>{
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
 sceneDimensions=null;lastLakeFrame=-Infinity;lastWeatherFrame=-Infinity;
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
