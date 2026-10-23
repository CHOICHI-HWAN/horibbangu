// Hit testing keeps the desktop usable through every empty transparent pixel.
const host=window.desktopHost;
let holding=false,lastInteractive=null,lastPointer={x:-1,y:-1};
function updateDesktopHit(x=lastPointer.x,y=lastPointer.y){
 lastPointer={x,y};
 const target=document.elementFromPoint(x,y);
 const interactive=holding||!!target?.closest('.cat,button,a,select');
 if(interactive!==lastInteractive){lastInteractive=interactive;host?.setInteractive(interactive);}
}
addEventListener('mousemove',event=>updateDesktopHit(event.clientX,event.clientY));
addEventListener('pointerdown',event=>{if(event.button===0&&event.target.closest('.cat'))holding=true;updateDesktopHit(event.clientX,event.clientY);},true);
for(const type of ['pointerup','pointercancel','lostpointercapture'])addEventListener(type,event=>{holding=false;updateDesktopHit(event.clientX,event.clientY);},true);
addEventListener('blur',()=>{holding=false;host?.setInteractive(false);lastInteractive=false;});
// Cats can move away from the pointer without another native mouse message.
setInterval(()=>updateDesktopHit(),120);
host?.onCommand(command=>{
 if(command==='controls')setRoomControls(!document.body.classList.contains('controls-visible'));
 if(command==='friends')inviteRoomFriends();
 if(command==='motion')$('motionBtn').click();
 updateDesktopHit();
});
const quit=document.createElement('button');quit.id='desktopQuit';quit.textContent='종료';quit.onclick=()=>host?.quit();$('roomControls').append(quit);
$('closeControls').textContent='메뉴 접기';
document.querySelector('.brand').textContent='바탕화면의 작은 친구들';
document.querySelector('.small-copy').textContent='트레이의 고양이 아이콘에서 메뉴를 열 수 있어요.';
// No lake in desktop mode, so cats keep their play, rest and wheel habits.
$('viewBtn').hidden=true;
setRoomControls(false);updateDesktopHit();
