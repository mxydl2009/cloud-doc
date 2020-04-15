import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'

const FileSearch = ({title, onFileSearch}) => {
  const [inputActive, setInputActive] = useState(false);
  const [ value, setValue ] = useState('');
  const enterPressed = useKeyPress(13);
  const escPressed = useKeyPress(27);

  const closeSearch = () => {
    setInputActive(false);
    setValue('');
    onFileSearch('');
  }

  let node = useRef(null);

  useEffect(() => {
    if(enterPressed && inputActive) {
      onFileSearch(value);
    }
    if(escPressed && inputActive) {
      closeSearch();
    }
    // const handleInputEvent = (event) => {
    //   console.log('FileSearch')
    //   const { keyCode } = event;
    //   if(keyCode === 13 && inputActive) {
    //     onFileSearch(value);
    //   } else if(keyCode === 27 && inputActive) {
    //     closeSearch(event);
    //   }
    // }
    // document.addEventListener('keyup', handleInputEvent);
    // return () => {
    //   document.removeEventListener('keyup', handleInputEvent);
    // }
  })

  useEffect(() => {
    if(inputActive) {
      node.current.focus();
    }
  }, [ inputActive ])

  return (
    <div
      className="mb-0 file-search alert alert-primary d-flex justify-content-between align-items-center"
      onDoubleClick={() => { setInputActive(true) }}
    >
      {
        !inputActive && 
        <>
          <span>{title}</span>
          <button type='button' className='icon-button'
            onClick={() => { setInputActive(true) }}
          >
            <FontAwesomeIcon title='搜索' icon={faSearch} size="lg" />
          </button>
        </>
      }
      {
        inputActive && 
        <>
          <input type="text"
            className='form-control'
            value={value}
            onChange={(e) => { setValue(e.target.value) }}
            ref={node}
          />
          <button type='button' className='icon-button'
            onClick={(event) => { closeSearch(event); }}
          >
            <FontAwesomeIcon title='关闭' icon={faTimes} size="lg" />
          </button>
        </>
      }
    </div>
  )
}

FileSearch.propTypes = {
  title: PropTypes.string,
  onFileSearch: PropTypes.func
}

FileSearch.defaultProps = {
  title: '我的云文档'
}
 
export default FileSearch