"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    console.log("ipcRenderer.on", channel);
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  },
  // You can expose other APTs you need here.
  // ...
  // nodeParams: {
  //   arch: process.arch,
  //   env: process.env,
  //   pid: process.pid,
  //   title: process.title,
  //   version: process.version,
  //   platform: process.platform,
  //   __dirname
  // },
  nodeParams: {
    dirname: __dirname,
    filename: __filename
  },
  nodeModules: {
    fs: require("fs"),
    path: require("path"),
    fsExtra: require("fs-extra")
  }
});
window.addEventListener("DOMContentLoaded", () => {
  console.log("process1222------------------", process);
});
