// Keep one CDP connection while exercising physical Win32 input.
const {chromium}=require('playwright');
const readline=require('node:readline');
(async()=>{
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('https://horibbangu.local/'));
 try{
  for await (const line of readline.createInterface({input:process.stdin})){
   try{
    const result=await page.evaluate(JSON.parse(line));
    await page.waitForTimeout(75); // Let the native message handler receive asynchronous IPC.
    process.stdout.write(JSON.stringify({ok:true,result:result??null})+'\n');
   }catch(error){process.stdout.write(JSON.stringify({ok:false,error:String(error)})+'\n');}
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
