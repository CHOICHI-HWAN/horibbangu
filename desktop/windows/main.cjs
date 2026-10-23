'use strict';
const {app,BrowserWindow,Tray,Menu,ipcMain,screen,globalShortcut,session,nativeImage}=require('electron');
const path=require('node:path');
let win,tray,interactive=false,background=false;
const testing=process.env.HORIBBANGU_DESKTOP_TEST==='1';
app.setName('호리빵구');
app.commandLine.appendSwitch('lang','ko');
app.setPath('userData',testing?path.join(app.getPath('temp'),'HoribbanguDesktopTest'):path.join(app.getPath('appData'),'HoribbanguDesktop'));
function send(command){if(win&&!win.isDestroyed())win.webContents.send('desktop:command',command);}
function showControls(){if(win&&!win.isDestroyed()){win.showInactive();send('controls');}}
function setBackground(value){background=value;send(value?'background-on':'background-off');updateTray();}
function updateTray(){
 if(!tray||!win||win.isDestroyed())return;
 tray.setContextMenu(Menu.buildFromTemplate([
  {label:'고양이 메뉴 열기 / 접기',click:showControls},
  {label:'잠깐 숨기기',type:'checkbox',checked:!win.isVisible(),click:item=>item.checked?win.hide():win.showInactive()},
  {label:'호수 배경 보이기',type:'checkbox',checked:background,click:item=>setBackground(item.checked)},
  {label:'항상 위에',type:'checkbox',checked:win.isAlwaysOnTop(),click:item=>{win.setAlwaysOnTop(item.checked);updateTray();}},
  {type:'separator'},
  {label:'친구 초대',click:()=>send('friends')},
  {label:'움직임 켜기 / 쉬기',click:()=>send('motion')},
  {type:'separator'},
  {label:'종료',accelerator:'Ctrl+Alt+Q',click:()=>app.quit()}
 ]));
}
async function start(){
 session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
 session.defaultSession.setPermissionCheckHandler(()=>false);
 session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(_details,callback)=>callback({cancel:true}));
 win=new BrowserWindow({...screen.getPrimaryDisplay().workArea,
  title:'호리빵구 · 바탕화면 친구들',frame:false,transparent:true,backgroundColor:'#00000000',
  hasShadow:false,resizable:false,maximizable:false,minimizable:false,fullscreenable:false,
  skipTaskbar:true,show:false,alwaysOnTop:false,autoHideMenuBar:true,
  icon:path.join(__dirname,'tray.png'),
  webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,v8CacheOptions:'code',backgroundThrottling:!testing}
 });
 win.setMenu(null);
 win.setIgnoreMouseEvents(true,{forward:true});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',event=>event.preventDefault());
 win.webContents.on('context-menu',()=>{if(tray)tray.popUpContextMenu();});
 ipcMain.on('desktop:pointer',(event,value)=>{
  if(!win||win.isDestroyed()||event.sender!==win.webContents||typeof value!=='boolean'||value===interactive)return;
  interactive=value;win.setIgnoreMouseEvents(!value,{forward:true});
 });
 ipcMain.on('desktop:background',(event,value)=>{if(win&&!win.isDestroyed()&&event.sender===win.webContents&&typeof value==='boolean')setBackground(value);});
 ipcMain.on('desktop:quit',event=>{if(win&&!win.isDestroyed()&&event.sender===win.webContents)app.quit();});
 if(!testing){
  tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'tray.png')).resize({width:24,height:24}));
  tray.setToolTip('호리빵구 · 클릭하면 메뉴, 오른쪽 클릭하면 종료');
  tray.on('click',showControls);updateTray();
  win.on('show',()=>updateTray());win.on('hide',()=>updateTray());
  globalShortcut.register('Control+Alt+H',showControls);
  globalShortcut.register('Control+Alt+Q',()=>app.quit());
 }
 screen.on('display-metrics-changed',()=>{if(win&&!win.isDestroyed())win.setBounds(screen.getPrimaryDisplay().workArea);});
 await win.loadFile(path.join(__dirname,'playground.html'));
 if(!testing)win.showInactive();
}
if(!app.requestSingleInstanceLock())app.quit();
else {app.on('second-instance',showControls);app.whenReady().then(start).catch(error=>{console.error(error.message);app.quit();});}
app.on('window-all-closed',()=>app.quit());
app.on('will-quit',()=>globalShortcut.unregisterAll());
