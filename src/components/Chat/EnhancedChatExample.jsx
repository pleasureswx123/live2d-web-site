import React, { useState, useEffect } from 'react'
import { useASRStore } from '../../stores/asrStore'
import ChatInputWithASR from './ChatInputWithASR'
import ASRChatIntegration from '../ASR/ASRChatIntegration'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { 
  MessageCircle, 
  Settings, 
  BarChart3, 
  Wifi, 
  WifiOff,
  Volume2,
  VolumeX
} from 'lucide-react'

/**
 * 增强版聊天应用示例
 * 展示完整的ASR聊天集成功能
 */
const EnhancedChatExample = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "你好！我是AI助手，你可以通过文字或语音与我对话。",
      user: { name: "AI助手", avatar: "🤖" },
      type: "bot",
      timestamp: new Date(Date.now() - 60000)
    }
  ])
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showStats, setShowStats] = useState(false)
  const [networkStatus, setNetworkStatus] = useState({ online: true, latency: 0 })

  const {
    recording,
    recognition,
    performance,
    errorRecovery,
    getPerformanceStats,
    checkNetworkStatus,
    reset
  } = useASRStore()

  // 定期检查网络状态
  useEffect(() => {
    const checkNetwork = async () => {
      const status = await checkNetworkStatus()
      setNetworkStatus(status)
    }

    checkNetwork()
    const interval = setInterval(checkNetwork, 30000) // 每30秒检查一次

    return () => clearInterval(interval)
  }, [])

  // 发送消息
  const handleSendMessage = async (messageData) => {
    const newMessage = {
      id: Date.now(),
      text: messageData.text,
      user: { name: "用户", avatar: "👤" },
      type: "user",
      timestamp: messageData.timestamp,
      source: messageData.source,
      replyTo: messageData.replyTo
    }

    setMessages(prev => [...prev, newMessage])
    setReplyToMessage(null)

    // 模拟AI回复
    setTimeout(() => {
      const responses = [
        "我理解了你的意思。",
        "这是一个很有趣的观点！",
        "让我想想如何回答这个问题。",
        "你说得对，这确实值得深入讨论。",
        "感谢你使用语音输入，识别效果很好！",
        "我注意到你使用了语音输入，这让对话更加自然。"
      ]
      
      const response = messageData.source === 'voice' 
        ? responses[Math.floor(Math.random() * 2) + 4] // 语音相关回复
        : responses[Math.floor(Math.random() * 4)] // 普通回复

      const aiMessage = {
        id: Date.now() + 1,
        text: response,
        user: { name: "AI助手", avatar: "🤖" },
        type: "bot",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    }, 1000 + Math.random() * 2000)
  }

  // 处理文件上传
  const handleAttachFile = (file) => {
    addNotification(`文件 "${file.name}" 已上传`, 'success')
    
    const fileMessage = {
      id: Date.now(),
      text: `[文件] ${file.name}`,
      user: { name: "用户", avatar: "👤" },
      type: "user",
      timestamp: new Date(),
      attachment: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    }

    setMessages(prev => [...prev, fileMessage])
  }

  // 处理错误
  const handleError = (error) => {
    addNotification(`错误: ${error}`, 'error')
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
    
    // 3秒后自动移除
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 3000)
  }

  // 回复消息
  const handleReplyToMessage = (message) => {
    setReplyToMessage(message)
  }

  // 获取性能统计
  const stats = getPerformanceStats()

  return (
    <div className="enhanced-chat-example max-w-4xl mx-auto p-6 space-y-6">
      {/* 标题栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>增强版ASR聊天</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {/* 网络状态 */}
              <Badge variant={networkStatus.online ? "default" : "destructive"}>
                {networkStatus.online ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                {networkStatus.online ? `${networkStatus.latency}ms` : '离线'}
              </Badge>
              
              {/* ASR状态 */}
              <Badge variant={recording.isRecording ? "destructive" : "secondary"}>
                {recording.isRecording ? <Volume2 className="w-3 h-3 mr-1" /> : <VolumeX className="w-3 h-3 mr-1" />}
                {recording.isRecording ? "录音中" : "就绪"}
              </Badge>
              
              {/* 统计按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              
              {/* 设置按钮 */}
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 性能统计 */}
      {showStats && (
        <Card>
          <CardHeader>
            <CardTitle>ASR性能统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">成功识别</div>
                <div className="font-medium">{stats.successfulRecognitions}</div>
              </div>
              <div>
                <div className="text-muted-foreground">失败次数</div>
                <div className="font-medium">{stats.failedRecognitions}</div>
              </div>
              <div>
                <div className="text-muted-foreground">成功率</div>
                <div className="font-medium">{Math.round(stats.successRate * 100)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">平均置信度</div>
                <div className="font-medium">{Math.round(stats.averageConfidence * 100)}%</div>
              </div>
            </div>
            
            {errorRecovery.fallbackMode && (
              <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                ⚠️ 当前运行在降级模式，部分功能可能受限
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 通知区域 */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg text-sm ${
                notification.type === 'error' 
                  ? 'bg-red-50 text-red-800 border border-red-200' 
                  : notification.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{notification.message}</span>
                <span className="text-xs opacity-70">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 聊天消息区域 */}
      <Card className="h-96">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback>
                    {message.user.avatar}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`max-w-[70%] ${message.type === 'user' ? 'text-right' : ''}`}>
                  <div className="text-xs text-muted-foreground mb-1">
                    {message.user.name} · {message.timestamp.toLocaleTimeString()}
                    {message.source === 'voice' && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        语音
                      </Badge>
                    )}
                  </div>
                  
                  <div
                    className={`p-3 rounded-lg cursor-pointer hover:opacity-80 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                    onClick={() => handleReplyToMessage(message)}
                  >
                    {message.replyTo && (
                      <div className="text-xs opacity-70 mb-1 border-l-2 pl-2">
                        回复消息
                      </div>
                    )}
                    <div>{message.text}</div>
                    {message.attachment && (
                      <div className="text-xs mt-1 opacity-70">
                        📎 {message.attachment.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ASR集成组件 */}
      <ASRChatIntegration
        chatId="enhanced-chat"
        onSendMessage={handleSendMessage}
        onError={handleError}
        onNotification={addNotification}
        replyToMessage={replyToMessage}
        enablePreview={true}
        enableVoiceCommands={true}
      />

      {/* 聊天输入组件 */}
      <ChatInputWithASR
        onSendMessage={handleSendMessage}
        onAttachFile={handleAttachFile}
        onError={handleError}
        onNotification={addNotification}
        replyToMessage={replyToMessage}
        enableASR={true}
        enableAttachments={true}
        enableEmojis={true}
      />

      {/* 使用说明 */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm space-y-2">
            <div className="font-medium">🎤 语音功能说明:</div>
            <div>• 长按空格键进行语音输入</div>
            <div>• 点击"持续识别"开启连续语音模式</div>
            <div>• 支持语音命令: "发送"、"取消"、"重新录制"、"删除"</div>
            <div>• 自动识别结果预览和确认</div>
            <div>• 点击消息可快速回复</div>
            <div>• 实时显示识别置信度和网络状态</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EnhancedChatExample
