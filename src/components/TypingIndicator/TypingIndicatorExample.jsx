import React, { useState, useRef } from 'react'
import { TypingIndicator, TypingDots, useTypingIndicatorStore } from './index'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

/**
 * 打字指示器组件使用示例
 * 展示如何集成和使用打字指示器功能
 */
const TypingIndicatorExample = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: '你好！', sender: 'user', timestamp: new Date() },
    { id: 2, text: '你好！我是AI助手，有什么可以帮助你的吗？', sender: 'ai', timestamp: new Date() }
  ])
  const [inputValue, setInputValue] = useState('')
  const [notifications, setNotifications] = useState([])
  
  const chatContainerRef = useRef(null)

  // 打字指示器store状态
  const {
    ui,
    typingUsers,
    animation,
    config,
    showTyping,
    hideTyping,
    hideAllTyping,
    updateAnimation,
    updateConfig,
    setContainerRef,
    reset
  } = useTypingIndicatorStore()

  // 设置滚动容器引用
  React.useEffect(() => {
    setContainerRef(chatContainerRef)
  }, [setContainerRef])

  // 模拟AI回复
  const simulateAIResponse = () => {
    // 显示AI正在输入
    showTyping({
      id: 'ai',
      name: 'AI助手',
      avatar: 'AI',
      type: 'bot',
      avatarUrl: null
    })

    // 模拟输入时间
    setTimeout(() => {
      hideTyping('ai')
      
      const responses = [
        '这是一个很好的问题！',
        '让我想想...',
        '我理解你的意思。',
        '这里有一些建议给你。',
        '希望这能帮到你！'
      ]
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: randomResponse,
        sender: 'ai',
        timestamp: new Date()
      }])
    }, 2000 + Math.random() * 3000) // 2-5秒随机延迟
  }

  // 发送消息
  const sendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    // 触发AI回复
    setTimeout(simulateAIResponse, 500)
  }

  // 模拟多用户输入
  const simulateMultipleUsers = () => {
    const users = [
      { id: 'user1', name: '张三', avatar: '张', type: 'user' },
      { id: 'user2', name: '李四', avatar: '李', type: 'user' },
      { id: 'admin', name: '管理员', avatar: '管', type: 'admin' }
    ]

    users.forEach((user, index) => {
      setTimeout(() => {
        showTyping(user)
      }, index * 1000)
    })

    // 5秒后清除所有
    setTimeout(() => {
      hideAllTyping()
    }, 8000)
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
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 3000)
  }

  // 监听打字指示器事件
  React.useEffect(() => {
    const handleShow = (event) => {
      addNotification(`${event.detail.user.name} 开始输入`, 'info')
    }

    const handleHide = (event) => {
      addNotification(`用户停止输入`, 'info')
    }

    window.addEventListener('typingIndicatorShow', handleShow)
    window.addEventListener('typingIndicatorHide', handleHide)

    return () => {
      window.removeEventListener('typingIndicatorShow', handleShow)
      window.removeEventListener('typingIndicatorHide', handleHide)
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>打字指示器组件示例</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chat" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="chat">聊天演示</TabsTrigger>
              <TabsTrigger value="styles">样式演示</TabsTrigger>
              <TabsTrigger value="animations">动画演示</TabsTrigger>
              <TabsTrigger value="settings">设置</TabsTrigger>
            </TabsList>

            {/* 聊天演示 */}
            <TabsContent value="chat" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">模拟聊天界面</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 聊天消息区域 */}
                  <div
                    ref={chatContainerRef}
                    className="h-64 overflow-y-auto border rounded-lg p-4 space-y-3 mb-4"
                  >
                    {messages.map((message) => (
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
                    ))}
                    
                    {/* 打字指示器 */}
                    <TypingIndicator
                      position="inline"
                      variant="default"
                      size="md"
                      showMultipleUsers={true}
                    />
                  </div>

                  {/* 输入区域 */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="输入消息..."
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button onClick={sendMessage} disabled={!inputValue.trim()}>
                      发送
                    </Button>
                  </div>

                  {/* 控制按钮 */}
                  <div className="flex items-center space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showTyping()}
                    >
                      显示AI输入
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={simulateMultipleUsers}
                    >
                      多用户输入
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={hideAllTyping}
                    >
                      隐藏所有
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reset}
                    >
                      重置
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 样式演示 */}
            <TabsContent value="styles" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">不同变体</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">默认样式</div>
                      <TypingIndicator variant="default" size="md" />
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">紧凑样式</div>
                      <TypingIndicator variant="compact" size="sm" />
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">最小样式</div>
                      <TypingIndicator variant="minimal" size="lg" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">不同大小</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">小号</div>
                      <TypingIndicator size="sm" />
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">中号</div>
                      <TypingIndicator size="md" />
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">大号</div>
                      <TypingIndicator size="lg" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 动画演示 */}
            <TabsContent value="animations" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['dots', 'wave', 'pulse', 'bounce'].map(style => (
                  <Card key={style}>
                    <CardHeader>
                      <CardTitle className="text-sm capitalize">{style}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TypingDots style={style} size="md" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">动画控制</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium">样式:</label>
                    {['dots', 'wave', 'pulse', 'bounce'].map(style => (
                      <Button
                        key={style}
                        variant={animation.style === style ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateAnimation({ style })}
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium">速度:</label>
                    {['slow', 'normal', 'fast'].map(speed => (
                      <Button
                        key={speed}
                        variant={animation.speed === speed ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateAnimation({ speed })}
                      >
                        {speed}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 设置 */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">配置选项</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={config.showAvatar}
                          onChange={(e) => updateConfig({ showAvatar: e.target.checked })}
                        />
                        <span className="text-sm">显示头像</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={config.showUserName}
                          onChange={(e) => updateConfig({ showUserName: e.target.checked })}
                        />
                        <span className="text-sm">显示用户名</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={ui.autoScroll}
                          onChange={(e) => updateUIState({ autoScroll: e.target.checked })}
                        />
                        <span className="text-sm">自动滚动</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">最大用户数:</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={config.maxUsers}
                      onChange={(e) => updateConfig({ maxUsers: parseInt(e.target.value) })}
                      className="ml-2 w-16 px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 状态信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">当前状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs">
              <span className="font-medium">可见:</span> {ui.isVisible ? '是' : '否'}
            </div>
            <div className="text-xs">
              <span className="font-medium">用户数:</span> {typingUsers.length}
            </div>
            <div className="text-xs">
              <span className="font-medium">位置:</span> {ui.position}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">动画配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs">
              <span className="font-medium">样式:</span> {animation.style}
            </div>
            <div className="text-xs">
              <span className="font-medium">速度:</span> {animation.speed}
            </div>
            <div className="text-xs">
              <span className="font-medium">点数:</span> {animation.dotCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">正在输入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {typingUsers.length > 0 
                ? typingUsers.map(u => u.name).join(', ')
                : '无用户输入'
              }
            </div>
          </CardContent>
        </Card>
      </div>

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

export default TypingIndicatorExample
