import React from 'react'

/**
 * ASR状态指示器组件
 * 显示语音识别连接和录音状态
 */
const ASRStatusIndicator = ({ 
  isConnected, 
  isRecording, 
  className = '' 
}) => {
  const getStatusConfig = () => {
    if (isRecording) {
      return {
        dotColor: 'bg-red-500',
        textColor: 'text-red-600',
        text: '录音中'
      }
    }
    
    if (isConnected) {
      return {
        dotColor: 'bg-green-500',
        textColor: 'text-green-600',
        text: '语音就绪'
      }
    }
    
    return {
      dotColor: 'bg-gray-400',
      textColor: 'text-gray-500',
      text: '语音未连接'
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`flex items-center space-x-1.5 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${
          isRecording ? 'animate-pulse' : ''
        } ${config.dotColor}`} 
      />
      <span className={`text-xs ${config.textColor}`}>
        {config.text}
      </span>
    </div>
  )
}

export default ASRStatusIndicator
