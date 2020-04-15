const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const path = require('path');
const isDev = require('electron-is-dev')
const menuTemplate = require('./src/utils/menuTemplate')
const AppWindow = require('./src/AppWindow')
const QiniuManager = require('./src/utils/QiniuManager')
const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings' })
const fileStore = new Store({ name: 'FilesData' })

let mainWindow, settingsWindow;

const createManager = () => {
  const accessKey = settingsStore.get('accessKey');
  const secretKey = settingsStore.get('secretKey');
  const bucketName = settingsStore.get('bucketName');
  return new QiniuManager(accessKey, secretKey, bucketName);
}
app.on('ready', () => {
  const mainWindowConfig = {
    width: 1200,
    height: 768
  }
  const urlLocation = isDev ? 'http://localhost:3000': 'dummyurl';
  mainWindow = new AppWindow(mainWindowConfig, urlLocation);
  mainWindow.on('close', () => {
    mainWindow = null;
  })
  // 为应用设置原生菜单
  let menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  ipcMain.on('open-setting-window', () => {
    const settingsWindowConfig = {
      width: 500,
      height: 400,
      parent: mainWindow
    }
    const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`;
    settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation);
    settingsWindow.removeMenu();
    settingsWindow.on('close', () => {
      settingsWindow = null;
    })
  })
  ipcMain.on('config-is-saved', () => {
    // mac和windows下的菜单项索引有所不同
    let qiniuMenu = process.platform === 'darwin'? menu.items[2] : menu.items[1];
    const switchItems = (toggle) => {
      [1, 2, 3].forEach(number => {
        qiniuMenu.submenu.items[number].enabled = toggle;
      })
    }
    const qiniuIsConfiged = ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key));
    if(qiniuIsConfiged) {
      switchItems(true);
    } else {
      switchItems(false);
    }
  })
  ipcMain.on('upload-file', (event, data) => {
    const manager = createManager();
    manager.uploadFile(data.key, data.path)
    .then(data => {
      // 向mainWindow发送事件;
      mainWindow.webContents.send('active-file-uploaded');
      dialog.showMessageBox({
        type: 'info',
        title: '同步成功',
        message: '您的文件已经同步至七牛云'
      });
    })
    .catch(() => {
      dialog.showErrorBox('同步失败', '请检查七牛云的参数是否正确');
    })
  })
  ipcMain.on('download-file', (event, data) => {
    const manager = createManager();
    const filesObj = fileStore.get('files');
    const { key, path, id } = data;
    manager.getState(data.key)
    .then((resp) => {
      const serverUpdatedTime = Math.round(resp.putTime / 10000);
      const localUpdatedTime = filesObj[id].updatedAt;
      // 这里感觉不对，如果没有上传过（即localUpdatedTime为undefined），那肯定下载不到啊；
      // 其实manager.getState(data.key)方法已经对要下载的文件做了是否在云端的处理，所以这里没必要再判断localUpdatedTime是否存在；
      if(serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
        manager.downloadFile(key, path)
        .then(() => {
          mainWindow.webContents.send('file-downloaded', { status: 'download-success', id });
        })
      } else {
        mainWindow.webContents.send('file-downloaded', { status: 'no-new-file', id });
      }
    })
    .catch((err) => {
      if(err.statusCode === 612) {
        mainWindow.webContents.send('file-downloaded', { status: 'no-file', id });
      }
    })
  })
  ipcMain.on('upload-all-to-qiniu', () => {
    mainWindow.webContents.send('loading-status', true);
    const manager = createManager();
    const filesObj = fileStore.get('files') || {};
    const uploadPromiseArr = Object.keys(filesObj).map(key => {
      const file = filesObj[key];
      return manager.uploadFile(`${file.title}.md`, `${file.path}`);
    })
    Promise.all(uploadPromiseArr).then(res => {
      console.log(res);
      dialog.showMessageBox({
        type: 'info',
        title: `成功上传了${res.length}个文件`,
        message: `成功上传了${res.length}个文件`
      })
      mainWindow.webContents.send('files-uploaded', false);
    }).catch(err => {
      dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确');
    }).finally(() => {
      mainWindow.webContents.send('loading-status', false);
    })
  })
  // mainWindow.loadURL(urlLocation);

})
