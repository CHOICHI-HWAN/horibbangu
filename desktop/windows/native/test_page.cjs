const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');
 const context=browser.contexts()[0];
 const page=context.pages().find(p=>p.url().startsWith('https://horibbangu.local/'))||context.pages()[0];
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.waitForFunction(()=>window.desktopHost&&cats.length===8);
 await page.evaluate(()=>{setDesktopBackground(false);setRoomControls(false);});
 assert.equal(await page.locator('#recordsLink').count(),0);
 assert.equal(await page.locator('#windowsDownload').count(),0);
 assert.equal(await page.locator('#windowsStandalone').count(),0);
 assert.equal(await page.evaluate(()=>typeof require),'undefined');
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgba(0, 0, 0, 0)');
 const response=await page.evaluate(async()=>{try{return(await fetch('https://example.com/')).status;}catch{return 0;}});
 assert([0,403].includes(response));
 // Native commands are received via the exact same bridge used by tray actions.
 await page.evaluate(()=>chrome.webview.dispatchEvent(new MessageEvent('message',{data:'controls'})));
 assert(await page.locator('#desktopQuit').isVisible());
 await page.evaluate(()=>{setRoomControls(false);setDesktopBackground(true);});
 await page.waitForFunction(()=>lastLakeFrame>0);
 const frame=await page.evaluate(()=>lastLakeFrame);await page.waitForFunction(f=>lastLakeFrame>f+100,frame);
 await page.screenshot({path:'build/native-verification/background.png'});
 await page.reload();await page.waitForFunction(()=>desktopBackground&&cats.length===8);
 assert.equal(await page.evaluate(()=>localStorage.getItem('horibbangu-desktop-background')),'true');
 await page.evaluate(()=>setDesktopBackground(false));
 assert(await page.locator('#viewBtn').isHidden());
 const stopped=await page.evaluate(()=>lastLakeFrame);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>lastLakeFrame),stopped);
 // Put a stationary cat on a blank part of the desktop for the physical mouse test.
 await page.evaluate(()=>{cats.slice(1).forEach(c=>c.el.style.pointerEvents='none');const c=cats[0];c.x=200;c.y=80;c.air=false;c.mode='sit';c.until=1e12;renderCatPosition(c);});
 const box=await page.locator('.cat').first().boundingBox();
 fs.writeFileSync('build/native-verification/cat.json',JSON.stringify(box));
 assert.deepEqual(errors,[]);
 console.log('Offline cats, restricted renderer, background toggle/persistence and active/paused lake verified.');
 // Detach only; the Python harness continues with physical input and tray tests.
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
