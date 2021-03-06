import { useState, useEffect } from 'react'

// 自定义hook,传入keyCode作参数，处理所有的keyPress事件;
const useKeyPress = (targetKeyCode) => {
  // keyPressed来标识key有没有被press
  const [ keyPressed, setKeyPressed ] = useState(false);

  const keyDownHandler = ({ keyCode }) => {
    if(keyCode === targetKeyCode) {
      setKeyPressed(true);
    }
  }
  const keyUpHandler = ({ keyCode }) => {
    if(keyCode === targetKeyCode) {
      setKeyPressed(false);
    }
  }
  
  useEffect(() => {
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
      document.removeEventListener('keyup', keyUpHandler);
    }
  }, [])

  return keyPressed;
}

export default useKeyPress