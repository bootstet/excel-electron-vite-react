"use strict";const o=require("electron");o.contextBridge.exposeInMainWorld("ipcRenderer",{on(...n){const[e,r]=n;return console.log("ipcRenderer.on",e),o.ipcRenderer.on(e,(i,...t)=>r(i,...t))},off(...n){const[e,...r]=n;return o.ipcRenderer.off(e,...r)},send(...n){const[e,...r]=n;return o.ipcRenderer.send(e,...r)},invoke(...n){const[e,...r]=n;return o.ipcRenderer.invoke(e,...r)},nodeParams:{dirname:__dirname,filename:__filename},nodeModules:{fs:require("fs"),path:require("path")}});window.addEventListener("DOMContentLoaded",()=>{console.log("process1222------------------",process)});
