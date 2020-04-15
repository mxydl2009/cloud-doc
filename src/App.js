import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import { v4 as uuidv4 } from 'uuid'
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import { faFileImport, faPlus, faSave } from '@fortawesome/free-solid-svg-icons'
import TabList from './components/TabList'
import { flattenArray, objToArr, timeStampToString } from './utils/helper'
import fileHelper from './utils/fileHelper'
import useIPCRender from './hooks/useIPCRender'
import useIPCRenderer from './hooks/useIPCRender';
import Loader from './components/Loader'

// 使用node API 和 electron API
const path = window.require('path');
const { basename, extname, dirname, join } = path;
const { remote, ipcRenderer } = window.require('electron');
const Store = window.require('electron-store');
// 实例化一个Store;
const fileStore = new Store({
  'name': 'FilesData'
});

const settingsStore = new Store({ name: 'Settings' });

// 不需要把file的所有信息都存储到持久化数据中，如文件内容（我们用path来索引，到时候去读取即可），如状态信息（isNew等）
const saveFilesToStore = (files) => {
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const  { id, path, title, createdAt, isSynced, updatedAt } = file;
    if(isSynced) {
      console.log(isSynced, updatedAt);
    }
    result[id] = {
      id,
      path,
      title,
      createdAt,
      isSynced,
      updatedAt
    }
    return result;
  }, {})
  fileStore.set('files', filesStoreObj); 
}
// 用来检查配置信息是否齐全, 并且在自动同步为true时才返回true，不齐全或者自动同步为false时都返回false;
const getAutoSync = () => {
  return ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))
}

