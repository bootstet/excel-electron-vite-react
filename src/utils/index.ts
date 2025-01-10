/* eslint-disable @typescript-eslint/no-var-requires */
import { AxiosResponse } from "axios"
import axios from 'axios'

const archiver = window.ipcRenderer.nodeModules.archiver
console.log('archiver', archiver)
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
    .catch((err: Error) => {
      fn && fn()
      console.error('err', err)
    })
}


Object.defineProperty(Number.prototype, 'az', {
  value: function(n = 2) {
    let s = "";
    for (let i = 1; i < n; i++) {
      s += '0';
    }
    return (s + this).slice(-1 * n);
  },
  writable: true,
  configurable: true
});

