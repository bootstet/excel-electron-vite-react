"use strict";
const electron = require("electron");
const archiver = require("archiver");
const fs = require("fs");
const generatePackage = (zipName, url) => {
  return new Promise((resolve, reject) => {
    try {
      const output = fs.createWriteStream(zipName);
      const archive = archiver("zip", {
        zlib: { level: 9 }
        // 设置压缩级别
      });
      console.log("archive", archive);
      archive.on("error", function(err) {
        throw err;
      });
      archive.pipe(output);
      archive.directory(url, false);
      archive.finalize();
      output.on("close", function() {
        console.log(archive.pointer() + " total bytes");
        console.log("archiver has been finalized and the output file descriptor has closed.");
        resolve("success");
      });
      output.on("finish", function() {
        console.log("The file has been finalized and the output file descriptor has finseed.");
      });
    } catch (error) {
      reject(error);
    }
  });
};
function emptyDir(pathName) {
  console.log("fs", fs);
  const files = fs.readdirSync(pathName);
  files.forEach((file) => {
    const filePath = `${pathName}/${file}`;
    console.log("filePath", filePath);
    const stats = fs.statSync(filePath);
    console.log("stats", stats);
    if (fs.lstatSync(filePath).isDirectory()) {
      emptyDir(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  });
}
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
    fsExtra: require("fs-extra"),
    archiver: require("archiver"),
    generatePackage,
    cwd: process.cwd,
    emptyDir
  }
});
window.addEventListener("DOMContentLoaded", () => {
  console.log("process1222------------------", process);
});
