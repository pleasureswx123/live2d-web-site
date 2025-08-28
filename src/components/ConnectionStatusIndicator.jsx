import React from 'react'

/**
 * 连接状态指示器组件
 * 显示WebSocket连接状态的简单指示器
 */
const ConnectionStatusIndicator = ({ connectionStatus, className = '' }) => {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          dotColor: 'bg-green-500',
          textColor: 'text-green-600',
          text: '已连接'
        }
      case 'connecting':
        return {
          dotColor: 'bg-yellow-500',
          textColor: 'text-yellow-600',
          text: '连接中...'
        }
      case 'disconnected':
        return {
          dotColor: 'bg-red-500',
          textColor: 'text-red-600',
          text: '连接断开'
        }
      default:
        return {
          dotColor: 'bg-gray-400',
          textColor: 'text-gray-500',
          text: '未知状态'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`flex items-center space-x-1.5 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connecting' ? 'animate-pulse' : ''
        } ${config.dotColor}`} 
      />
      <span className={`text-xs ${config.textColor}`}>
        {config.text}
      </span>
    </div>
  )
}

export default ConnectionStatusIndicator
