const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../records.html'),'utf8');
const stored=new Map(),writes=[],batches=[];let rejectNext=false;
const ctx={
 state:{pets:[{id:'p1',name:'호야',color:'#fff'}],records:[],medications:[]},KEY:'test',medicationPending:{},
 snap:{pets:{},records:{}},pushing:false,pushTimer:null,synced:true,uploaded:false,unsubs:[],cloud:true,
 petsSnap:null,recsSnap:null,medicationsSnap:null,console:{error:()=>{}},
 localStorage:{setItem:(k,v)=>stored.set(k,v)},setStatus:()=>{},renderMedications:()=>{},renderAll:()=>{},
 setTimeout:()=>1,clearTimeout:()=>{},$ :()=>({hidden:false}),
 db:{collection:col=>({doc:id=>({col,id}),onSnapshot:()=>()=>{}}),batch:()=>{
  const operations=[];return {set:(ref,data)=>operations.push({ref,data:structuredClone(data)}),delete:ref=>operations.push({ref,data:null}),commit:()=>{
   writes.push(...operations);let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});batches.push({resolve,reject,operations});
   if(rejectNext){rejectNext=false;reject(new Error('offline'));}return promise;
  }};
 }}
};
vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('function persistMedicationPending()'),source.indexOf('function validMedication('))+source.slice(source.indexOf('const petRow ='),source.indexOf('let snap ='))+source.slice(source.indexOf('function takeSnap()'),source.indexOf('function showLogin()')),ctx);
const run=code=>vm.runInContext(code,ctx);
const row=(date,note)=>({id:'chemo-p1-'+date,petId:'p1',petName:'호야',date,time:'10:00',outcome:'given',medicine:'처방약 A',dose:'처방전 기재량',note});
const snapshot=rows=>({docs:rows.map(r=>({id:r.id,data:()=>r})),metadata:{fromCache:false,hasPendingWrites:false},empty:rows.length===0});
(async()=>{
 run('takeSnap()');const a=row('2026-11-02','first');ctx.a=a;run('queueMedication(a)');ctx.state.medications=[a];
 ctx.medicationsSnap=snapshot([]);run('applyMedicationRemote()');assert.equal(ctx.state.medications[0].note,'first','Empty remote snapshot must preserve an unsent dose');
 const first=run('push()');const b={...a,note:'edited while saving'};ctx.b=b;run('queueMedication(b)');
 const other=row('2026-10-30','other caregiver');ctx.medicationsSnap=snapshot([other]);run('applyMedicationRemote()');
 assert.equal(ctx.state.medications.length,2);assert.equal(ctx.state.medications.find(r=>r.id===a.id).note,b.note);
 batches[0].resolve();await first;
 assert.equal(ctx.medicationPending[a.id].note,b.note,'First acknowledgment must not discard a newer edit');
 ctx.medicationsSnap=snapshot([a,other]);run('applyMedicationRemote()');assert.equal(ctx.state.medications.find(r=>r.id===a.id).note,b.note);
 const second=run('push()');batches[1].resolve();await second;
 assert.equal(Object.keys(ctx.medicationPending).length,0);assert.equal(writes.length,2);
 assert(writes.every(w=>w.ref.col==='medications'),'Medication-only saves must not rewrite weight data');
 assert.equal(writes[0].data.note,'first');assert.equal(writes[1].data.note,b.note);
 ctx.id=a.id;run('queueMedication(null,id)');ctx.state.medications=[other];ctx.medicationsSnap=snapshot([b,other]);run('applyMedicationRemote()');
 assert.deepEqual(Array.from(ctx.state.medications,r=>r.id),[other.id],'Pending delete must not be resurrected by an old snapshot');
 rejectNext=true;await run('push()');assert.equal(ctx.medicationPending[a.id],null);assert.equal(JSON.parse(stored.get('test:med-pending'))[a.id],null,'Failed delete must remain durable');
 const retry=run('push()');batches.at(-1).resolve();await retry;assert.equal(Object.keys(ctx.medicationPending).length,0);
 ctx.medicationsSnap=snapshot([other]);run('applyMedicationRemote()');assert.equal(ctx.state.medications.length,1);
 run('stopSync()');assert.equal(ctx.medicationsSnap,null);assert.equal(ctx.pushTimer,null);
 console.log('Medication sync preserves offline edits, edits during in-flight commits, caregiver additions and pending deletes; failed writes remain durable; weight rows stay unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1});
