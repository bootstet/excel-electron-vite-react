import { ipcRenderer, contextBridge } from 'electron'


// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    console.log('ipcRenderer.on', channel)
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
    filename: __filename,
  },
  nodeModules: {
    fs: require('fs'),
    path: require('path'),
  }
})

window.addEventListener('DOMContentLoaded', () => {
  console.log('process1222------------------', process)
})


