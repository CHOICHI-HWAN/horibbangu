// Exercise the real sync functions with a delayed first Firestore commit.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../records.html'),'utf8');
let releaseFirst;const writes=[];let commits=0;
const context={
 state:{pets:[],records:[{id:'r',date:'2026-10-22',w:{p:5}}]},snap:{pets:{},records:{}},pushing:false,pushTimer:null,
 cloud:true,synced:true,setStatus:()=>{},console,setTimeout:()=>1,clearTimeout:()=>{},
 db:{collection:()=>({doc:id=>id}),batch:()=>({set:(ref,data)=>writes.push(JSON.parse(JSON.stringify(data))),delete:()=>{},commit:()=>++commits===1?new Promise(r=>releaseFirst=r):Promise.resolve()})}
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('const petRow ='),source.indexOf('let snap ='))+source.slice(source.indexOf('function takeSnap()'),source.indexOf('// 서버 변경이')),context);
(async()=>{
 const pending=vm.runInContext('push()',context);
 context.state.records[0].w.p=6;vm.runInContext('schedulePush()',context);
 releaseFirst();await pending;
 assert.equal(JSON.parse(context.snap.records.r).w.p,5,'Only the committed value may become the sync baseline');
 await vm.runInContext('push()',context);
 assert.equal(writes.length,2);assert.equal(writes[0].w.p,5);assert.equal(writes[1].w.p,6);assert.equal(JSON.parse(context.snap.records.r).w.p,6);
 console.log('Saving another edit during an in-flight commit preserves both writes.');
})().catch(e=>{console.error(e);process.exitCode=1});
