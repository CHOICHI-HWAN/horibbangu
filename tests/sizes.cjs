const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const b=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
  const p=await b.newPage();
  await p.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='hori.test')return route.abort();
   const file=path.join(__dirname,'..',url.pathname==='/'?'index.html':url.pathname.slice(1));
   return route.fulfill({status:200,body:fs.readFileSync(file),contentType:file.endsWith('.css')?'text/css':'text/html'});
  });
  await p.goto('https://hori.test/records.html');
  const result=await p.evaluate(()=>{
   const roy=cats.find(c=>c.name==='로이').scale,dongle=cats.find(c=>c.name==='동글이').scale;
   state.records.push({id:'size-check',date:'2099-01-01',w:{p1:10,p5:100}});renderCats();
   return{hoya:cats.find(c=>c.name==='호야').scale,royStable:cats.find(c=>c.name==='로이').scale===roy,dongleStable:cats.find(c=>c.name==='동글이').scale===dongle,cache:JSON.parse(localStorage.getItem('horibbangu-cat-sizes-v1'))};
  });
  assert(Math.abs(result.hoya-Math.cbrt(2))<1e-10);assert(result.royStable&&result.dongleStable);assert(result.cache['호야']===result.hoya);
  await p.goto('https://hori.test/index.html');
  const room=await p.evaluate(()=>({scale:cats.find(c=>c.name==='호야').scale,noRecords:!('records'in state)}));
  assert.equal(room.scale,result.hoya);assert(room.noRecords);console.log('Latest weight updates size and transfers only visual scales to the public room; memorial sizes stay fixed.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
