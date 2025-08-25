import React from 'react'
import { motion } from 'framer-motion'
import { Wifi, WifiOff } from 'lucide-react'

/**
 * 用户状态指示器组件
 * @param {object} session - 会话信息对象
 * @param {string} type - 显示类型 ('icon' | 'dot' | 'both' | 'text')
 * @param {object} props - 其他属性
 */
const UserStatusIndicator = ({ session, type = 'both', ...props }) => {
  const isOffline = session.isOffline

  // 状态文本
  const statusText = isOffline ? '离线' : '在线'
  const statusTitle = isOffline ? '离线模式' : '在线'

  // 渲染图标
  const renderIcon = () => {
    if (type === 'dot' || type === 'text') return null
    
    return isOffline ? (
      <WifiOff 
        size={16} 
        className="text-red-500" 
        title={statusTitle}
      />
    ) : (
      <Wifi 
        size={16} 
        className="text-green-500" 
        title={statusTitle}
      />
    )
  }

  // 渲染状态点
  const renderDot = () => {
    if (type === 'icon' || type === 'text') return null
    
    return (
      <motion.span
        className={`online-indicator w-2 h-2 rounded-full ${
          type === 'both' ? 'ml-1' : ''
        } ${
          isOffline ? 'bg-red-500' : 'bg-green-500'
        }`}
        animate={{
          scale: isOffline ? [1, 1.2, 1] : 1,
          opacity: isOffline ? [1, 0.5, 1] : 1
        }}
        transition={{
          duration: 2,
          repeat: isOffline ? Infinity : 0
        }}
        title={statusTitle}
      />
    )
  }

  // 渲染文本
  const renderText = () => {
    if (type !== 'text') return null
    
    return (
      <span
        className={`text-xs font-medium ${
          isOffline ? 'text-red-500' : 'text-green-500'
        }`}
        title={statusTitle}
      >
        {statusText}
      </span>
    )
  }

  return (
    <div className="flex items-center" {...props}>
      {renderIcon()}
      {renderDot()}
      {renderText()}
    </div>
  )
}

export default UserStatusIndicator
