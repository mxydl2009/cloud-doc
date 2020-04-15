import React, { useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

const BottomBtn = ({ text, colorClass, icon, onBtnClick }) => {
  // 定义ref来获取button节点，button节点单击后，取消其自动获得焦点，不然按下enter键会触发button的click事件；
  const btn = useRef(null);
  return (
    <>
      <button type='button'
        className={`btn btn-block no-border ${colorClass}`}
        ref={btn}
        onClick={() => { onBtnClick(); btn.current.blur(); }}
      >
        <FontAwesomeIcon size='lg' icon={icon} className='mr-2' />
        { text }
      </button>
    </>
  )
}

BottomBtn.propTypes = {
  text: PropTypes.string,
  colorClass: PropTypes.string,
  icon: PropTypes.object.isRequired,
  onBtnClick: PropTypes.func
}

BottomBtn.defaultProps = {
  text: '新建'
}

export default BottomBtn