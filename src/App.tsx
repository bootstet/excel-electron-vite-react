/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
import { useEffect, useState } from 'react'
import { Upload, Button, message, Modal, Form, Input, ConfigProvider, Spin, Popover } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import './App.css'

import * as XLSX from 'xlsx';
import { downloadFile, findStringAndNextWord, generatePackage } from './utils';

const path = require('path')
const fs = require('fs')
const fsExtra = require('fs-extra');

const endTime = '2024/12/30 23:59:59'

const sm = 3
const md = 6
const layoutContent = '只计算一套小于10张的图片'



/**
 * 删除文件夹下所有问价及将文件夹下所有文件清空
 * @param {*} path 
 */
function emptyDir(path: string) {
  const files = fs.readdirSync(path);
  files.forEach((file: string) => {
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
function rmEmptyDir(path: string, level = 0) {
  const files = fs.readdirSync(path);
  if (files.length > 0) {
    let tempFile = 0;
    files.forEach((file: string) => {
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
function clearDir(path: string) {
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

  const navigate = useNavigate();

  useEffect(() => {
    const endTimeDate = Date.parse(endTime)
    const curTime = new Date().getTime()
    if (curTime > endTimeDate) {
      navigate('/401')
    }
  }, [])


  // 上传文件并解析成json
  const HandleImportFile = (info: any) => {
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
        const { result } = event.target as FileReader;
        // 读取文件
        const workbook = XLSX.read(result, { type: 'binary' });
        let data: any[] = [];
        // 循环文件中的每个表
        console.log('表格数据workbook：', workbook);
        for (const sheet in workbook.Sheets) {
          if (Object.prototype.hasOwnProperty.call(workbook.Sheets, sheet)) {
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


        data = data.map((item: any) => {
          const transResult = Object.keys(item as any).reduce((acc: any, cur: any) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            acc[keyObject[cur]] = item[cur]
            return acc
          }, {})
          return transResult
        })
        console.log('表格数据', data)

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
  const filedChange = (changedValues: { flowerName: string; goodsName: string; }[], allValues: { flowerName: string; goodsName: string; }) => {
    const { flowerName, goodsName } = allValues;
    setFlowerName(flowerName);
    setGoodsName(goodsName);
    setFlowerNameByZu(flowerNameByZu);
  }

  const buildFlowerImageFile = async () => {
    const targetFileName = 'imagesFlower'
    const zipFileName = 'zipFlower.zip'
    const target: { [key: string]: number } = paramsResult
    console.log('paramsResult', paramsResult)

    if (Object.keys(target).length === 0) {
      message.error('没有读取到表格数据，请先上传表格！')
      return
    }
    setSpinning(true)

    console.log('directoryPath', directoryPath)

    try {
      // node 访问文件系统
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fs.readdir(directoryPath, async (err: any, files: any[]) => {
        console.log('files', files)
        if (!files) {
          setSpinning(false)
          return message.error("没有找到images文件，请先检查images文件！")
        }

        const imageFiles = files.filter((file: string | string[]) => {
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

        console.log('imageFiles', imageFiles)

        // 新建一个文件夹
        const baseDir = path.join('./', targetFileName)
        if (fs.existsSync(baseDir)) {
          clearDir(baseDir)
        }
        console.log('baseDir', baseDir)
        await fsExtra.ensureDir(baseDir)
        let imageTotal = 0 
        imageFiles.forEach(async (file: string, index: number) => {
          console.log('filename', file)
          
          const baseName = file.split('.')[0]
          const filePath = path.join(folderPath, file);

          let keyBaseName = ''
          for (const key in target) {
            if (file.includes(key)) {
              keyBaseName = key
            }
          }
          imageTotal = imageTotal + target[keyBaseName]
          // 压缩包中的文件名
          const downName = `${baseName}-${target[keyBaseName]}.jpg`
          console.log('downName', downName)
          if (fs.existsSync(filePath)) {
            await fsExtra.copy(filePath, `${baseDir}\\${downName}`);
            if (index === imageFiles.length - 1) {
              await generatePackage(`${zipFileName}`, `./${targetFileName}`)
              const downUrl = `file://${path.join(process.cwd(), zipFileName)}`
              setTimeout(() => {
                downloadFile(downUrl, `生成印花文件共${imageTotal}`, () => setSpinning(false))
              }, 500);
            }
          } else {
            console.log(`${file} does not exist`);
          }
        });

      });
    } catch (error) {
      console.error(error)
    }
    
  }
  const buildTotalImageFile = () => {
    const targetFileName = 'imagesTotal'
    const zipFileName = 'zipTotal.zip'
    const target: { [key: string]: number } = paramsResult
    
    setSpinning(true)
    if (Object.keys(target).length === 0) {
      message.error('没有读取到表格数据，请先上传表格！')
      setSpinning(false)
      return
    }

    fs.readdir(directoryPath, async (err: any, files: any[]) => {
      if (!files) {
        setSpinning(false)
        return message.error("没有找到images文件，请先检查images文件！")
      }
      const existImagesObj: any = {} // 存在的图片
      const noExistImagesObj: any = {} // 不存在的图片
      const imageFiles = files.filter((file: string | string[]) => {
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


      
      if (Object.keys(existImagesObj).length === 0) {
        message.error('无存在的图片！请检查images是否存在图片！')
        setSpinning(false)
        return
      }
      const baseDir = path.join('./', targetFileName) 
      if (fs.existsSync(baseDir)) {
        clearDir(baseDir)
      }

      await fsExtra.ensureDir(baseDir)
      
      const transformData: any = Object.keys(existImagesObj).reduce((acc: any, cur) => {
        const val = existImagesObj[cur]
        if (val in acc) {
          acc[val] = acc[val].concat(imageFiles.filter((item: string | string[]) => item.includes(cur)))
        } else {
          acc[val] = imageFiles.filter((item: string | string[]) => item.includes(cur))
        }
        return acc
      }, {})
      console.log('transformData', transformData)
      // 递归复制图片到中专文件夹
      let imageTotal: number = 0
      Object.keys(transformData).map(async (item, index) => {
        const ind = transformData[item].length
        imageTotal = imageTotal + (item as unknown as number) * ind
        const curDirName = `${item}.${ind}_共${(item as unknown as number) * ind}`

        try {
          const newPath = `${baseDir}\\${curDirName}`
          // 这段代码会先检查文件夹是否存在，如果存在则清空文件夹内容；如果不存在则创建文件夹。
          if (fs.existsSync(newPath)) {
            fs.readdirSync(newPath).forEach((file: any) => {
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
          transformData[item].forEach(async (element: any, num: number) => {
            const sourcePath = `${directoryPath}\\${element}`
            const destinationPath = `${baseDir}\\${curDirName}\\${element}`
            // 复制文件
            await fsExtra.copy(sourcePath, destinationPath);
            if (num === transformData[item].length - 1 && index === Object.keys(transformData).length - 1) {

              await generatePackage(zipFileName, `./${targetFileName}`)
              const downUrl = `file://${path.join(process.cwd(), zipFileName)}`
              setTimeout(() => {
                downloadFile(downUrl, `生成印花文件（脚哥专用）共${imageTotal}`, () => setSpinning(false))
              }, 500);
            }
          });

        } catch (err) {
          console.error('创建文件夹时发生错误:', err);
        }
      })
    });
  }
  const buildGoodsImageFile = () => {
    const targetFileName = 'imagesGoods'
    const zipFileName = 'zipGoods.zip'

    const target: { [key: string]: number } = paramsResult
    console.log('target', target)
    if (Object.keys(target).length === 0) {
      message.error('没有读取到表格数据，请先上传表格！')
      return
    }
    setSpinning(true)
    // node 访问文件系统
    fs.readdir(directoryPath, async (err: any, files: any[]) => {
      if (!files) {
        setSpinning(false)
        return message.error("没有找到images文件，请先检查images文件！")
      }
      const existImagesObj: any = {} // 存在的图片
      const noExistImagesObj: any = {} // 不存在的图片
      const imageFiles = files.filter((file: string | string[]) => {
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
      Object.keys(existImagesObj).map(async (item, index) => {
        const existArr = imageFiles.filter((fileName: string | string[]) => fileName.includes(item))
        const imageNum = Number(existImagesObj[item]) // 每张图片数量
        const subdirectoryPath = path.join('./', subdirectoryName, `A${index + 1}-${item}-(${imageNum * existArr.length})`)
        imageTotal += imageNum * existArr.length
        await fsExtra.ensureDir(subdirectoryPath)
        existArr.forEach(async (element: string, num: number) => {
          const sourcePath = `${directoryPath}\\${element}`
          const imageName = element.split('.')[0] // 图片名称
          const postfixName = element.split('.')[1] // 图片后缀
          const filePath = `${subdirectoryPath}\\${imageName}_${imageNum}.${postfixName}`
          await fsExtra.copy(sourcePath, filePath)
          if (num === existArr.length - 1 && index === Object.keys(existImagesObj).length - 1) {
            await generatePackage(zipFileName, `./${targetFileName}`)
            const downUrl = `file://${path.join(process.cwd(), zipFileName)}`
            setTimeout(() => {
              downloadFile(downUrl, `生成拣货文件共${imageTotal}`, () => setSpinning(false))
            }, 500);
          }
        })
      })

    });
  }

  const generateLayoutFiles = (num : number)  => {
    console.log('num', num)
    const targetFileName = 'imagesLayout'
    const zipFileName = 'zipLayout.zip'
    const target: { [key: string]: number } = paramsResult
    
    setSpinning(true)
    if (Object.keys(target).length === 0) {
      message.error('没有读取到表格数据，请先上传表格！')
      setSpinning(false)
      return
    }

    fs.readdir(directoryPath, async (err: any, files: any[]) => {
      if (!files) {
        setSpinning(false)
        return message.error("没有找到images文件，请先检查images文件！")
      }
      const existImagesObj: any = {} // 存在的图片
      const noExistImagesObj: any = {} // 不存在的图片
      const imageFiles = files.filter((file: string | string[]) => {
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


      
      if (Object.keys(existImagesObj).length === 0) {
        message.error('无存在的图片！请检查images是否存在图片！')
        setSpinning(false)
        return
      }
      const baseDir = path.join('./', targetFileName) 
      if (fs.existsSync(baseDir)) {
        clearDir(baseDir)
      }

      await fsExtra.ensureDir(baseDir)
      
      const transformImageData : any = Object.keys(existImagesObj).reduce((acc: any, cur) => {
        const val = existImagesObj[cur]
        const obj: {[key: string]: string[]} =  val in acc ? acc[val] : {}
        for (let i = 0; i < val; i++) {
          const curKey = `${cur}_${i + 1}`
          obj[curKey] = imageFiles.filter((item: string | string[]) => item.includes(cur))
        }
        acc[val] = obj
        return acc
      }, {})


   
      // 循环一遍，生成总数，然后根据总数生成一个数组
      let imageTotal: number = 0

      Object.keys(transformImageData).map((item) => {
        Object.keys(transformImageData[item]).map(async (element) => {
          if (num && Number(item) < num) {
            imageTotal = imageTotal + transformImageData[item][element].length 
          }
        })
      })

      console.log('imageTotal', imageTotal)
      const layoutTotalNum: number = imageTotal % sm === 0 ? imageTotal  : imageTotal + (sm - imageTotal % sm)
      console.log('layoutTotalNum', layoutTotalNum)
      type TypeImageObj = {orgName: string, newName: string}
      const emptyObj: TypeImageObj = {
        orgName: '',
        newName: ''
      }
      const totalImageArr: TypeImageObj[] = new Array(layoutTotalNum).fill(emptyObj)
      // 往数组里面制定位置赛数据

      console.log("transformImageData", transformImageData)
      Object.keys(transformImageData).map((item) => {
        Object.keys(transformImageData[item]).map(async (element) => {
          const firstEmptyIndex = totalImageArr.findIndex((e: any) => e.orgName === '')
          transformImageData[item][element].map((e: any, k: number) => {
            // const imageLength = transformImageData[item][element].length
            if (num && Number(item) >= num) {
              return 
            }
            const keyNum = firstEmptyIndex + md*k 
            totalImageArr[keyNum] = {
              orgName: e,
              newName: `${keyNum.az(5)}_${k + 1}_${e}`
              // newName: `${keyNum.az(5)}_${e}`
            }
          })
        })
      })
      console.log('totalImageArr矩阵，长度并不代表实际个数', totalImageArr)
      totalImageArr.forEach(async (item: any, index: number) => {
        if (item.orgName !== '') {
          const filePath = path.join(folderPath, item.orgName);
          const newFilePath = path.join(baseDir, `${baseDir}\\${item.newName}`);
          if (fs.existsSync(filePath)) {
            await fsExtra.copy(filePath, newFilePath);
            if (index === imageFiles.length - 1) {
              await generatePackage(`${zipFileName}`, `./${targetFileName}`)
              const downUrl = `file://${path.join(process.cwd(), zipFileName)}`
              setTimeout(() => {
                downloadFile(downUrl, `生成排版${imageTotal}`, () => setSpinning(false))
              }, 500);
            }
          } else {
            console.log(`${item.orgName} does not exist`);
          }
        }
      })

      
    });
  }

  const getNoExistData = (result: unknown) => {
    fs.readdir(directoryPath, async (err: any, files: any[]) => {

      const existImagesObj: any = {} // 存在的图片
      const noExistImagesObj: any = {} // 不存在的图片
      console.log('files', files)

      Object.keys(result as any).map((item: any) => {
        if (files.some((file: string | string[]) => file.includes(item))) {
          existImagesObj[item] = item
        } else {
          noExistImagesObj[item] = item
        }
      })
      console.log('noExistImagesObj', noExistImagesObj)
      console.log('existImagesObj', existImagesObj)
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
  const props: any = {
    name: 'file',
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    headers: {
      authorization: 'authorization-text',
    },
    maxCount: 1,
    onChange(info: { file: { status: string; name: any; }; fileList: any; }) {
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
      <main className="min-h-screen">
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
          {/* <Form.Item label="引花名" name="flowerName">
            <Input />
          </Form.Item>
          <Form.Item label="拣货名" name="goodsName">
            <Input />
          </Form.Item> */}
        </Form>
        <div className="btnCon">
          <Button className="btn" onClick={buildFlowerImageFile} >生成印花文件</Button>
          <Button  onClick={buildTotalImageFile} className="ml-20">生成印花文件(脚哥专用)</Button>
          <Button onClick={buildGoodsImageFile} className="ml-20">生成拣货文件</Button>
          <Button onClick={() => generateLayoutFiles(1000)} className="ml-20">排版</Button>
          <Popover content={layoutContent} title="">
            <Button onClick={() => generateLayoutFiles(10)} className="ml-20">排版小于10</Button>
          </Popover>
          
        </div>
        <Spin spinning={spinning} fullscreen tip="玩命生成中，请稍等..." />
      </main>
    </ConfigProvider>
  );
}


export default App;