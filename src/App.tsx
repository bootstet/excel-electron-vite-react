import React, { useEffect, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Card, message, Upload } from 'antd';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import './App.css'
import { readFileSync } from 'fs';

const fs = require('fs')
const path = require('path')

fs.readFile('C:\\Users\\Administrator\\Desktop\\image\\1000220505 (1).jpg', (err, data) => {
  if (err) return console.error(err);
  // console.log(data.toString());
});

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];



const App: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dirUrl, setDirUrl] = useState('')

  const handleUpload = () => {
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append('files[]', file as FileType);
    });
    setUploading(true);
    // You can use any AJAX library you like
    fetch('https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then(() => {
        setFileList([]);
        message.success('upload successfully.');
      })
      .catch(() => {
        message.error('upload failed.');
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const readImageFileSync = () => {
    // const imagList = fileList[0].path.split
    // console.log('imagList', imagList)
    // setFileUrl(imagList)
    console.log('dirUrl', dirUrl)
    fs.readdir(dirUrl, (err, files) => {
      if (err) {
        return console.error('err', err)
      }
      console.log('files', files)
      files.reduce((arc, ))
      // const imageFiles = files.filter(file => path.parse(file).name in target);
      // const lastIndex = dirUrl.lastIndexOf("\\");
      // const afterLastSlash = dirUrl.substring(0, lastIndex);
      // TODO: 已存在文件名判断
      const newDirUrl = `${dirUrl}\重命名`
      // 删除文件夹
      fs.rmdir('newDirUrl',function(error){
        if(error){
            console.log(error);
            return false;
        }
        console.log('删除目录成功');
      })
      // 新建文件夹
      fs.mkdir(newDirUrl, function(error) {
        if (error) {
          console.error(error)
          return false
        }
      })
      console.log('newDirUrl', newDirUrl)
      console.log('files[0]', files[0])

            
      //5.fs.readFile 读取文件  
      fs.readFile(`${dirUrl}${files[0]}`,function(error,data){
        if(error){
            console.log(error);
            return false;
        }
        //console.log(data);  //data是读取的十六进制的数据。  也可以在参数中加入编码格式"utf8"来解决十六进制的问题;
        console.log(data.toString());  //读取出所有行的信息  
      })



      // var writerStream = fs.createWriteStream(`${newDirUrl}\\output.txt`);
      // writerStream.write( files[0] , 'UTF8' );
      // writerStream.end();  //标记文件末尾  结束写入流，释放资源  
      // writerStream.on( 'finish',  function() {
      //     console.log("写入完成。");
      // });
      // writerStream.on( 'error',  function(error){
      //     console.log(error.stack);
      // });


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
    beforeUpload: (file, fileList1) => {
      // console.log('file', file)
      const imagePathUrl  = file.path;
      const lastIndex = imagePathUrl.lastIndexOf("\\");
      const afterLastSlash = imagePathUrl.substring(0, lastIndex);
      
      console.log('imagePathUrl', imagePathUrl)
      console.log('afterLastSlash', afterLastSlash);
      setDirUrl(afterLastSlash, () => {
        console.log(1)
      })
      // console.log('fileList1', fileList1)
      setFileList([...fileList1]);
      // 访问文件系统
      // readImageFileSync()
      return false;
    },
    fileList,
    showUploadList: true
  };

  useEffect(() => {

  },[dirUrl] )

  return (
    <>
      <Card className="fileList" title={`一共${fileList.length}个文件`} extra={<Button onClick={readImageFileSync} type="primary" size="small">重新命名</Button>} style={{ width: 300 }}>
        <Upload {...props}>
          <Button icon={<UploadOutlined />}>Select File</Button>
        </Upload>
      </Card>

      {/* <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        style={{ marginTop: 16 }}
      >
        {uploading ? 'Uploading' : 'Start Upload'}
      </Button> */}


    </>
  );
};

export default App;