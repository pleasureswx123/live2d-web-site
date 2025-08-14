import React, { useEffect } from 'react'
import { useASRStore } from '../stores/asrStore'
import { useWebSocket } from '../contexts/WebSocketContext'

/**
 * ASR与WebSocket集成示例组件
 * 展示如何在组件中使用ASR Store和WebSocket Context
 */
const ASRIntegrationExample = () => {
  const asrStore = useASRStore()
  const { wsRef, connectionStatus } = useWebSocket()

  // 监听WebSocket连接状态变化，同步到ASR Store
  useEffect(() => {
    if (asrStore.updateConnectionFromContext) {
      asrStore.updateConnectionFromContext(wsRef, connectionStatus)
    }
  }, [connectionStatus, wsRef, asrStore])

  // 监听ASR事件
  useEffect(() => {
    const handleASRResult = (event) => {
      console.log('🎤 收到ASR结果事件:', event.detail)
      // 在这里可以处理ASR识别结果
    }

    const handleASRError = (event) => {
      console.log('❌ 收到ASR错误事件:', event.detail)
      // 在这里可以处理ASR错误
    }

    const handleASRInputUpdate = (event) => {
      console.log('📝 收到ASR输入更新事件:', event.detail)
      // 在这里可以更新输入框内容
    }

    // 注册事件监听器
    window.addEventListener('asrResult', handleASRResult)
    window.addEventListener('asrError', handleASRError)
    window.addEventListener('asrInputUpdate', handleASRInputUpdate)

    return () => {
      // 清理事件监听器
      window.removeEventListener('asrResult', handleASRResult)
      window.removeEventListener('asrError', handleASRError)
      window.removeEventListener('asrInputUpdate', handleASRInputUpdate)
    }
  }, [])

  const handleStartSpaceKeyASR = () => {
    asrStore.startSpaceKeyASR()
  }

  const handleStopSpaceKeyASR = () => {
    asrStore.stopSpaceKeyASR()
  }

  const handleStartContinuousASR = () => {
    asrStore.startContinuousASR()
  }

  const handleStopContinuousASR = () => {
    asrStore.stopContinuousASR()
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">ASR与WebSocket集成示例</h3>
      
      {/* 连接状态显示 */}
      <div className="mb-4">
        <p className="text-sm">
          WebSocket状态: 
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {connectionStatus}
          </span>
        </p>
        <p className="text-sm">
          ASR连接状态: 
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            asrStore.connection.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {asrStore.connection.isConnected ? '已连接' : '未连接'}
          </span>
        </p>
      </div>

      {/* ASR状态显示 */}
      <div className="mb-4">
        <p className="text-sm">录音状态: {asrStore.recording.isRecording ? '录音中' : '未录音'}</p>
        <p className="text-sm">长按空格键ASR: {asrStore.recording.isSpaceKeyASRActive ? '激活' : '未激活'}</p>
        <p className="text-sm">持续模式: {asrStore.recording.isContinuousMode ? '激活' : '未激活'}</p>
        <p className="text-sm">当前识别文本: {asrStore.recognition.currentText || '无'}</p>
        <p className="text-sm">最佳识别文本: {asrStore.recognition.bestText || '无'}</p>
      </div>

      {/* 控制按钮 */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={handleStartSpaceKeyASR}
            disabled={asrStore.recording.isSpaceKeyASRActive || !asrStore.connection.isConnected}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            开始长按空格键ASR
          </button>
          <button
            onClick={handleStopSpaceKeyASR}
            disabled={!asrStore.recording.isSpaceKeyASRActive}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
          >
            停止长按空格键ASR
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleStartContinuousASR}
            disabled={asrStore.recording.isContinuousMode || !asrStore.connection.isConnected}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
          >
            开始持续模式ASR
          </button>
          <button
            onClick={handleStopContinuousASR}
            disabled={!asrStore.recording.isContinuousMode}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
          >
            停止持续模式ASR
          </button>
        </div>
      </div>

      {/* UI状态显示 */}
      {asrStore.ui.showStatus && (
        <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">{asrStore.ui.statusText}</p>
        </div>
      )}
    </div>
  )
}

export default ASRIntegrationExample
