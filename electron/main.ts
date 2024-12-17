import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dirname = path.dirname(fileURLToPath(import.meta.url))


// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
console.log('process.env', `node ${path.join(process.env.APP_ROOT, 'service/index.js')}`)

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null



function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: true, // 隔离
      contextIsolation: true, // 渲染进程是否使用node
      webSecurity: false // 是否禁用安全策略
    },
  })

  // win.webContents.openDevTools()
  if (__dirname.split(path.sep).indexOf("app.asar")>=0){
    //production
  } else {
    //development
    win.webContents.openDevTools()
  }

  // Test active push message to Renderer-process. 主进程渲染消息
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
    //打开 DevTools
    // win.webContents.openDevTools();
}


// 接受渲染进程的消息
ipcMain.on('renderer-process-message', (event, message) => {
  console.log('message', decodeURIComponent(message))
})
// 渲染进程向主进程发送消息并异步等待结果，主进程接受
ipcMain.handle('renderer-process-message', async (event, message) => {
  console.log('message', decodeURIComponent(message))
  console.log('event', event)
})

ipcMain.on('openWindow',(ev,target)=>{
  // const newWin = new BrowserWindow({
  //   width: 600,
  //   height: 400,
  // });
  // newWin.loadURL('https://wwww.baidu.com');
  dialog.showOpenDialog(win, {
    properties: ['openFile', 'openDirectory'] // 可选属性，用于指定打开文件还是目录
  }).then(result => {
    if (!result.canceled) {
      console.log('选定的文件路径:', result.filePaths);
      win?.webContents.send('choose-path', result.filePaths)
    }
  });
})


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})


app.commandLine.appendSwitch('ingore-certificate-errors')


app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('browser-window-created', (_, window) => {
  require("@electron/remote/main").enable(window.webContents)
})

app.whenReady().then(createWindow)
