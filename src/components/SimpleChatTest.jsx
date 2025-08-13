import React, { useState } from 'react'
import { VoiceProvider } from '../contexts/VoiceContext'
import { WebSocketProvider } from '../contexts/WebSocketContext'
import SimpleChatInterface from './SimpleChatInterface'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

/**
 * 简化聊天测试组件
 * 专注于核心功能测试
 */
const SimpleChatTest = () => {
  const [logs, setLogs] = useState([])

  // 添加日志
  const addLog = (message, type = 'info') => {
    const log = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }
    setLogs(prev => [...prev, log].slice(-20)) // 只保留最近20条
  }

  // 处理错误
  const handleError = (error) => {
    console.error('聊天错误:', error)
    addLog(`错误: ${error}`, 'error')
  }

  // 处理通知
  const handleNotification = (message, type) => {
    console.log('聊天通知:', message, type)
    addLog(`通知: ${message}`, type)
  }

  // 清除日志
  const clearLogs = () => {
    setLogs([])
  }

  // 测试消息发送
  const testSendMessage = () => {
    addLog('测试消息发送功能', 'info')
    // 这里可以模拟发送消息
  }

  // 测试ASR功能
  const testASR = () => {
    addLog('测试ASR语音识别功能', 'info')
    // 这里可以模拟ASR功能
  }

  // 测试TTS功能
  const testTTS = () => {
    addLog('测试TTS语音播放功能', 'info')
    // 这里可以模拟TTS功能
  }

  return (
    <div className="simple-chat-test h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto h-full flex gap-4">
        
        {/* 左侧：聊天界面 */}
        <div className="flex-1 max-w-lg">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>简化聊天界面测试</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-4rem)]">
              <VoiceProvider>
                <WebSocketProvider>
                  <SimpleChatInterface
                    onError={handleError}
                    onNotification={handleNotification}
                    className="h-full rounded-none"
                  />
                </WebSocketProvider>
              </VoiceProvider>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：测试控制和日志 */}
        <div className="w-80 space-y-4">
          
          {/* 测试控制 */}
          <Card>
            <CardHeader>
              <CardTitle>功能测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={testSendMessage} size="sm">
                  测试消息发送
                </Button>
                <Button onClick={testASR} size="sm">
                  测试ASR语音识别
                </Button>
                <Button onClick={testTTS} size="sm">
                  测试TTS语音播放
                </Button>
              </div>
              <Button onClick={clearLogs} variant="outline" size="sm" className="w-full">
                清除日志
              </Button>
            </CardContent>
          </Card>

          {/* 功能说明 */}
          <Card>
            <CardHeader>
              <CardTitle>测试说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="space-y-1">
                <div><strong>文字聊天：</strong></div>
                <div>• 在输入框输入消息</div>
                <div>• 按Enter键或点击发送按钮</div>
                <div>• 支持搜索关键词检测</div>
              </div>
              
              <div className="space-y-1">
                <div><strong>语音识别：</strong></div>
                <div>• 长按空格键进行语音输入</div>
                <div>• 点击麦克风按钮开启持续识别</div>
                <div>• 语音识别结果自动发送</div>
              </div>
              
              <div className="space-y-1">
                <div><strong>TTS播放：</strong></div>
                <div>• 发送消息时自动打断TTS</div>
                <div>• 支持音频队列管理</div>
                <div>• 响应全局停止事件</div>
              </div>
            </CardContent>
          </Card>

          {/* 日志显示 */}
          <Card>
            <CardHeader>
              <CardTitle>运行日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    暂无日志记录
                  </div>
                ) : (
                  logs.map(log => (
                    <div
                      key={log.id}
                      className={`p-2 rounded text-sm ${
                        log.type === 'error' 
                          ? 'bg-red-50 text-red-800 border border-red-200' 
                          : log.type === 'success'
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="flex-1">{log.message}</span>
                        <span className="text-xs opacity-70 ml-2">
                          {log.timestamp}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 状态显示 */}
          <Card>
            <CardHeader>
              <CardTitle>系统状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">WebSocket连接</span>
                <Badge variant="outline">检测中</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">ASR服务</span>
                <Badge variant="outline">就绪</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">TTS服务</span>
                <Badge variant="outline">就绪</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">音频权限</span>
                <Badge variant="outline">待检测</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SimpleChatTest
