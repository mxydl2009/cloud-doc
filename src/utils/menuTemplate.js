const { app, shell, ipcMain } = require('electron')
const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings' })

const qiniuIsConfiged = ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key));
let enableAutoSync = settingsStore.get('enableAutoSync');

const template = [
  {
    label: '文件',
    submenu: [
      {
        label: '新建',
        accelerator: 'CmdOrCtrl+N',
        // browserWindow当前窗口;
        click: (menuItem, browserWindow, event) => {
          browserWindow.webContents.send('create-new-file')
        }
      },
      {
        label: '保存',
        accelerator: 'CmdOrCtrl+S',
        click: (menuItem, browserWindow, event) => {
          browserWindow.webContents.send('save-edit-file')
        }
      },
      {
        label: '搜索',
        accelerator: 'CmdOrCtrl+F',
        click: (menuItem, browserWindow, event) => {
          browserWindow.webContents.send('search-file')
        }
      },
      {
        label: '导入',
        accelerator: 'CmdOrCtrl+O',
        click: (menuItem, browserWindow, event) => {
          browserWindow.webContents.send('import-file')
        }
      }
    ]
  },
  {
    label: '云同步',
    submenu: [
      {
        label: '设置',
        accelerator: 'Command+,',
        click: () => {
          ipcMain.emit('open-setting-window')
        }
      },
      {
        label: '自动同步',
        type: 'checkbox',
        checked: enableAutoSync,
        enabled: qiniuIsConfiged,
        click: () => {
          settingsStore.set('enableAutoSync', !enableAutoSync)
        }
      },
      {
        label: '全部同步至云端',
        enabled: qiniuIsConfiged,
        click: () => {
          ipcMain.emit('upload-all-to-qiniu')
        }
      },
      {
        label: '从云端下载到本地',
        enabled: qiniuIsConfiged,
        click: () => {
          ipcMain.emit('')
        }
      }
    ]
  },
  {
    label: '编辑',
    submenu: [
      {
        label: '撤销',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
      },
      {
        label: '重做',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: '剪切',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
      },
      {
        label: '复制',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
      },
      {
        label: '粘贴',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
      },
      {
        label: '选择所有',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
      },
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.reload();
        }
      },
      {
        label: 'Toggle Full Screen',
        accelerator: (function() {
          if (process.platform === 'darwin')
            return 'Ctrl+Command+F';
          else
            return 'F11';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: (function() {
          if (process.platform === 'darwin')
            return 'Alt+Command+I';
          else
            return 'Ctrl+Shift+I';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.toggleDevTools();
        }
      },
    ]
  },
  {
    label: 'Window',
    role: 'window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
      },
    ]
  },
  {
    label: 'Help',
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: function() { shell.openExternal('http://electron.atom.io') }
      },
    ]
  },
];

if (process.platform === 'darwin') {
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        label: '设置',
        accelerator: 'Command+,',
        click: () => {
          ipcMain.emit('open-setting-window')
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Services',
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide ' + name,
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        role: 'hideothers'
      },
      {
        label: 'Show All',
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: function() { app.quit(); }
      },
    ]
  });
  const windowMenu = template.find(function(m) { return m.role === 'window' })
  if (windowMenu) {
    windowMenu.submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        role: 'front'
      }
    );
  }
}

module.exports = template;