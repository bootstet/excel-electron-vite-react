/* eslint-disable @typescript-eslint/no-var-requires */
import { AxiosResponse } from "axios"

const axios = require('axios')
const archiver = require('archiver')
const fs = require('fs')

/**
 * 
 * @description: 获取SKC值
 */

export const findStringAndNextWord = (str: string, target: string) => {
  if (!str) {
    return null
  }
  const regex = new RegExp(target + '(\\d+)')
  const match = str.match(regex)
  return match ? match[1] : null
}

/**
 * @description: 获取字符串中的数字
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
        reject()
      }
  })
 
}

/**
 * @description:下载文件
 * @params {string} url: 文件地址
 * @params {string} name: 文件名称,没有的话生成默认文件名
 */
export const downloadFile = (url: string, name?: string, fn?: () => void) => {
  axios.get(url, {
    responseType: 'blob',
    headers: {
      responseType: 'blob'
    }
  })
    .then((res: AxiosResponse) => {
      console.log('res', res)
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      name && link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
      fn && fn()
      document.body.removeChild(link);
    })
}