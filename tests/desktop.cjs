const assert=require('node:assert/strict'),path=require('node:path');
const{_electron}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const app=await _electron.launch({executablePath:process.env.ELECTRON_EXECUTABLE,args:[process.env.HORI_DESKTOP_APP||path.join(__dirname,'../desktop/windows')],env:{...process.env,HORIBBANGU_DESKTOP_TEST:'1'}});
 try{
  const page=await app.firstWindow();await page.waitForFunction(()=>window.desktopHost&&document.querySelectorAll('.cat').length===8);await page.evaluate(()=>setDesktopBackground(false));
  const native=await app.evaluate(({BrowserWindow,screen})=>{const w=BrowserWindow.getAllWindows()[0],prefs=w.webContents.getLastWebPreferences();return{background:w.getBackgroundColor(),resize:w.isResizable(),shadow:w.hasShadow(),top:w.isAlwaysOnTop(),bounds:w.getBounds(),work:screen.getPrimaryDisplay().workArea,isolated:prefs.contextIsolation,sandbox:prefs.sandbox,node:prefs.nodeIntegration};});
  assert(['#00000000','#000000'].includes(native.background));assert(!native.resize&&!native.shadow&&!native.top&&native.isolated&&native.sandbox&&!native.node);assert.deepEqual(native.bounds,native.work);
  const view=await page.evaluate(()=>({background:getComputedStyle(document.body).backgroundColor,room:getComputedStyle(document.querySelector('.room')).backgroundColor,lake:!!document.getElementById('landscape'),floor:!!document.querySelector('.floor'),records:!!document.getElementById('recordsLink'),download:!!document.getElementById('windowsDownload'),node:typeof require,scenery:chooseRoomScenery(cats[0],performance.now()),count:cats.length}));
  assert.equal(view.background,'rgba(0, 0, 0, 0)');assert.equal(view.room,'rgba(0, 0, 0, 0)');assert(view.lake&&view.floor&&!view.records&&!view.download&&!view.scenery);assert.equal(view.node,'undefined');assert.equal(view.count,8);
  await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];w.testIgnore=[];const original=w.setIgnoreMouseEvents.bind(w);w.setIgnoreMouseEvents=(...args)=>{w.testIgnore.push(args[0]);return original(...args);};});
  await page.evaluate(()=>window.desktopHost.setInteractive(true));await page.waitForTimeout(50);await page.evaluate(()=>window.desktopHost.setInteractive(false));await page.waitForTimeout(50);
  const ignore=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].testIgnore);assert(ignore.includes(true)&&ignore.includes(false));
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.send('desktop:command','controls'));
  assert(await page.locator('#desktopQuit').isVisible());assert(await page.locator('#viewBtn').isHidden());
  await page.evaluate(()=>setRoomControls(false));await page.screenshot({path:'/tmp/horibbangu-transparent-desktop.png',omitBackground:true});
  // The room button and tray commands share a persisted background choice.
  await page.evaluate(()=>setRoomControls(true));
  await page.locator('#desktopBackground').click();
  await page.waitForFunction(()=>desktopBackground&&lastLakeFrame>0);
  assert(await page.locator('#landscape').isVisible());assert(await page.locator('.floor').isVisible());assert(await page.locator('#viewBtn').isVisible());
  assert.notEqual(await page.evaluate(()=>getComputedStyle(document.querySelector('.room')).backgroundColor),'rgba(0, 0, 0, 0)');
  // A hidden native test window may suspend compositor frames even with throttling off.
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].showInactive());
  const before=await page.evaluate(()=>lastLakeFrame);await page.waitForFunction(t=>lastLakeFrame>t+100,before,{timeout:5000});
  await page.screenshot({path:'/tmp/horibbangu-desktop-background.png'});
  // Portable EXEs unpack to a different path on each launch. Verify the profile
  // choice also survives a relocated file URL, rather than just a page reload.
  const fs=require('node:fs'),relocated=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'horibbangu-background-test-'));
  const original=process.env.HORI_DESKTOP_APP||path.join(__dirname,'../desktop/windows');
  for(const file of ['playground.html','playground.js'])fs.copyFileSync(path.join(original,file),path.join(relocated,file));
  await app.evaluate(async({BrowserWindow},file)=>{await BrowserWindow.getAllWindows()[0].loadFile(file);},path.join(relocated,'playground.html'));
  await page.waitForFunction(()=>desktopBackground&&lastLakeFrame>0);
  require('node:fs').rmSync(relocated,{recursive:true,force:true});
  assert.equal(await page.evaluate(()=>localStorage.getItem('horibbangu-desktop-background')),'true');
  assert(await page.evaluate(()=>{const c=cats[0];c.air=false;c.mode='watch';c.x=200;c.y=0;c.stand=GROUND;return chooseRoomScenery(c,performance.now());}));
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.send('desktop:command','background-off'));
  await page.waitForFunction(()=>!desktopBackground);
  assert(await page.locator('#landscape').isHidden());assert(await page.locator('#viewBtn').isHidden());
  const offFrame=await page.evaluate(()=>lastLakeFrame);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>lastLakeFrame),offFrame);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.room'),'::after').display),'none');
  assert.equal(await page.evaluate(()=>localStorage.getItem('horibbangu-desktop-background')),'false');
  assert(await page.evaluate(()=>cats.every(c=>!c.sceneryGoal&&!['goScenery','scenery'].includes(c.mode))));
  // Retain bubble dragging even while the empty surface remains click-through.
  await page.evaluate(()=>{cats.slice(1).forEach(c=>c.el.style.pointerEvents='none');const c=cats[0];c.x=200;c.y=80;c.air=false;c.mode='sit';c.until=1e12;renderCatPosition(c);});
  const box=await page.locator('.cat').first().boundingBox();await page.mouse.move(box.x+32,box.y+20);await page.mouse.down();await page.mouse.move(box.x+140,box.y-90,{steps:8});assert(await page.evaluate(()=>cats[0].mode==='bubble'));await page.mouse.up();assert(await page.evaluate(()=>cats[0].mode!=='bubble'));
  console.log('Native transparent window, bounds, isolated preload, click-through IPC, tray commands, background toggle/persistence/animation pause and cat drag passed.');
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
