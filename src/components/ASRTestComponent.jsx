import React, { useEffect, useState } from 'react'
import { useASRStore } from '../stores/asrStore'
import { useWebSocket } from '../contexts/WebSocketContext'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Mic, MicOff, Wifi, WifiOff } from 'lucide-react'

/**
 * ASR测试组件
 * 用于测试ASR与WebSocket的集成是否正常工作
 */
const ASRTestComponent = () => {
  const [testResults, setTestResults] = useState([])
  const [inputText, setInputText] = useState('')

  const {
    recording,
    recognition,
    ui: asrUI,
    connection: asrConnection,
    startContinuousASR,
    stopContinuousASR,
    updateConnectionFromContext
  } = useASRStore()

  const { connectionStatus, wsRef } = useWebSocket()

  // 同步WebSocket连接状态
  useEffect(() => {
    if (updateConnectionFromContext) {
      updateConnectionFromContext(wsRef, connectionStatus)
    }
  }, [connectionStatus, wsRef, updateConnectionFromContext])

  // 监听ASR事件
  useEffect(() => {
    const handleASRInputUpdate = (event) => {
      const { text, mode } = event.detail
      console.log('🎤 ASR输入更新:', text, mode)
      setInputText(text)
      addTestResult(`输入更新: ${text} (${mode})`, 'info')
    }

    const handleASRResult = (event) => {
      const { text, mode } = event.detail
      console.log('🎤 ASR最终结果:', text, 'mode:', mode)
      setInputText(text)
      addTestResult(`最终结果: ${text} (${mode || 'normal'})`, 'success')
    }

    const handleASRError = (event) => {
      const { error } = event.detail
      console.error('❌ ASR错误:', error)
      addTestResult(`错误: ${error}`, 'error')
    }

    const handleASRStopped = (event) => {
      const { mode, error } = event.detail
      console.log('🎤 ASR已停止:', mode)
      if (error) {
        addTestResult(`ASR停止 (${mode}) - 错误: ${error}`, 'error')
      } else {
        addTestResult(`ASR停止 (${mode})`, 'info')
      }
    }

    window.addEventListener('asrInputUpdate', handleASRInputUpdate)
    window.addEventListener('asrResult', handleASRResult)
    window.addEventListener('asrError', handleASRError)
    window.addEventListener('asrStopped', handleASRStopped)

    return () => {
      window.removeEventListener('asrInputUpdate', handleASRInputUpdate)
      window.removeEventListener('asrResult', handleASRResult)
      window.removeEventListener('asrError', handleASRError)
      window.removeEventListener('asrStopped', handleASRStopped)
    }
  }, [])

  const addTestResult = (message, type) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestResults(prev => [...prev.slice(-9), { message, type, timestamp }])
  }

  const handleToggleASR = () => {
    if (recording.isContinuousMode) {
      stopContinuousASR()
      addTestResult('停止持续ASR', 'info')
    } else {
      // 开始持续ASR前先停止所有TTS音频
      console.log('🛑 停止所有TTS音频以开始持续ASR')
      window.dispatchEvent(new CustomEvent('stopAllTTS'))
      window.dispatchEvent(new CustomEvent('clearAudioQueue'))
      addTestResult('停止所有TTS音频', 'info')

      startContinuousASR()
      addTestResult('开始持续ASR', 'info')
    }
  }

  const clearResults = () => {
    setTestResults([])
    setInputText('')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800'
      case 'connecting': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-red-100 text-red-800'
    }
  }

  const getResultColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'info': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="w-5 h-5" />
            <span>ASR集成测试</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 连接状态 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4" />
              <span className="text-sm">WebSocket:</span>
              <Badge className={getStatusColor(connectionStatus)}>
                {connectionStatus}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4" />
              <span className="text-sm">ASR连接:</span>
              <Badge className={asrConnection.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {asrConnection.isConnected ? '已连接' : '未连接'}
              </Badge>
            </div>
          </div>

          {/* ASR状态 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm">
              <span className="font-medium">录音状态:</span>
              <div className={recording.isRecording ? 'text-red-600' : 'text-gray-600'}>
                {recording.isRecording ? '录音中' : '未录音'}
              </div>
            </div>
            <div className="text-sm">
              <span className="font-medium">持续模式:</span>
              <div className={recording.isContinuousMode ? 'text-blue-600' : 'text-gray-600'}>
                {recording.isContinuousMode ? '激活' : '未激活'}
              </div>
            </div>
            <div className="text-sm">
              <span className="font-medium">置信度:</span>
              <div className="text-gray-600">
                {recognition.confidence ? `${Math.round(recognition.confidence * 100)}%` : 'N/A'}
              </div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex space-x-2">
            <Button
              onClick={handleToggleASR}
              disabled={!asrConnection.isConnected}
              variant={recording.isContinuousMode ? "default" : "outline"}
            >
              {recording.isContinuousMode ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
              {recording.isContinuousMode ? '停止持续ASR' : '开始持续ASR'}
            </Button>
            <Button onClick={clearResults} variant="ghost">
              清除结果
            </Button>
          </div>

          {/* 当前识别文本 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">当前识别文本:</div>
            <div className="p-3 bg-gray-50 rounded border min-h-[60px]">
              {inputText || '等待语音输入...'}
            </div>
          </div>

          {/* 持续模式详细信息 */}
          {recording.isContinuousMode && (
            <div className="space-y-2">
              <div className="text-sm font-medium">持续模式详情:</div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="p-2 bg-blue-50 rounded">
                  <span className="font-medium">累积文本:</span>
                  <div className="mt-1">{recognition.continuousText || '无'}</div>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <span className="font-medium">片段数量:</span> {recognition.continuousSegments?.length || 0}
                </div>
                <div className="p-2 bg-yellow-50 rounded">
                  <span className="font-medium">最后片段:</span>
                  <div className="mt-1">{recognition.lastContinuousSegment || '无'}</div>
                </div>
                {recognition.continuousSegments?.length > 0 && (
                  <div className="p-2 bg-purple-50 rounded">
                    <span className="font-medium">所有片段:</span>
                    <div className="mt-1 space-y-1">
                      {recognition.continuousSegments.map((segment, index) => (
                        <div key={index} className="text-xs bg-white p-1 rounded">
                          {index + 1}: {segment}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ASR UI状态 */}
          {asrUI.showStatus && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded">
              <div className="text-sm text-blue-800">{asrUI.statusText}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 测试结果日志 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">测试结果日志</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-gray-500 text-sm">暂无测试结果</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-400 text-xs">{result.timestamp}</span>
                  <span className={getResultColor(result.type)}>{result.message}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>1. 确保WebSocket连接状态为"connected"</div>
          <div>2. 确保ASR连接状态为"已连接"</div>
          <div>3. 点击"开始持续ASR"按钮开始语音识别</div>
          <div>4. 对着麦克风说话，观察识别结果</div>
          <div>5. 也可以长按空格键进行语音输入</div>
          <div>6. 查看测试结果日志了解详细信息</div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ASRTestComponent
