import { ipcRenderer, contextBridge } from 'electron'
import path from 'node:path'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

const childProcess = require('child_process')
const exec = childProcess.exec
let openExec

// openExec = exec(`node ${path.join(process.env.APP_ROOT, 'service')}`, function(error: any, stdout: any, stderr: any) {
//   if (error) {
//     console.log('service error =>:', error.stack)
//     console.log('Error code: ' + error.code);
//     return;
//   }
//   console.log('使用exec方法输出: ' + stdout);
//   console.log(`stderr: ${stderr}`);
//   console.log(process.pid)
// })
