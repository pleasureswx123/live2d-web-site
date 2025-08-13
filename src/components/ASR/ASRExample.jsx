import React, { useState, useEffect, useRef } from 'react'
import { ASRComplete, useASRStore } from './index'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'

/**
 * ASR组件使用示例
 * 展示如何集成和使用ASR语音识别功能
 */
const ASRExample = () => {
  const [webSocket, setWebSocket] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [notifications, setNotifications] = useState([])
  
  const inputRef = useRef(null)
  const wsRef = useRef(null)

  // ASR store状态
  const { recording, recognition, ui } = useASRStore()

  // 初始化WebSocket连接
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // 这里替换为你的WebSocket服务器地址
        const ws = new WebSocket('ws://localhost:8000/ws')
        
        ws.onopen = () => {
          console.log('WebSocket连接已建立')
          setConnectionStatus('connected')
          setWebSocket(ws)
          wsRef.current = ws
        }

        ws.onclose = () => {
          console.log('WebSocket连接已关闭')
          setConnectionStatus('disconnected')
          setWebSocket(null)
          wsRef.current = null
        }

        ws.onerror = (error) => {
          console.error('WebSocket错误:', error)
          setConnectionStatus('error')
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('收到WebSocket消息:', data)
            
            // 处理聊天消息
            if (data.type === 'chat_message') {
              setMessages(prev => [...prev, {
                id: Date.now(),
                text: data.message,
                sender: 'assistant',
                timestamp: new Date()
              }])
            }
          } catch (error) {
            console.error('解析WebSocket消息失败:', error)
          }
        }

        return ws
      } catch (error) {
        console.error('创建WebSocket连接失败:', error)
        setConnectionStatus('error')
        return null
      }
    }

    const ws = connectWebSocket()

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  // 处理ASR识别结果
  const handleASRResult = (text) => {
    console.log('ASR识别结果:', text)
    setInputValue(text)
    
    // 自动发送消息
    if (text.trim()) {
      sendMessage(text.trim())
    }
  }

  // 处理ASR错误
  const handleASRError = (error) => {
    console.error('ASR错误:', error)
    addNotification(`语音识别错误: ${error}`, 'error')
  }

  // 处理ASR通知
  const handleASRNotification = (message, type) => {
    console.log('ASR通知:', message, type)
    addNotification(message, type)
  }

  // 添加通知
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    }
    
    setNotifications(prev => [...prev, notification])
    
    // 3秒后自动移除通知
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 3000)
  }

  // 发送消息
  const sendMessage = (text = inputValue) => {
    if (!text.trim()) return

    const message = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, message])
    setInputValue('')

    // 发送到WebSocket服务器
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({
        type: 'chat_message',
        message: text.trim()
      }))
    }
  }

  // 处理输入框变化
  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 连接状态样式
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            ASR语音识别示例
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`} />
              <span className="text-sm text-muted-foreground">
                {connectionStatus === 'connected' ? '已连接' : 
                 connectionStatus === 'error' ? '连接错误' : '未连接'}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 状态显示 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">录音状态</div>
              <div className="text-xs text-muted-foreground">
                {recording.isRecording ? '🔴 录音中' : '⚪ 未录音'}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">空格键状态</div>
              <div className="text-xs text-muted-foreground">
                {recording.isSpaceKeyASRActive ? '🎤 ASR激活' : 
                 recording.isSpaceKeyPressed ? '⏳ 按下中' : '⚪ 未按下'}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">识别文本</div>
              <div className="text-xs text-muted-foreground truncate">
                {recognition.currentText || '无'}
              </div>
            </div>
          </div>

          {/* 消息列表 */}
          <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground">
                暂无消息，开始对话吧！
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm">{message.text}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

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
            
            {/* ASR按钮 */}
            <ASRComplete
              webSocket={webSocket}
              onResult={handleASRResult}
              onError={handleASRError}
              onNotification={handleASRNotification}
              targetInputId="messageInput"
              buttonVariant="outline"
              buttonSize="default"
              statusPosition="center"
            />
            
            <Button onClick={() => sendMessage()} disabled={!inputValue.trim()}>
              发送
            </Button>
          </div>

          {/* 使用说明 */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>💡 使用提示：</div>
            <div>• 长按空格键（>0.4秒）开始语音识别</div>
            <div>• 短按空格键（<0.4秒）插入空格字符</div>
            <div>• 松开空格键自动发送识别结果</div>
            <div>• 点击麦克风按钮查看提示信息</div>
          </div>
        </CardContent>
      </Card>

      {/* 通知区域 */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {notifications.map((notification) => (
            <Badge
              key={notification.id}
              variant={notification.type === 'error' ? 'destructive' : 'default'}
              className="block p-2 shadow-lg"
            >
              {notification.message}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default ASRExample
