import { useEffect, useState } from 'react'
import { Upload, Button, message, Modal, Form, Input, ConfigProvider, Spin } from 'antd';
import axios from 'axios'
import { UploadOutlined } from '@ant-design/icons';
import reactLogo from './assets/react.svg'
import viteLogo from '/electron-vite.animate.svg'
import './App.css'

import * as XLSX from 'xlsx';
import { findStringAndNextWord } from './utils';
import { saveAs } from 'file-saver';

const path = require('path')
const fs = require('fs')
const archiver = require('archiver')
const fsExtra = require('fs-extra');
// const { clearDir } = require('./utils/nodeTools')

/**
 * 删除文件夹下所有问价及将文件夹下所有文件清空
 * @param {*} path 
 */
function emptyDir(path) {
  const files = fs.readdirSync(path);
  files.forEach(file => {
      const filePath = `${path}/${file}`;
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
          emptyDir(filePath);
      } else {
          fs.unlinkSync(filePath);
          console.log(`删除${file}文件成功`);
      }
  });
}

/**
* 删除指定路径下的所有空文件夹
* @param {*} path 
*/
function rmEmptyDir(path, level=0) {
  const files = fs.readdirSync(path);
  if (files.length > 0) {
      let tempFile = 0;
      files.forEach(file => {
          tempFile++;
          rmEmptyDir(`${path}/${file}`, 1);
      });
      if (tempFile === files.length && level !== 0) {
          fs.rmdirSync(path);
      }
  }
  else {
      level !==0 && fs.rmdirSync(path);
  }
}

/**
* 清空指定路径下的所有文件及文件夹
* @param {*} path 
*/
function clearDir(path) {
  emptyDir(path);
  rmEmptyDir(path);

}

