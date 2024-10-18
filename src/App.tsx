import { useEffect, useState } from 'react'
import { Upload, Button, message, Modal, Form, Input, ConfigProvider, Spin } from 'antd';
import axios from 'axios'
import { UploadOutlined } from '@ant-design/icons';
import reactLogo from './assets/react.svg'
import viteLogo from '/electron-vite.animate.svg'
import './App.css'

import * as XLSX from 'xlsx';
import { downloadFile, findStringAndNextWord, generatePackage } from './utils';
import { saveAs } from 'file-saver';

const path = require('path')
const fs = require('fs')
const archiver = require('archiver')
const fsExtra = require('fs-extra');

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
function rmEmptyDir(path, level = 0) {
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
    level !== 0 && fs.rmdirSync(path);
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


const folderPath = 'images'
const directoryPath = path.join('./', folderPath);

function App() {
  const [form] = Form.useForm();
  const [flowerName, setFlowerName] = useState('');
  const [flowerNameByZu, setFlowerNameByZu] = useState('');
  const [goodsName, setGoodsName] = useState('');
  const [paramsResult, setParamsResult] = useState({});
  const [spinning, setSpinning] = useState(false)


  const currentPath = path.join(__dirname, '')
  console.log('currentPath', currentPath)
  console.log('__filename', __filename)
  fs.readdir('./', (err, files) => {
    console.log('当前路径', files)
  })


  // 上传文件并解析成json
  const HandleImportFile = (info) => {
    setSpinning(true)
    const files = info.file;
    // 获取文件名称
    const name = files.name;
    // 获取文件后缀
    const suffix = name.substr(name.lastIndexOf('.'));
    const reader = new FileReader();
    reader.onload = async (event) => {
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
            acc[keyObject[cur]] = item[cur]
            return acc
          }, {})
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

          setSpinning(false)
          getNoExistData(result)
          console.log('result', result)

        }
      } catch (e) {
        setSpinning(false)
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

  const buildFlowerImageFile = async () => {
    const targetFileName = 'imagesFlower'
    const zipFileName = 'zipFlower.zip'
    const target = paramsResult
    setSpinning(true)

    console.log('directoryPath', directoryPath)
    // node 访问文件系统
    fs.readdir(directoryPath, async (err, files) => {
      console.log('files', files)

      const imageFiles = files.filter(file => {
        let bol = false
        for (const key in target) {
          if (file.includes(key)) {
            return bol = true
          } else {
            bol = false
          }
        }
        return bol
      })

      // 新建一个文件夹
      const baseDir = path.join('./', targetFileName)
      if (fs.existsSync(baseDir)) {
        clearDir(baseDir)
      }
      await fsExtra.ensureDir(baseDir)

      imageFiles.forEach(async (file, index) => {
        console.log('filename', file)
        const baseName = file.split('.')[0]
        const filePath = path.join(folderPath, file);

        let keyBaseName = ''
        for (const key in target) {
          if (file.includes(key)) {
            keyBaseName = key
          }
        }
        // 压缩包中的文件名
        const downName = `${baseName}-${target[keyBaseName]}.jpg`
        console.log('downName', downName)
        if (fs.existsSync(filePath)) {
          await fsExtra.copy(filePath, `${baseDir}\\${downName}`);
          if (index === imageFiles.length - 1) {
            await generatePackage(zipFileName, `./${targetFileName}`)
            setTimeout(() => {
              downloadFile(`./${zipFileName}`, flowerName, () => setSpinning(false))
            }, 500);
          }
        } else {
          console.log(`${file} does not exist`);
        }
      });

    });
  }
  const buildTotalImageFile = () => {
    const targetFileName = 'imagesTotal'
    const zipFileName = 'zipTotal.zip'
    const target = paramsResult
    setSpinning(true)

    fs.readdir(directoryPath, async (err, files) => {

      const existImagesObj = {} // 存在的图片
      const noExistImagesObj = {} // 不存在的图片
      const imageFiles = files.filter(file => {
        let bol = false
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

      const baseDir = path.join('./', targetFileName)
      if (fs.existsSync(baseDir)) {
        clearDir(baseDir)
      }

      await fsExtra.ensureDir(baseDir)

      const transformData = Object.keys(existImagesObj).reduce((acc, cur) => {
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
      Object.keys(transformData).map(async (item, index) => {
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
          transformData[item].forEach(async (element, num) => {
            const sourcePath = `${directoryPath}\\${element}`
            const destinationPath = `${baseDir}\\${curDirName}\\${element}`
            // 复制文件
            await fsExtra.copy(sourcePath, destinationPath);
            if (num === transformData[item].length - 1 && index === Object.keys(transformData).length - 1) {

              await generatePackage(zipFileName, `./${targetFileName}`)
              setTimeout(() => {
                downloadFile(`./${zipFileName}`, flowerName, () => setSpinning(false))
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
  const buildGoodsImageFile = () => {
    const targetFileName = 'imagesGoods'
    const zipFileName = 'zipGoods.zip'
    setSpinning(true)

    const target = paramsResult
    // node 访问文件系统
    fs.readdir(directoryPath, async (err, files) => {

      const existImagesObj = {} // 存在的图片
      const noExistImagesObj = {} // 不存在的图片
      const imageFiles = files.filter(file => {
        let bol = false
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
      const subdirectoryName = targetFileName
      const baseDir = path.join('./', subdirectoryName)

      if (fs.existsSync(baseDir)) {
        clearDir(baseDir)
      }
      await fsExtra.ensureDir(baseDir) // 确保目录存在  
      let imageTotal = 0
      const transformData = Object.keys(existImagesObj).map(async (item, index) => {
        const existArr = imageFiles.filter(fileName => fileName.includes(item))
        const imageNum = Number(existImagesObj[item]) // 每张图片数量
        const subdirectoryPath = path.join('./', subdirectoryName, `A${index + 1}-${item}-(${imageNum * existArr.length})`)
        imageTotal += imageNum * existArr.length
        await fsExtra.ensureDir(subdirectoryPath)
        existArr.forEach(async (element, num) => {
          const sourcePath = `${directoryPath}\\${element}`
          const imageName = element.split('.')[0] // 图片名称
          const postfixName = element.split('.')[1] // 图片后缀
          const filePath = `${subdirectoryPath}\\${imageName}_${imageNum}.${postfixName}`
          await fsExtra.copy(sourcePath, filePath)
          if (num === existArr.length - 1 && index === Object.keys(existImagesObj).length - 1) {
            await generatePackage(zipFileName, `./${targetFileName}`)
            setTimeout(() => {
              downloadFile(`./${zipFileName}`, goodsName, () => setSpinning(false))
            }, 500);
          }
        })
      })
    });
  }

  const getNoExistData = (result) => {
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
      if (Object.keys(data).length > 0) {
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
        <div className="flex  justify-between p-24">
          <Upload {...props}>
            <Button type="primary" icon={<UploadOutlined />}>
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
        </div>
        <Spin spinning={spinning} fullscreen tip="生成中..." />
      </main>
    </ConfigProvider>
  );
}


export default App;