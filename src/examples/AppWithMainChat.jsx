import React, { useState, useEffect } from 'react'
import { VoiceProvider } from '../contexts/VoiceContext'
import { WebSocketProvider } from '../contexts/WebSocketContext'
import { useUserAuthStore } from '../stores/userAuthStore'
import { useLive2DStore } from '../stores/live2dStore'
import MainChatInterface from '../components/MainChatInterface'
import Live2DViewer from '../components/Live2DViewer'
import LoginDialog from '../components/LoginDialog'
import SidebarDrawer from '../components/SidebarDrawer'
import SettingsDrawer from '../components/SettingsDrawer'
import WebSocketStatus from '../components/WebSocketStatus'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { 
  Menu, 
  Settings, 
  MessageCircle, 
  User,
  Maximize2,
  Minimize2
} from 'lucide-react'

/**
 * 完整的应用示例 - 集成主聊天界面
 * 展示如何将MainChatInterface作为核心组件使用
 */
const AppWithMainChat = () => {
  // 状态管理
  const [showSidebar, setShowSidebar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [chatExpanded, setChatExpanded] = useState(false)
  const [notifications, setNotifications] = useState([])

  // Stores
  const { currentUser, isAuthenticated } = useUserAuthStore()
  const { 
    currentModel, 
    pixiApp, 
    isLoading: modelLoading,
    error: modelError 
  } = useLive2DStore()

  // 通知管理
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    }
    
    setNotifications(prev => [...prev, notification])
    
    // 5秒后自动移除
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  // 错误处理
  const handleError = (error) => {
    console.error('应用错误:', error)
    addNotification(error, 'error')
  }

  // 处理聊天通知
  const handleChatNotification = (message, type) => {
    addNotification(`聊天: ${message}`, type)
  }

  // 如果用户未登录，显示登录对话框
  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoginDialog />
      </div>
    )
  }

  return (
    <VoiceProvider>
      <WebSocketProvider>
        <div className="app-with-main-chat h-screen bg-gray-900 relative overflow-hidden">
          
          {/* 背景和Live2D模型 */}
          <div className="absolute inset-0">
            {currentModel && pixiApp ? (
              <Live2DViewer 
                className="w-full h-full"
                onError={handleError}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                {modelLoading ? (
                  <div className="text-white text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>加载Live2D模型中...</p>
                  </div>
                ) : modelError ? (
                  <div className="text-red-300 text-center">
                    <p>模型加载失败</p>
                    <p className="text-sm mt-2">{modelError}</p>
                  </div>
                ) : (
                  <div className="text-white text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>欢迎使用聊天界面</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 顶部工具栏 */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSidebar(true)}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                <Menu className="w-4 h-4" />
              </Button>
              
              <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <User className="w-3 h-3 mr-1" />
                {currentUser?.name || '用户'}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <WebSocketStatus className="bg-white/10 backdrop-blur-sm" />
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 主聊天界面 */}
          <div className={`absolute top-4 right-4 z-10 transition-all duration-300 ${
            chatExpanded 
              ? 'w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]' 
              : 'w-96 h-[calc(100vh-2rem)]'
          }`}>
            <Card className="h-full bg-white/95 backdrop-blur-sm shadow-2xl border-white/20">
              {/* 聊天头部控制 */}
              <div className="absolute top-2 right-2 z-10 flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChatExpanded(!chatExpanded)}
                  className="w-6 h-6 p-0"
                >
                  {chatExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </Button>
              </div>

              {/* 主聊天组件 */}
              <MainChatInterface
                enableSearch={true}
                enableFileUpload={true}
                enableASR={true}
                maxMessageLength={2000}
                placeholder="发送消息给悠悠..."
                onError={handleError}
                onNotification={handleChatNotification}
                className="h-full rounded-lg"
              />
            </Card>
          </div>

          {/* 通知显示 */}
          {notifications.length > 0 && (
            <div className="absolute bottom-4 left-4 z-30 space-y-2 max-w-sm">
              {notifications.slice(-3).map(notification => (
                <Card
                  key={notification.id}
                  className={`p-3 ${
                    notification.type === 'error' 
                      ? 'bg-red-500/90 text-white' 
                      : notification.type === 'success'
                      ? 'bg-green-500/90 text-white'
                      : 'bg-blue-500/90 text-white'
                  } backdrop-blur-sm animate-in slide-in-from-left-5`}
                >
                  <div className="text-sm">
                    {notification.message}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* 侧边栏 */}
          <SidebarDrawer
            open={showSidebar}
            onOpenChange={setShowSidebar}
            onError={handleError}
          />

          {/* 设置抽屉 */}
          <SettingsDrawer
            open={showSettings}
            onOpenChange={setShowSettings}
            onError={handleError}
          />
        </div>
      </WebSocketProvider>
    </VoiceProvider>
  )
}

export default AppWithMainChat

// 使用示例
export const AppExample = () => {
  return (
    <div className="app-example">
      <h1 className="text-2xl font-bold mb-4">主聊天界面集成示例</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">功能特性</h3>
          <ul className="text-sm space-y-1">
            <li>• 完整的聊天界面（头部、消息、输入）</li>
            <li>• WebSocket实时通信</li>
            <li>• 文件上传支持</li>
            <li>• 语音识别集成</li>
            <li>• 智能搜索检测</li>
            <li>• TTS音频管理</li>
            <li>• 响应式设计</li>
          </ul>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold mb-2">使用方法</h3>
          <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
{`import MainChatInterface from '@/components/MainChatInterface'

<MainChatInterface
  enableSearch={true}
  enableFileUpload={true}
  enableASR={true}
  onError={(error) => console.error(error)}
  onNotification={(msg, type) => showToast(msg, type)}
/>`}
          </pre>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold mb-2">注意事项</h3>
          <ul className="text-sm space-y-1">
            <li>• 需要包装在 VoiceProvider 和 WebSocketProvider 中</li>
            <li>• 确保所有相关的 stores 已正确初始化</li>
            <li>• 文件上传需要配置后端接口</li>
            <li>• ASR功能需要麦克风权限</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
