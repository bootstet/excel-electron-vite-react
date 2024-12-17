"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const node_url = require("node:url");
const path = require("node:path");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
path.dirname(node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.src || new URL("main.js", document.baseURI).href));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
console.log("process.env", `node ${path.join(process.env.APP_ROOT, "service/index.js")}`);
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      nodeIntegration: true,
      // 隔离
      contextIsolation: true,
      // 渲染进程是否使用node
      webSecurity: false
      // 是否禁用安全策略
    }
  });
  if (__dirname.split(path.sep).indexOf("app.asar") >= 0) ;
  else {
    win.webContents.openDevTools();
  }
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
electron.ipcMain.on("renderer-process-message", (event, message) => {
  console.log("message", decodeURIComponent(message));
});
electron.ipcMain.handle("renderer-process-message", async (event, message) => {
  console.log("message", decodeURIComponent(message));
  console.log("event", event);
});
electron.ipcMain.on("openWindow", (ev, target) => {
  electron.dialog.showOpenDialog(win, {
    properties: ["openFile", "openDirectory"]
    // 可选属性，用于指定打开文件还是目录
  }).then((result) => {
    if (!result.canceled) {
      console.log("选定的文件路径:", result.filePaths);
      win == null ? void 0 : win.webContents.send("choose-path", result.filePaths);
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
    win = null;
  }
});
electron.app.commandLine.appendSwitch("ingore-certificate-errors");
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
electron.app.on("browser-window-created", (_, window) => {
  require("@electron/remote/main").enable(window.webContents);
});
electron.app.whenReady().then(createWindow);
exports.MAIN_DIST = MAIN_DIST;
exports.RENDERER_DIST = RENDERER_DIST;
exports.VITE_DEV_SERVER_URL = VITE_DEV_SERVER_URL;
