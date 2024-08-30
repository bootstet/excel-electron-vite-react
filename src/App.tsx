import React, {  useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Card, message, Upload } from 'antd';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import './App.css'

const fs = require('fs')
const path = require('path')


type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];


const App: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [dirUrl, setDirUrl] = useState('')
  const [totalNum, setTotalNum] = useState(0)



  const readImageFileSync = () => {
    console.log('dirUrl', dirUrl)
    fs.readdir(dirUrl, (err: any, files: any) => {
      if (err) {
        message.error('请先选择文件')
        return console.error('err', err)
      }
      console.log('files', files)
      const transfromResult = files.reduce((accumulator: any, currentValue: any) => {
        const numArr  = currentValue.match(/(\d+)(?=.*?[(（])/g)
        if (!numArr) {
          message.error(`${currentValue}文件名不包含 （或者( ,请添加后重试`)
        }
        const num = numArr[numArr.length - 1]
        if (!(num in accumulator)) {
          accumulator[num] = [currentValue]
        } else {
          accumulator[num].push(currentValue)
        }
        return accumulator
      }, {})
      console.log('transfromResult', transfromResult)
      setTotalNum(files.length)
     
      const newDirUrl = `${dirUrl}\重新归类`

      if (fs.existsSync(newDirUrl)) {
        // return message.error('文件夹已存在， 请复制一份文件夹或者重新命名后再试')

        fs.readdirSync(newDirUrl).forEach((file:any) => {
          const curPath = path.join(newDirUrl, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            fs.rmdirSync(curPath, { recursive: true });
          } else {
            fs.unlinkSync(curPath);
          }
        });
      } else {
        fs.mkdirSync(newDirUrl, function(error:any) {
          if (error) {
            console.error(error)
            return false
          }
        })
      }
    
      Object.keys(transfromResult).map((item:any) => {
        console.log('item', item)
        const ind = transfromResult[item].length
        const curDirName = `${item}.${ind}_共${item * ind}`
        console.log('curDirName', curDirName)
        try {
          const newPath = `${newDirUrl}\\${curDirName}`
          // 这段代码会先检查文件夹是否存在，如果存在则清空文件夹内容；如果不存在则创建文件夹。
          if (fs.existsSync(newPath)) {
            fs.readdirSync(newPath).forEach((file:any) => {
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
          transfromResult[item].forEach((element:any)=> {
            const sourcePath = `${dirUrl}\\${element}`
            const destinationPath = `${newDirUrl}\\${curDirName}\\${element}`
              // 复制文件
            fs.copyFileSync(sourcePath, destinationPath);
            console.log('文件复制成功!');
           
          });
          console.log('文件夹创建成功!');
        } catch (err) {
          console.error('创建文件夹时发生错误:', err);
        }
      })
      
      message.success('文件夹生成成功，请核对后使用')
    });
  }

  const props: UploadProps = {
    multiple: true,
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file:FileType, fileList1) => {
      const imagePathUrl  = file.path;
      const lastIndex = imagePathUrl.lastIndexOf("\\");
      const afterLastSlash = imagePathUrl.substring(0, lastIndex);
      
      console.log('imagePathUrl', imagePathUrl)
      console.log('afterLastSlash', afterLastSlash);
      setDirUrl(afterLastSlash)
      setFileList([...fileList1]);
      return false;
    },
    fileList,
    showUploadList: true
  };

  return (
    <>
      <Card className="fileList" title={`一共${totalNum}个文件`} extra={<Button onClick={readImageFileSync} type="primary" size="small">一键生成</Button>} style={{ width: 300 }}>
        <Upload {...props}>
          <Button icon={<UploadOutlined />}>Select File</Button>
        </Upload>
      </Card>

    </>
  );
};

export default App;