import React, { useState, useEffect, useRef } from 'react'
import { useASRStore } from '../../stores/asrStore'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'

/**
 * 增强版ASR组件使用示例
 * 展示如何使用增强后的ASR功能，包括持续模式、智能结果处理等
 */
const ASREnhancedExample = () => {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  
  const inputRef = useRef(null)

  // ASR store状态
  const { 
    recording, 
    recognition, 
    ui,
    setWebSocket,
    startSpaceKeyASR,
    stopSpaceKeyASR,
    startContinuousASR,
    stopContinuousASR,
    reset
  } = useASRStore()

  // 监听ASR事件
  useEffect(() => {
    // ASR结果事件
    const handleASRResult = (event) => {
      const { text } = event.detail
      console.log('📥 收到ASR结果:', text)
      setInputValue(text)
      
      // 自动发送消息
      if (text.trim()) {
        handleSendMessage(text)
      }
    }

    // ASR输入框更新事件
    const handleInputUpdate = (event) => {
      const { text, mode } = event.detail
      console.log('📝 输入框更新:', text, '模式:', mode)
      setInputValue(text)
    }

    // ASR实时结果事件
    const handleRealtimeResult = (event) => {
      const { text, isFinal, confidence } = event.detail
      console.log('🔄 实时结果:', text, 'final:', isFinal, 'confidence:', confidence)
      // 实时更新输入框但不发送
      setInputValue(text)
    }

    // ASR自动发送事件
    const handleAutoSend = (event) => {
      const { text } = event.detail
      console.log('🚀 自动发送:', text)
      handleSendMessage(text)
    }

    // ASR错误事件
    const handleASRError = (event) => {
      const { error } = event.detail
      console.error('❌ ASR错误:', error)
      addNotification(`ASR错误: ${error}`, 'error')
    }

    // ASR通知事件
    const handleASRNotification = (event) => {
      const { message, type } = event.detail
      console.log('🔔 ASR通知:', message, type)
      addNotification(message, type)
    }

    // ASR UI更新事件
    const handleUIUpdate = (event) => {
      const { type, text, mode } = event.detail
      console.log('🎨 UI更新:', type, text, mode)
      
      // 根据不同类型更新UI
      switch (type) {
        case 'started':
          addNotification('语音识别已启动', 'info')
          break
        case 'stopped':
          addNotification(`语音识别已停止 (${mode})`, 'info')
          break
        case 'continuousStop':
          addNotification('持续模式已停止', 'info')
          break
        case 'normalStop':
          addNotification('普通模式已停止', 'info')
          break
      }
    }

    // 注册事件监听器
    window.addEventListener('asrResult', handleASRResult)
    window.addEventListener('asrInputUpdate', handleInputUpdate)
    window.addEventListener('asrRealtimeResult', handleRealtimeResult)
    window.addEventListener('asrAutoSend', handleAutoSend)
    window.addEventListener('asrError', handleASRError)
    window.addEventListener('asrNotification', handleASRNotification)
    window.addEventListener('asrUIUpdate', handleUIUpdate)

    return () => {
      // 清理事件监听器
      window.removeEventListener('asrResult', handleASRResult)
      window.removeEventListener('asrInputUpdate', handleInputUpdate)
      window.removeEventListener('asrRealtimeResult', handleRealtimeResult)
      window.removeEventListener('asrAutoSend', handleAutoSend)
      window.removeEventListener('asrError', handleASRError)
      window.removeEventListener('asrNotification', handleASRNotification)
      window.removeEventListener('asrUIUpdate', handleUIUpdate)
    }
  }, [])

  // 发送消息
  const handleSendMessage = (text = inputValue) => {
    if (!text.trim()) return

    const message = {
      id: Date.now(),
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'user'
    }

    setMessages(prev => [...prev, message])
    setInputValue('')
    
    console.log('📤 发送消息:', message)
  }

  // 添加通知
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }
    
    setNotifications(prev => [...prev, notification])
    
    // 3秒后自动移除通知
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 3000)
  }

  // 处理输入变化
  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>增强版ASR语音识别示例</CardTitle>
          <div className="flex items-center space-x-4">
            <Badge variant={recording.isRecording ? "destructive" : "secondary"}>
              {recording.isRecording ? "录音中" : "未录音"}
            </Badge>
            <Badge variant={recording.isSpaceKeyASRActive ? "default" : "outline"}>
              {recording.isSpaceKeyASRActive ? "长按模式" : "普通模式"}
            </Badge>
            <Badge variant={recording.isContinuousMode ? "default" : "outline"}>
              {recording.isContinuousMode ? "持续模式" : "单次模式"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 控制按钮 */}
          <div className="flex items-center space-x-2">
            <Button 
              onClick={startContinuousASR}
              disabled={recording.isContinuousMode || recording.isRecording}
              variant="default"
            >
              开始持续识别
            </Button>
            <Button 
              onClick={stopContinuousASR}
              disabled={!recording.isContinuousMode}
              variant="outline"
            >
              停止持续识别
            </Button>
            <Button 
              onClick={reset}
              variant="destructive"
            >
              重置
            </Button>
          </div>

          {/* 状态显示 */}
          {ui.showStatus && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">{ui.statusText}</div>
              {recognition.currentText && (
                <div className="text-xs text-muted-foreground mt-1">
                  当前识别: {recognition.currentText}
                </div>
              )}
              {recognition.bestText && (
                <div className="text-xs text-muted-foreground mt-1">
                  最佳结果: {recognition.bestText}
                </div>
              )}
              {recognition.confidence > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  置信度: {Math.round(recognition.confidence * 100)}%
                </div>
              )}
            </div>
          )}

          {/* 输入区域 */}
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              id="messageInput"
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="输入消息或长按空格键进行语音输入..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={() => handleSendMessage()} disabled={!inputValue.trim()}>
              发送
            </Button>
          </div>

          {/* 使用说明 */}
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• 长按空格键进行语音输入（松开后自动填入输入框）</div>
            <div>• 点击"开始持续识别"进行连续语音识别</div>
            <div>• 支持实时显示识别结果和置信度</div>
            <div>• 自动过滤标点符号，选择最佳识别结果</div>
          </div>
        </CardContent>
      </Card>

      {/* 通知区域 */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>通知</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-2 rounded text-sm ${
                    notification.type === 'error' 
                      ? 'bg-destructive/10 text-destructive' 
                      : notification.type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{notification.message}</span>
                    <span className="text-xs opacity-70">{notification.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 消息历史 */}
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>消息历史</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {messages.map(message => (
                <div
                  key={message.id}
                  className="p-2 bg-muted rounded text-sm"
                >
                  <div className="flex justify-between items-center">
                    <span>{message.text}</span>
                    <span className="text-xs opacity-70">{message.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ASREnhancedExample
