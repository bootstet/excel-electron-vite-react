/* eslint-disable @typescript-eslint/no-var-requires */
import { AxiosResponse } from "axios"
import axios from 'axios'

const archiver = window.ipcRenderer.nodeModules.archiver
console.log('archiver', archiver)
/**
 * 
 * @description: 获取SKC值
 */



export const findStringAndNextWord = (str, target) => {
  if (!str) return ""; // 如果输入字符串为空，直接返回空

  const targets = target.split(',').map(t => t.trim()); // 按逗号拆分，并去除两端空格

  for (const currentTarget of targets) {
    // 严格匹配：currentTarget 后面必须紧跟字母数字（不能是换行或空格）
    const regex = new RegExp(`${currentTarget}([a-zA-Z0-9]+)`);
    const match = str.match(regex);

    if (match) {
      return match[1] || ""; // 返回匹配的字母数字部分
    }
  }

  return ""; // 所有关键词都没匹配到，返回空字符串
};






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

