import React, { useState } from 'react'
import { VoiceProvider } from './contexts/VoiceContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import WorkingChatInterface from './components/WorkingChatInterface'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import './App.css'

/**
 * 工作聊天界面测试应用
 * 专门用于测试完整的聊天功能
 */
function AppWorkingTest() {
  const [logs, setLogs] = useState([])
  const [errors, setErrors] = useState([])

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
    const errorItem = {
      id: Date.now(),
      message: error,
      timestamp: new Date().toLocaleTimeString()
    }
    setErrors(prev => [...prev, errorItem].slice(-5))
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
    setErrors([])
  }

  // 测试功能
  const testFunctions = [
    {
      name: '文字聊天',
      description: '在输入框输入消息并发送',
      action: () => addLog('请在聊天界面输入文字消息测试', 'info')
    },
    {
      name: 'ASR语音识别',
      description: '长按空格键或点击麦克风按钮',
      action: () => addLog('请长按空格键或点击麦克风按钮测试语音识别', 'info')
    },
    {
      name: '文件上传',
      description: '点击附件按钮上传文件',
      action: () => addLog('请点击附件按钮选择文件上传', 'info')
    },
    {
      name: '搜索功能',
      description: '输入包含搜索关键词的消息',
      action: () => addLog('请输入包含"搜索"、"查找"等关键词的消息', 'info')
    },
    {
      name: 'TTS播放',
      description: '发送消息后等待TTS回复',
      action: () => addLog('请发送消息后等待TTS语音回复', 'info')
    }
  ]

  return (
    <div className="app-working-test h-screen bg-gray-50">
      <div className="h-full flex">
        
        {/* 左侧：聊天界面 */}
        <div className="flex-1 p-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>完整聊天功能测试</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">文字聊天</Badge>
                <Badge variant="outline">ASR语音</Badge>
                <Badge variant="outline">文件上传</Badge>
                <Badge variant="outline">TTS播放</Badge>
                <Badge variant="outline">智能搜索</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-5rem)]">
              <VoiceProvider>
                <WebSocketProvider>
                  <WorkingChatInterface
                    enableSearch={true}
                    enableFileUpload={true}
                    enableASR={true}
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
        <div className="w-80 p-4 space-y-4">
          
          {/* 测试功能 */}
          <Card>
            <CardHeader>
              <CardTitle>功能测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {testFunctions.map((test, index) => (
                <div key={index} className="p-2 border rounded">
                  <div className="font-medium text-sm">{test.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {test.description}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={test.action}
                    className="w-full"
                  >
                    测试说明
                  </Button>
                </div>
              ))}
              
              <Button onClick={clearLogs} variant="ghost" size="sm" className="w-full">
                清除日志
              </Button>
            </CardContent>
          </Card>

          {/* 错误显示 */}
          {errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">错误记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {errors.map(error => (
                    <div
                      key={error.id}
                      className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800"
                    >
                      <div>{error.message}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {error.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 运行日志 */}
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

          {/* 使用说明 */}
          <Card>
            <CardHeader>
              <CardTitle>使用说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <strong>🎯 测试目标：</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>文字消息正常发送</li>
                  <li>ASR语音识别正常</li>
                  <li>文件上传功能正常</li>
                  <li>TTS音频播放正常</li>
                  <li>搜索关键词检测正常</li>
                  <li>WebSocket连接稳定</li>
                </ul>
              </div>
              
              <div>
                <strong>🔧 操作提示：</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Enter键发送消息</li>
                  <li>Shift+Enter换行</li>
                  <li>长按空格键语音输入</li>
                  <li>点击麦克风持续识别</li>
                  <li>点击附件上传文件</li>
                </ul>
              </div>
              
              <div className="mt-4 p-2 bg-yellow-50 rounded text-xs">
                <strong>⚠️ 注意：</strong>
                <br />
                确保WebSocket服务器运行在 localhost:8000
                <br />
                确保已授权麦克风权限
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AppWorkingTest