function App() {
  const [count, setCount] = useState(0)
  const [form] = Form.useForm();
  const [flowerName, setFlowerName] = useState('');
  const [flowerNameByZu, setFlowerNameByZu] = useState('');
  const [goodsName, setGoodsName] = useState('');
  const [paramsResult, setParamsResult] = useState({});
  const [spinning, setSpinning] = useState(false)

  // useEffect(() => {
  //   axios.get('https://localhost:3001/getData')
  //     .then(res => {
  //       console.log('res', res)
  //     })
  //     .catch(err => {
  //       console.log('error', err)
  //     })
  // }, [])
  // console.log('window.ipcRenderer.nodeParams', window.ipcRenderer.nodeParams)
  // const __dirname = window.ipcRenderer.nodeParams.dirname
  // const __filename = window.ipcRenderer.nodeParams.filename
  // const {fs, path} = window.ipcRenderer.nodeModules
  const currentPath = path.join(__dirname, '')
  console.log('currentPath', currentPath)
  console.log('__filename', __filename)
  fs.readdir('./', (err, files) => {
    console.log('当前路径', files)
  })
  const directoryPath = path.join('./', 'images');

   // 上传文件并解析成json
   const HandleImportFile = (info) => {
    const files = info.file;
    // 获取文件名称
    const name = files.name;
    // 获取文件后缀
    const suffix = name.substr(name.lastIndexOf('.'));
    const reader = new FileReader();
    reader.onload = async(event) => {
      try {
        // 判断文件类型是否正确
        if ('.xls' != suffix && '.xlsx' != suffix) {
          message.error('选择Excel格式的文件导入!');
          return false;
        }
        const { result } = event.target;
        // 读取文件
        const workbook = XLSX.read(result, { type: 'binary' });
        let data = [];
        // 循环文件中的每个表
        console.log('表格数据workbook：', workbook);
        for (const sheet in workbook.Sheets) {
          if (workbook.Sheets.hasOwnProperty(sheet)) {
            // 将获取到表中的数据转化为json格式
            console.log('XLSX.utils.sheet_to_json(workbook.Sheets[sheet])', XLSX.utils.sheet_to_json(workbook.Sheets[sheet]))
            data = data.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
          }
        }
        console.log('原始表格数据', data)
        
        // 表格数据处理 将表格数据转换为 { 商品信息: 'xxx', 数量: 78, .... }
        const keyObject = {
          '__EMPTY': "商品信息",
          '__EMPTY_1': "商品信息",
          '__EMPTY_2': "属性集",
          '__EMPTY_3': "SKU ID",
          '__EMPTY_5': "数量",
          '数量': "数量",
          'SKU ID': "SKU ID"
        }
        
        data = data.map(item => {
          const transResult = Object.keys(item).reduce((acc, cur) => {
            acc[keyObject[cur]]= item[cur]
            return acc
          }, {})
          // console.log('transResult', transResult)
          return transResult
        })

        if (data && data.length < 1) {
          message.error('表格中没有数据,请重新上传');
          return;
        }
        if (data && data.length > 0) {
          const result = data.reduce((acc, cur) => {
            const key = findStringAndNextWord(cur['商品信息'], 'SKC：')
            if (key) {
              acc[key] = cur['数量']
            }
            return acc
          }, {})
          console.log('result', Object.keys(result))
          info.onProgress({ percent: 100 }, info.file);
          info.onSuccess(info.res, info.file);
          setParamsResult(result)
          
          // getDataFun(result)
          // getGoodsData(result)
          getNoExistData(result)
          console.log('result', result)
          
        }
      } catch (e) {
        console.error('e', e)
        message.error('文件类型不正确！');
      }
    };
    reader.readAsBinaryString(files);
  };
  const filedChange = (changedValues, allValues) => {
    const { flowerName, goodsName } = allValues;
    setFlowerName(flowerName);
    setGoodsName(goodsName);
    setFlowerNameByZu(flowerNameByZu);
  }
  
  const buildFlowerImageFile = () => {
    const target = paramsResult
  // console.log('res', res)

  // const directoryPath = path.join(__dirname, 'images')
  console.log('directoryPath', directoryPath)
  // node 访问文件系统
  fs.readdir(directoryPath, (err, files) => {
    
    console.log('files', files)
    // const imageFiles = files.filter(file => path.parse(file).name in target);

    const imageFiles = files.filter(file => {
      let bol  = false
      for (const key in target) {
        if (file.includes(key)) {
          return bol = true
        } else {
          bol = false
        }
      }
      return bol
    })
    

    console.log('imageFiles', imageFiles)
  

    const folderPath = 'images'
    const archive = archiver('zip');
    let res = null
     // 压缩过程
     archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        throw err;
      }
    });
    // 压缩报错日志
    archive.on('error', (err) => {
      throw err;
    });
   

    imageFiles.forEach((file) => {
      console.log('filename', file)
      const baseName =  file.split('.')[0]
      const filePath = path.join(folderPath, file);

      let keyBaseName = '' 
      for (const key in target) {
        if (file.includes(key)) {
          keyBaseName = key
        }
      }
      // 压缩包中的文件名
      // const downName = `${baseName}-${target[keyBaseName]}.jpg` 
      const downName = `${target[keyBaseName]}(个).jpg` 
      console.log('downName', downName)
      if (fs.existsSync(filePath)) {
        archive.append(fs.createReadStream(filePath), { name: downName });
      } else {
        console.log(`${file} does not exist`);
      }
    });
    // 返回压缩包文件流
    archive.finalize();
    // window.open(res)
    console.log(archive)
  });
  }
  const buildTotalImageFile = () => {
    const target = paramsResult

    fs.readdir(directoryPath, async (err, files) => {
      if (err) {
        return res.status(500).send(err);
      }
      // const imageFiles = files.filter(file => path.parse(file).name in target);
      console.log('前端传过来的参数target', target)
      const existImagesObj = {} // 存在的图片
      const noExistImagesObj = {} // 不存在的图片
      const imageFiles = files.filter(file => {
        let bol  = false
        
        for (const key in target) {
          if (file.includes(key)) {
            existImagesObj[key] = target[key]
            return bol = true
          } else {
            noExistImagesObj[key] = target[key]
            bol = false
          }
        }
        return bol
      })
  
      // 新建一个文件夹
      const baseDir = path.join('./', 'imagesTarget')
      const copyDir = path.join('./', 'imagesTargetsCopy')
      if (fs.existsSync(baseDir)) { 
        clearDir(baseDir)
      }
      if (fs.existsSync(copyDir)) { 
        clearDir(copyDir)
      }
     
      await fsExtra.ensureDir(baseDir)
        
      // console.log('images文件中存在excel SKC的文件', imageFiles)
      // console.log('existImagesObj', existImagesObj)
      // console.log('noExistImagesObj', noExistImagesObj)
  
      const transformData = Object.keys(existImagesObj).reduce((acc,cur) => {
        const val = existImagesObj[cur]
        if (val in acc) {
          acc[val] = acc[val].concat(imageFiles.filter(item => item.includes(cur)))
        } else {
          acc[val] = imageFiles.filter(item => item.includes(cur))
        }
        return acc
      }, {})
      // 递归复制图片到中专文件夹
      let imageTotal = 0
      Object.keys(transformData).map(async (item) => {
        const ind = transformData[item].length
        imageTotal = imageTotal + item * ind
        const curDirName = `${item}.${ind}_共${imageTotal}`
        
        try {
          const newPath = `${baseDir}\\${curDirName}`
          // 这段代码会先检查文件夹是否存在，如果存在则清空文件夹内容；如果不存在则创建文件夹。
          if (fs.existsSync(newPath)) {
            fs.readdirSync(newPath).forEach((file) => {
              const curPath = path.join(newPath, file);
              if (fs.lstatSync(curPath).isDirectory()) {
                fs.rmdirSync(curPath, { recursive: true });
              } else {
                fs.unlinkSync(curPath);
              }
            });
          } else {
            fs.mkdirSync(newPath);
          }
          // await fsExtra.ensureDir(newPath)
          transformData[item].forEach(async (element, index) => {
            const sourcePath = `${directoryPath}\\${element}`
            const destinationPath = `${baseDir}\\${curDirName}\\${element}`
              // 复制文件
            await fsExtra.copy(sourcePath, destinationPath);
            if (index === transformData[item].length - 1) {
              console.log('====================================');
              console.log('复制完成');
              console.log('====================================');

              // 创建一个文件写入流
              const output = fs.createWriteStream('example.zip');
              const archive = archiver('zip', {
                zlib: { level: 9 } // 设置压缩级别
              });

              // 监听错误事件
              archive.on('error', function(err){
                throw err;
              });

              // 将输出流管道到文件
              archive.pipe(output);

              // 添加整个文件夹到压缩包，假设文件夹名为'folderToZip'
              // const folderPath = path.join(baseDirCopy, 'folderToZip');
              
              archive.directory('./imagesTarget', false);

              // 结束压缩过程
              archive.finalize();
            
              setTimeout(() => {
                axios.get('./example.zip', {
                  responseType: 'blob',
                  headers: {
                    responseType: 'blob'
                  }
                })
                .then((res) => {
                  console.log('res', res)
                  const url = window.URL.createObjectURL(res.data);
                  const link = document.createElement('a');
                  link.href = url;
                  // link.setAttribute('download', 'packjs.zip');
                  document.body.appendChild(link);
                  link.click();
                })
              }, 500);
            }
          });
          console.log('文件夹创建成功!');
        } catch (err) {
          console.error('创建文件夹时发生错误:', err);
        }
      })
  
      
    });
  }
  const buildGoodsImageFile = () => {}
  const getNoExistData= (result) => {
    fs.readdir(directoryPath, async (err, files) => {
      
      const existImagesObj = {} // 存在的图片
      const noExistImagesObj = {} // 不存在的图片
      console.log('files', files)
  
      Object.keys(result).map(item => {
        if (files.some(file => file.includes(item))) {
          existImagesObj[item] = item
        } else {
          noExistImagesObj[item] = item
        }
      })
      console.log('noExistImagesObj', noExistImagesObj)
      const data = Object.keys(noExistImagesObj).join(',')
      if(Object.keys(data).length > 0) {
        Modal.error({
          title: '不存在的图片skc有：',
          content: data
        })
      } else {
        Modal.success({
          title: '导出成功，文件夹图片完整',
          content: data
        })
      }
    });
  }
  const props = {
    name: 'file',
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    headers: {
      authorization: 'authorization-text',
    },
    maxCount: 1,
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      // const result = info.file.raw;
      // const workbook = XLSX.read(result, { type: 'binary' });
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败.`);
      }
    },

    customRequest: HandleImportFile,
  };

  const downZipFile = () => {
    axios.get('./example.zip', {
      responseType: 'blob',
      headers: {
        responseType: 'blob'
      }
    })
    .then((res) => {
      console.log('res', res)
      // const url = window.URL.createObjectURL(new Blob([res.data]));
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      // link.setAttribute('download', 'packjs.zip');
      document.body.appendChild(link);
      link.click();
    })
  }


  return (
    <ConfigProvider
      theme={{
        token: {
          // Seed Token，影响范围大
          colorPrimary: '#00b96b',
          borderRadius: 2,

          // 派生变量，影响范围小
          colorBgContainer: '#f6ffed',
        },
      }}  
    >
      <main className="min-h-screen ">
        <div  className="flex  justify-between p-24">
          <Upload {...props}>
            <Button type="primary"  icon={<UploadOutlined />}>
              导入表格
            </Button>
            <div>
              <p>1、上传表格</p>
              <p>2、输入相应印花名或者拣货名，点击相应按钮生成文件夹</p>
            </div>
          </Upload>
        </div>
        
        
        <Form
          name="basic"
          form={form}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          autoComplete="off"
          onValuesChange={filedChange}
        >

          <Form.Item label="引花名" name="flowerName">
            <Input />
          </Form.Item>

          <Form.Item label="拣货名" name="goodsName">
            <Input />
          </Form.Item>
          
        </Form>
        <div className="btnCon">
          <Button onClick={buildFlowerImageFile} disabled={!flowerName}>生成印花文件</Button>
          <Button onClick={buildTotalImageFile} disabled={!flowerName} className="ml-20">生成印花文件(脚哥专用)</Button>
          <Button onClick={buildGoodsImageFile} disabled={!goodsName} className="ml-20">生成拣货文件</Button>
          <Button onClick={downZipFile}>down</Button>
        </div>
        <Spin spinning={spinning}  fullscreen tip="生成中..." />
        <a href="./example.zip">222</a>
      </main>
    </ConfigProvider>
  );
}

export default App
