import { ipcRenderer, contextBridge } from 'electron'
// import archiver from 'archiver'
const archiver = require('archiver')
const fs = require('fs')

/**
 * @description: 生成压缩包
 * @param {string} zipName: 压缩包名称 url：目标文件路径
 */
export const generatePackage = (zipName: string, url: string) => {
  return new Promise((resolve, reject) => {
      try {
         // 创建一个文件写入流
        const output = fs.createWriteStream(zipName);
        const archive = archiver('zip', {
          zlib: { level: 9 } // 设置压缩级别
        });
        
        console.log('archive', archive)

        // 监听错误事件
        archive.on('error', function (err: Error) {
          throw err;
        });

        // 将输出流管道到文件
        archive.pipe(output);

        // 添加整个文件夹到压缩包，假设文件夹名为'folderToZip'
        // const folderPath = path.join(baseDirCopy, 'folderToZip');

        archive.directory(url, false);

        // 结束压缩过程
        archive.finalize();
        output.on('close', function() {
          console.log(archive.pointer() + ' total bytes');
          console.log('archiver has been finalized and the output file descriptor has closed.');
          resolve('success')
        });
        output.on('finish', function() {
          console.log('The file has been finalized and the output file descriptor has finseed.');
        })
      } catch (error) {
        reject(error)
      }
  })
 
}


/**
 * 删除文件夹下所有问价及将文件夹下所有文件清空
 * @param {*} pathName 
 */
function emptyDir(pathName: string) {
  console.log('fs', fs)
  const files = fs.readdirSync(pathName);
  files.forEach((file: string) => {
    const filePath = `${pathName}/${file}`;
    console.log('filePath', filePath)
    const stats = fs.statSync(filePath);
    console.log('stats', stats)
    if (fs.lstatSync(filePath).isDirectory()) {
      emptyDir(filePath);
    } else {
      fs.unlinkSync(filePath);
      // console.log(`删除${file}文件成功`);
    }
  });
}

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
    fsExtra: require('fs-extra'),
    archiver: require('archiver'),
    generatePackage: generatePackage,
    cwd: process.cwd,
    emptyDir: emptyDir
  },
})

window.addEventListener('DOMContentLoaded', () => {
  console.log('process1222------------------', process)
})


