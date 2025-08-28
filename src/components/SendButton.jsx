import React from 'react'
import { Button } from './ui/button'
import { Send } from 'lucide-react'

/**
 * 发送按钮组件
 * 显示发送状态和加载动画
 */
const SendButton = ({ 
  onClick,
  disabled,
  isSending,
  className = ''
}) => {
  // 渲染按钮图标
  const renderIcon = () => {
    if (isSending) {
      return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    }
    return <Send className="w-4 h-4" />
  }
  
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`p-2.5 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
        disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:scale-100'
          : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md'
      } ${className}`}
    >
      {renderIcon()}
    </Button>
  )
}

export default SendButton
