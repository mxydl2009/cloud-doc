import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
import useContextMenu from '../hooks/useContextMenu'
import { getParentNode } from '../utils/helper'

// 加载electron的模块
const { remote } = window.require('electron');
const { Menu, MenuItem  } = remote;

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
  const [ editStatus, setEditStatus ] = useState(false);
  const [ value, setValue ] = useState('');
  const inputFocus = useRef(null);
  const enterPressed = useKeyPress(13);
  const escPressed = useKeyPress(27);

  const closeSearch = (file) => {
    setEditStatus(false);
    setValue('');
    // 新建文件进入编辑文件标题状态，如果按下esc或点击关闭图标，则退出编辑态，删除这个新建的文件;
    // 如果item有isNew:true属性，则删除这个item;
    if(file && file.isNew) {
      onFileDelete(file.id);
    }
  }

  const clickedItem = useContextMenu([
    {
      label: '打开',
      click: () => {
        const parentElement = getParentNode(clickedItem.current, 'file-item');
        if(parentElement) {
          onFileClick(parentElement.dataset.id);
        }
      }
    },
    {
      label: '重命名',
      click: () => {
        const parentElement = getParentNode(clickedItem.current, 'file-item');
        if(parentElement) {
          setEditStatus(parentElement.dataset.id); 
          setValue(parentElement.dataset.title);
        }
      }
    },
    {
      label: '删除',
      click: () => {
        const parentElement = getParentNode(clickedItem.current, 'file-item');
        if(parentElement) {
          onFileDelete(parentElement.dataset.id);
        }
      }
    }
  ], '.file-list', [ files ])

  useEffect(() => {
    if(editStatus) {
      inputFocus.current.focus();
    }
    if(enterPressed && editStatus && value.trim() !== '') {
      const editItem = files.find(file => file.id === editStatus);
      onSaveEdit(editItem.id, value, editItem.isNew);
      setEditStatus(false);
      setValue('');
    }
    if(escPressed && editStatus) {
      const quitItem = files.find(file => file.isNew === true);
      closeSearch(quitItem);
    }
    // const handleInputEvent = (event) => {
    //   console.log('FileList');
    //   const { keyCode } = event;
    //   if(keyCode === 13 && editStatus) {
    //     const editItem = files.find(file => file.id === editStatus);
    //     onSaveEdit(editItem.id, value);
    //     setEditStatus(false);
    //     setValue('');
    //   } else if(keyCode === 27 && editStatus) {
    //     closeSearch();
    //   }
    // }
    // document.addEventListener('keyup', handleInputEvent);
    // return () => {
    //   document.removeEventListener('keyup', handleInputEvent);
    // }
  })

  useEffect(() => {
    const newFile = files.find(file => file.isNew);
    if(newFile) {
      setEditStatus(newFile.id);
      setValue(newFile.title);
      inputFocus.current.focus();
    }
  }, [ files ])

  return (
    <>
      <ul className="file-list list-group list-group-flush">
        {
          files.map(file => {
            return (
              <li 
                className='row mx-0 px-2 list-group-item bg-light d-flex align-items-center file-item'
                key={file.id}
                data-id={file.id}
                data-title={file.title}
              >
                { (file.id !== editStatus && !file.isNew) &&
                  <>
                    <span className='col-2'>
                      <FontAwesomeIcon icon={faMarkdown} size="lg" />
                    </span>
                    <span 
                      className='col-6 c-link'
                      onClick={() => { onFileClick(file.id) }}
                      onDoubleClick={ () => { setEditStatus(file.id); setValue(file.title);} }
                    >
                      { file.title }
                    </span>
                    {/* <button type='button' className='icon-button col-2'
                      onClick={() => { setEditStatus(file.id); setValue(file.title); }}
                    >
                      <FontAwesomeIcon title='编辑' icon={faEdit} size="lg" />
                    </button>
                    <button type='button' className='icon-button col-2'
                      onClick={() => { onFileDelete(file.id) }}
                    >
                      <FontAwesomeIcon title='删除' icon={faTrash} size="lg" />
                    </button> */}
                  </>
                }
                {
                  ((file.id === editStatus) || file.isNew) &&
                  <>
                    <input type="text"
                      className='form-control col-10'
                      value={value}
                      ref={inputFocus}
                      placeholder='请输入文件名称'
                      onChange={(e) => { setValue(e.target.value) }}
                    />
                    <button type='button' className='icon-button col-2'
                      onClick={(event) => { closeSearch(file); }}
                    >
                      <FontAwesomeIcon title='关闭' icon={faTimes} size="lg" />
                    </button>
                  </>
                }
              </li>
            )
          })
        }
      </ul>
    </>
  )
}

FileList.propTypes = {
  files: PropTypes.array,
  onFileClick: PropTypes.func,
  onFileDelete: PropTypes.func,
  onSaveEdit: PropTypes.func
}

export default FileList