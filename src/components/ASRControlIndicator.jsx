import React from 'react'
import {Mic} from 'lucide-react'

/**
 * ASR控制指示器组件
 * 专门用于聊天界面中的ASR状态显示，包含悬停提示
 */
const ASRControlIndicator = ({
  enableASR = false,
  isRecording = false,
  connectionStatus,
  className = ""
}) => {
  if (!enableASR) {
    return null
  }

  const isASRConnected = connectionStatus === 'connected'

  return (
    <div className={`relative group ${className}`}>
      <div className={`p-2 rounded-lg transition-all duration-200 ${
        isRecording
          ? 'bg-red-100 text-red-600'
          : isASRConnected
          ? 'bg-green-50 text-green-600'
          : 'bg-orange-50 text-orange-600'
      }`}>
        <Mic className="w-4 h-4" />
      </div>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {isRecording
          ? '正在录音'
          : isASRConnected
          ? '语音识别就绪'
          : '语音识别未连接'
        }
      </div>
    </div>
  )
}

export default ASRControlIndicator
