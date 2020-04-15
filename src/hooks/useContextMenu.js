import { useEffect, useRef } from 'react'

const { remote } = window.require('electron');
const { Menu, MenuItem } = remote;

// 传入菜单项数组itemArr
const useContextMenu = (itemArr, targetSelector, deps) => {
  let clickedElement = useRef(null);
  useEffect(() => {
    const menu = new Menu();
    itemArr.forEach(item => {
      menu.append(new MenuItem(item));
    })
    const handleContextMenu = (e) => {
      // 只有发生事件的元素是targetSelector的子元素时，才在当前窗口弹出菜单;
      if(document.querySelector(targetSelector).contains(e.target)) {
        clickedElement.current = e.target;
        menu.popup({
          window: remote.getCurrentWindow()
        })        
      }
    }
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    }
  }, deps);
  return clickedElement
}

export default useContextMenu