function App() {
  const [ files, setFiles ] = useState(fileStore.get('files') || {});
  const [ activeFileID, setActiveFileID ] = useState('');
  const [ openedFileIDs, setOpenedFileIDs ] = useState([]);
  const [ unsavedFileIDs, setUnsavedFileIDs ] = useState([]);
  const [ isLoading, setLoading ] = useState(false);
  const filesArr = objToArr(files);

  // 使用remote模块来调用主进程才能使用的app.getPath()方法，获取documents的路径
  // 将文件存储在documents文件夹下;
  const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents');
  // renderTest是我用来测试App组件更新时被渲染的次数;
  // const renderTest = useRef(1);
  //为了避免多个操作都依赖于files数组，导致某个操作更新files数组后，其他操作出现bug
  // 定义一个searchedFiles的state，负责管理fileList，该searchedFiles数组由files派生。
  const [ searchedFiles, setSearchedFiles ] = useState([]); 
  
  const openedFiles = openedFileIDs.map(openID => {
    return files[openID];
  })
  const activeFile = files[activeFileID];

  const fileListArray = (searchedFiles.length > 0)? searchedFiles: filesArr;

  const fileClick = (fileID) => {
    // 将当前文件fileID设置为activeFileID
    setActiveFileID(fileID);
    const currentFile = files[fileID];
    const { id, title, path, isLoaded } = currentFile;
    if(!isLoaded) {
      if(getAutoSync()) {
        ipcRenderer.send('download-file', { key: `${title}.md`, path, id });
      } 
      else {
        fileHelper.readFile(currentFile.path).then((result) => {
          const newFile = { ...files[fileID], body: result, isLoaded: true }
          setFiles({ ...files, [fileID]: newFile });
        })        
      }
    }
    // 将当前文件设置为打开的文件
    // 如果openedFileIDs已经包含了fileID，则不加入openedFileIDs;
    if(!openedFileIDs.includes(fileID)) {
      setOpenedFileIDs([ ...openedFileIDs, fileID ])
    }
  }

  const tabClick = (fileID) => {
    setActiveFileID(fileID);
  }

  const tabClose = (fileID) => {
    // 从openedFileIDs删除当前点击的fileID;
    const tabsWithout = openedFileIDs.filter(openedfileID => openedfileID !== fileID);
    // 如果openedFileIDs有元素，则把第一个元素设置为activeFileID，让这个标签高亮;
    if(tabsWithout.length > 0) {
      setActiveFileID(tabsWithout[0]);
    }
    setOpenedFileIDs(tabsWithout);
  } 

  const fileChange = (activeFileID, value) => {
    // if判断是为了避免<simpleMDE />在检测键盘事件后调用fileChange，不然我们按下cmd+S保存时，也会导致调用fileChange;
    if(value !== files[activeFileID].body) {
      // 将activeFileID参数加入unsavedFileIDs，将value保存到activeFileID指定的file.body属性；
      const newFile = { ...files[activeFileID], body: value };
      setFiles({ ...files, [activeFileID]: newFile });
      if(!unsavedFileIDs.includes(activeFileID)) {
        setUnsavedFileIDs([...unsavedFileIDs, activeFileID]);
      }      
    }
  }

  const deleteFile = (fileID) => {
    if(files[fileID].isNew) {
      // 不能直接用delete files[fileID],这是直接对state进行修改，React不会重新渲染
      // delete files[fileID];
      // 方案1：
      // delete files[fileID];
      // setFiles({ ...files });
      // 方案2：
      const { [fileID]: value, ...afterDelete } = files;
      setFiles(afterDelete);
    } else {
      fileHelper.deleteFile(files[fileID].path).then(() => {
        // 将fileID的file从files删除
        const { [fileID]: value, ...afterDelete } = files;
        setFiles(afterDelete);
        saveFilesToStore(afterDelete);
        // 如果被删除的文件已经在tab中打开，必须还要把openedFileIDs中删除这个fileID; 
        tabClose(fileID); 
      })      
    }
  }

  const updateFileName = (fileID, title, isNew) => {
    // 新创建文件，则文件路径为savedLocation，如果不是，则为原来文件的路径
    const newPath = isNew? path.join(savedLocation, `${title}.md`)
      : path.join(dirname(files[fileID].path), `${title}.md`);
    const updatedFile = { ...files[fileID], title, isNew: false, path: newPath };
    const newFiles = { ...files, [fileID]: updatedFile };
    if(isNew) {
      fileHelper.writeFile(newPath, files[fileID].body)
      .then(() => {
        setFiles(newFiles);
        saveFilesToStore(newFiles);
      })
    } else {
      const oldPath = files[fileID].path;
      fileHelper.renameFile(oldPath, newPath)
      .then(() => {
        setFiles(newFiles);
        saveFilesToStore(newFiles);
      })
    }
  }

  const fileSearch = (keyword) => {
    console.log('fileSearch');
    const newFiles = filesArr.filter(file => file.title.includes(keyword));
    setSearchedFiles(newFiles);
  }

  const createNewFile = () => {
    const newID = uuidv4();
    const newFile = {
      id: newID,
      path: savedLocation,
      title: '',
      body: '## 请输入Markdown',
      createdAt: new Date().getTime(),
      isNew: true,
    }
    setFiles({ ...files, [newID]: newFile });
  }

  const saveCurrentFile = () => {
    const { path, body, title } = activeFile;
    fileHelper.writeFile(path, body).then(() => {
      setUnsavedFileIDs(unsavedFileIDs.filter(fileID => fileID !== activeFileID));
      // 如果配置信息齐全且自动同步为true，执行上传文件操作;
      if(getAutoSync()) {
        ipcRenderer.send('upload-file', {
          key: `${title}.md`, path
        })
      }
    })
  }

  const importFiles = () => {
    remote.dialog.showOpenDialog({
      title: '选择想要导入的Markdown文件',
      properties: [ 'openFile', 'multiSelections' ],
      filters: [
        { name: 'Markdown files', extensions: [ 'md' ] }
      ]
    }).then(({filePaths}) => {
      if(Array.isArray(filePaths)) {
        // 将我们已经在store中的文件过滤
        const filteredPaths = filePaths.filter(filePath => {
          const alreadyAddedFile = Object.values(files).find(file => {
            return file.path === filePath;
          })
          return !alreadyAddedFile;
        })
        // 扩展path数组为fileInfo数组
        const importFilesArr = filteredPaths.map(filePath => {
          return {
            id: uuidv4(),
            title: basename(filePath, extname(filePath)),
            path: filePath,
          }
        })
        // 将array转换为flatten state
        const newFiles = { ...files, ...flattenArray(importFilesArr) }
        // console.log(newFiles);
        setFiles(newFiles);
        saveFilesToStore(newFiles);
        if(importFilesArr.length > 0) {
          remote.dialog.showMessageBox({
            type: 'info',
            title: `成功导入了${importFilesArr.length}个文件`,
            message: `成功导入了${importFilesArr.length}个文件`
          })
        }
      }
    })
  }

  const activeFileUploaded = () => {
    const { id } = activeFile;
    const modifiedFile = { ...files[id], isSynced: true, updatedAt: new Date().getTime() };
    const newFiles = { ...files, [id]: modifiedFile };
    setFiles(newFiles);
    saveFilesToStore(newFiles);
  }

  const activeFileDownloaded = (event, message) => {
    if(message.status === 'download-success') {
      const currentFile = files[message.id];
      console.log(currentFile);
      const { id, path } = currentFile;
      fileHelper.readFile(path).then(value => {
        let newFile;
        if(message.status === 'download-success') {
          newFile = { 
            ...files[id], 
            body: value, 
            isLoaded: true, 
            isSynced: true, 
            updatedAt: new Date().getTime() 
          }
        } else {
          newFiles = {
            ...files[id], body: value, isLoaded: true
          }
        }
        const newFiles = { ...files, [id]: newFile }
        setFiles(newFiles);
        saveFilesToStore(newFiles);
      })
    } else if(message.status === 'no-file' || message.status === 'no-new-file') {
      // 云端不存在要下载的文件或者本地文件比云端文件更新，我们需要从本地加载;      
      const { id } = message;
      const currentFile = files[id];
      fileHelper.readFile(currentFile.path).then((result) => {
        const newFile = { ...files[id], body: result, isLoaded: true }
        setFiles({ ...files, [id]: newFile });
      })  
    }
  }

  const filesUploaded = () => {
    const newFiles = objToArr(files).reduce((result, file) => {
      const currentTime = new Date().getTime();
      result[file.id] = {
        ...files[file.id],
        isSynced: true,
        updatedAt: currentTime
      }
      return result
    }, {})
    setFiles(newFiles)
    saveFilesToStore(newFiles);
  }
  
  useIPCRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'search-file': fileSearch,
    'active-file-uploaded': activeFileUploaded,
    'file-downloaded': activeFileDownloaded,
    'loading-status': (message, status) => {
      setLoading(status);
    },
    'files-uploaded': filesUploaded
  })

  return (
    <div className="App container-fluid px-0">
      {
        isLoading && <Loader text='处理中' />
      }
      <div className="row no-gutters">
        <div className="col-3 left-panel bg-light">
          <FileSearch title='我的云文档' 
            onFileSearch={ (keyword) => { fileSearch(keyword); }} 
          />
          <FileList 
            files={fileListArray}
            onFileClick={ fileClick }
            onFileDelete={ deleteFile }
            onSaveEdit={(id, newValue, isNew) => { updateFileName(id, newValue, isNew) }}
          />
          <div className="row no-gutters button-group">
            <div className="col">
              <BottomBtn text='新建' colorClass='btn-primary' icon={faPlus} 
                onBtnClick={ createNewFile } 
              />
            </div>
            <div className="col">
              <BottomBtn text='导入' colorClass='btn-success' icon={faFileImport} 
                onBtnClick={ importFiles }
              />
            </div>
          </div>
        </div>
        <div className="col-9 right-panel">
          {
            (!activeFile || openedFileIDs.length === 0) && 
            <div className='start-page'>
              选择或者创建新的Markdown文档
            </div>
          }
          {
            activeFile && (openedFileIDs.length > 0) &&
            <>
              <TabList files={openedFiles} 
                onTabClick={ tabClick }
                activeId={activeFileID}
                unsavedIds={unsavedFileIDs}
                onTabClose={ tabClose }
              />
              <SimpleMDE
                key={activeFile.id}
                value={activeFile.body}
                onChange={(value) => { fileChange(activeFileID, value) }}
                options={{
                  minHeight: '513px'
                }}
              />
              {
                activeFile.isSynced && 
                <span className="sync-status">已同步, 上次同步时间: {timeStampToString(activeFile.updatedAt)}</span>
              }
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
