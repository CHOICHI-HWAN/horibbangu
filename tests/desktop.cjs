const assert=require('node:assert/strict'),path=require('node:path');
const{_electron}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const app=await _electron.launch({executablePath:process.env.ELECTRON_EXECUTABLE,args:[path.join(__dirname,'../desktop/windows')],env:{...process.env,HORIBBANGU_DESKTOP_TEST:'1'}});
 try{
  const page=await app.firstWindow();await page.waitForFunction(()=>window.desktopHost&&document.querySelectorAll('.cat').length===8);
  const native=await app.evaluate(({BrowserWindow,screen})=>{const w=BrowserWindow.getAllWindows()[0],prefs=w.webContents.getLastWebPreferences();return{background:w.getBackgroundColor(),resize:w.isResizable(),shadow:w.hasShadow(),top:w.isAlwaysOnTop(),bounds:w.getBounds(),work:screen.getPrimaryDisplay().workArea,isolated:prefs.contextIsolation,sandbox:prefs.sandbox,node:prefs.nodeIntegration};});
  assert(['#00000000','#000000'].includes(native.background));assert(!native.resize&&!native.shadow&&!native.top&&native.isolated&&native.sandbox&&!native.node);assert.deepEqual(native.bounds,native.work);
  const view=await page.evaluate(()=>({background:getComputedStyle(document.body).backgroundColor,room:getComputedStyle(document.querySelector('.room')).backgroundColor,lake:!!document.getElementById('landscape'),floor:!!document.querySelector('.floor'),records:!!document.getElementById('recordsLink'),download:!!document.getElementById('windowsDownload'),node:typeof require,scenery:chooseRoomScenery(cats[0],performance.now()),count:cats.length}));
  assert.equal(view.background,'rgba(0, 0, 0, 0)');assert.equal(view.room,'rgba(0, 0, 0, 0)');assert(!view.lake&&!view.floor&&!view.records&&!view.download&&!view.scenery);assert.equal(view.node,'undefined');assert.equal(view.count,8);
  await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];w.testIgnore=[];const original=w.setIgnoreMouseEvents.bind(w);w.setIgnoreMouseEvents=(...args)=>{w.testIgnore.push(args[0]);return original(...args);};});
  await page.evaluate(()=>window.desktopHost.setInteractive(true));await page.waitForTimeout(50);await page.evaluate(()=>window.desktopHost.setInteractive(false));await page.waitForTimeout(50);
  const ignore=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].testIgnore);assert(ignore.includes(true)&&ignore.includes(false));
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.send('desktop:command','controls'));
  assert(await page.locator('#desktopQuit').isVisible());assert(await page.locator('#viewBtn').isHidden());
  await page.evaluate(()=>setRoomControls(false));await page.screenshot({path:'/tmp/horibbangu-transparent-desktop.png',omitBackground:true});
  // Retain bubble dragging even while the empty surface remains click-through.
  await page.evaluate(()=>{cats.slice(1).forEach(c=>c.el.style.pointerEvents='none');const c=cats[0];c.x=200;c.y=80;c.air=false;c.mode='sit';c.until=1e12;renderCatPosition(c);});
  const box=await page.locator('.cat').first().boundingBox();await page.mouse.move(box.x+32,box.y+20);await page.mouse.down();await page.mouse.move(box.x+140,box.y-90,{steps:8});assert(await page.evaluate(()=>cats[0].mode==='bubble'));await page.mouse.up();assert(await page.evaluate(()=>cats[0].mode!=='bubble'));
  console.log('Native transparent window, bounds, isolated preload, click-through IPC, tray commands, no lake and cat drag passed.');
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
