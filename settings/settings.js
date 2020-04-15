const { remote, ipcRenderer } = require('electron')
const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings' })
const qiniuConfigArr = ['#savedFileLocation', '#accessKey', '#secretKey', '#bucketName']

const $ = (selector) => {
  const result =  document.querySelectorAll(selector);
  return result.length > 1? result: result[0];
}

document.addEventListener('DOMContentLoaded', () => {
  // 获取保存好的设置信息;
  qiniuConfigArr.forEach(selector => {
    const savedValue = settingsStore.get(selector.substr(1));
    if(savedValue) {
      $(selector).value = savedValue;
    }
  })
  $('#select-new-location').addEventListener('click', () => {
    remote.dialog.showOpenDialog({
      properties: [ 'openDirectory' ],
      message: '选择文件的存储路径',
    }).then(({filePaths}) => {
      if(Array.isArray(filePaths)) {
        $('#savedFileLocation').value = filePaths[0];
        savedLocation = filePaths[0];
      }
    })
  })
  $('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    qiniuConfigArr.forEach(selector => {
      if($(selector)) {
        let { id, value } = $(selector);
        settingsStore.set(id, value);    
      }
    })
    // 给主进程发送事件，使得菜单项读取配置信息，动态更新;
    ipcRenderer.send('config-is-saved');
    remote.getCurrentWindow().close();
  })
  $('.nav-tabs').addEventListener('click', (e) => {
    e.preventDefault();
    $('.nav-link').forEach((ele) => {
      ele.classList.remove('active');
      e.target.classList.add('active');
      $('.config-area').forEach(ele => {
        ele.style.display = 'none';
      })
      $(e.target.dataset.tab).style.display = 'block';
    })
  })
})