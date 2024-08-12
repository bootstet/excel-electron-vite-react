import { app, BrowserWindow } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const childProcess = require('child_process')
const exec = childProcess.exec
let openExec

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
      nodeIntegration: true,
      contextIsolation: false
    },
  })

  // Test active push message to Renderer-process.
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
    win.webContents.openDevTools();
}

// 创建子进程，直接打开service/index.js
console.log('openExec', openExec)
openExec = exec(`node ${path.join(process.env.APP_ROOT, 'service')}`, function(error: any, stdout: any, stderr: any) {
  console.log('stderr', stderr)
  console.log('stdout', stdout)
  if (error) {
    console.log('service error =>:', error.stack)
    console.log('Error code: ' + error.code);
    return;
  }
  console.log('使用exec方法输出: ' + stdout);
  console.log(`stderr: ${stderr}`);
  console.log(process.pid)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
  // 判断openExec是否存在，存在就杀掉node进程
  if (!openExec) {
    console.log('openExec is null')
  } else {
    console.log('=================')
    exec('taskkill /f /t /im node.exe', function (error, stdout, stderr) {
      if (error) {
        console.log('=============', error.stack);
        console.log('Error code: ' + error.code);
        return;
      }
      console.log('使用exec方法输出: ' + stdout);
      console.log(`stderr: ${stderr}`);
    });
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

app.whenReady().then(createWindow)
