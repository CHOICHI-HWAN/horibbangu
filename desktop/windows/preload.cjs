'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktopHost',{
 setInteractive:value=>{if(typeof value==='boolean')ipcRenderer.send('desktop:pointer',value);},
 quit:()=>ipcRenderer.send('desktop:quit'),
 onCommand:callback=>{if(typeof callback==='function')ipcRenderer.on('desktop:command',(_event,command)=>{if(['controls','friends','motion'].includes(command))callback(command);});}
});
