const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../records.html'),'utf8');
const clock=source.slice(source.indexOf('let catFramePending='),source.indexOf('function tickCats(t)'));
function scenario(hz,jitter=false){
 let pending=[],ticks=[];
 const ctx=vm.createContext({desktopSuspended:false,requestAnimationFrame:fn=>pending.push(fn),tickCats:t=>{ticks.push(t);vm.runInContext('queueCatFrame()',ctx);}});
 vm.runInContext(clock+'queueCatFrame();queueCatFrame();',ctx);
 let t=0;
 const frame=time=>{assert(pending.length<=1,'Duplicate animation loop');const callbacks=pending;pending=[];callbacks.forEach(fn=>fn(time));};
 while(t<5000){t+=1000/hz+(jitter?Math.sin(t)*.9:0);frame(t);}
 const fps=(ticks.length-1)*1000/(ticks.at(-1)-ticks[0]);
 assert(fps>58&&fps<61,`${hz} Hz cadence: ${fps}`);
 ctx.desktopSuspended=true;frame(t+=100);assert.equal(pending.length,0);
 const n=ticks.length;ctx.desktopSuspended=false;vm.runInContext('queueCatFrame();queueCatFrame();',ctx);frame(t+=3600000);
 assert.equal(ticks.length,n+1,'A stall must not replay old frames');assert.equal(pending.length,1);
 console.log(`${hz} Hz${jitter?' with jitter':''}: ${fps.toFixed(2)} fps, single loop and no catch-up backlog`);
}
for(const hz of [60,120,144,240]){scenario(hz);scenario(hz,true);}
