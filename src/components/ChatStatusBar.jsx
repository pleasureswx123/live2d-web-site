import React from 'react'
import ConnectionStatusIndicator from './ConnectionStatusIndicator'
import ASRStatusIndicator from './ASRStatusIndicator'

/**
 * 聊天状态栏组件
 * 显示连接状态、ASR状态和快捷键提示
 */
const ChatStatusBar = ({ 
  connectionStatus,
  enableASR = false,
  isRecording,
  className = ''
}) => {
  // ASR连接状态完全依赖于WebSocket连接状态
  const isASRConnected = connectionStatus === 'connected'

  return (
    <div className={`flex items-center justify-between mt-2 px-1 ${className}`}>
      {/* 左侧状态信息 */}
      <div className="flex items-center space-x-4 text-xs">
        {/* 连接状态 */}
        <ConnectionStatusIndicator connectionStatus={connectionStatus} />

        {/* ASR状态 */}
        {enableASR && (
          <ASRStatusIndicator
            isConnected={isASRConnected}
            isRecording={isRecording}
          />
        )}
      </div>

      {/* 右侧快捷键提示 */}
      <div className="hidden sm:flex items-center space-x-3 text-xs text-gray-500">
        {enableASR && isASRConnected && (
          <div className="flex items-center space-x-1.5">
            <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
              Space
            </kbd>
            <span>长按语音输入</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatStatusBar
