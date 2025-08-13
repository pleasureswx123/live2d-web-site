import React, { useState } from 'react'
import { ChatMessages, useChatMessagesStore } from './index'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Input } from '../ui/input'

/**
 * 聊天消息组件使用示例
 * 展示如何集成和使用聊天消息功能
 */
const ChatMessagesExample = () => {
  const [inputValue, setInputValue] = useState('')
  const [notifications, setNotifications] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)

  // 聊天消息store状态
  const {
    messages,
    currentUser,
    ui,
    config,
    addUserMessage,
    addBotMessage,
    addSystemMessage,
    setCurrentUser,
    clearMessages,
    showSearchIndicator,
    hideSearchIndicator,
    updateConfig,
    getMessageStats,
    exportMessages,
    reset
  } = useChatMessagesStore()

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

  // 监听消息事件
  React.useEffect(() => {
    const handleMessageAdded = (event) => {
      console.log('消息已添加:', event.detail.message)
    }

    const handleMessageDeleted = (event) => {
      addNotification('消息已删除', 'info')
    }

    const handleMessagesCleared = () => {
      addNotification('消息已清空', 'info')
    }

    window.addEventListener('messageAdded', handleMessageAdded)
    window.addEventListener('messageDeleted', handleMessageDeleted)
    window.addEventListener('messagesCleared', handleMessagesCleared)

    return () => {
      window.removeEventListener('messageAdded', handleMessageAdded)
      window.removeEventListener('messageDeleted', handleMessageDeleted)
      window.removeEventListener('messagesCleared', handleMessagesCleared)
    }
  }, [])

  // 发送消息
  const sendMessage = () => {
    if (!inputValue.trim() && !selectedFile) return

    // 添加用户消息
    addUserMessage(inputValue, selectedFile)
    
    // 清空输入
    setInputValue('')
    setSelectedFile(null)

    // 模拟AI回复
    setTimeout(() => {
      const responses = [
        '这是一个很有趣的问题！',
        '让我想想...',
        '我理解你的意思。',
        '这里有一些建议给你。',
        '希望这能帮到你！',
        '你说得对，这确实值得深入讨论。',
        '从另一个角度来看...'
      ]
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      addBotMessage(randomResponse)
    }, 1000 + Math.random() * 2000)
  }

  // 模拟搜索
  const simulateSearch = () => {
    const query = '测试搜索'
    showSearchIndicator(query)
    
    setTimeout(() => {
      hideSearchIndicator()
      addBotMessage(`搜索"${query}"完成，找到了一些相关信息。`)
    }, 3000)
  }

  // 添加示例消息
  const addSampleMessages = () => {
    clearMessages()
    
    addBotMessage('你好！我是悠悠，很高兴认识你！')
    
    setTimeout(() => {
      addUserMessage('你好！请介绍一下自己。')
    }, 500)
    
    setTimeout(() => {
      addBotMessage('我是一个18岁的动漫设计专业大一学妹，喜欢画画和设计。平时也关注一些有趣的事情，比如小众漫画和艺术创作。')
    }, 1000)
    
    setTimeout(() => {
      addUserMessage('听起来很有趣！你最喜欢什么类型的动漫？')
    }, 1500)
    
    setTimeout(() => {
      addBotMessage('我特别喜欢那些画风精美、故事深刻的作品。比如宫崎骏的电影，还有一些独立制作的短片动画。你呢？有什么推荐的吗？')
    }, 2000)
  }

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // 设置用户信息
  const setUser = (name) => {
    setCurrentUser({
      name,
      avatar: name[0],
      id: `user_${Date.now()}`
    })
  }

  const stats = getMessageStats()

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>聊天消息组件示例</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="demo" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="demo">演示</TabsTrigger>
              <TabsTrigger value="messages">消息管理</TabsTrigger>
              <TabsTrigger value="settings">设置</TabsTrigger>
              <TabsTrigger value="stats">统计</TabsTrigger>
            </TabsList>

            {/* 演示 */}
            <TabsContent value="demo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">聊天界面</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 聊天消息区域 */}
                  <div className="h-96 border rounded-lg">
                    <ChatMessages
                      showAvatar={true}
                      showTimestamp={true}
                      showStatus={true}
                      showActions={true}
                      onMessageClick={(msg) => console.log('点击消息:', msg)}
                      onAvatarClick={(user) => console.log('点击头像:', user)}
                      onAttachmentClick={(attachment) => console.log('点击附件:', attachment)}
                      onMessageDelete={(id) => console.log('删除消息:', id)}
                      onMessageEdit={(msg) => console.log('编辑消息:', msg)}
                      onMessageReply={(msg) => console.log('回复消息:', msg)}
                    />
                  </div>

                  {/* 输入区域 */}
                  <div className="mt-4 space-y-2">
                    {/* 文件预览 */}
                    {selectedFile && (
                      <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                        <span className="text-sm">📎 {selectedFile.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="输入消息..."
                        className="flex-1"
                      />
                      
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-input"
                        accept="image/*,.pdf,.txt,.doc,.docx"
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-input').click()}
                      >
                        📎
                      </Button>
                      
                      <Button onClick={sendMessage} disabled={!inputValue.trim() && !selectedFile}>
                        发送
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 控制面板 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">控制面板</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button variant="outline" size="sm" onClick={addSampleMessages}>
                      添加示例消息
                    </Button>
                    <Button variant="outline" size="sm" onClick={simulateSearch}>
                      模拟搜索
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addSystemMessage('系统消息示例')}>
                      添加系统消息
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearMessages}>
                      清空消息
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm">切换用户:</span>
                    <Button variant="outline" size="sm" onClick={() => setUser('张三')}>
                      张三
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setUser('李四')}>
                      李四
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setUser('王五')}>
                      王五
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 消息管理 */}
            <TabsContent value="messages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">消息列表</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {messages.map((message, index) => (
                      <div key={message.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">
                            {message.user.name} ({message.type})
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {message.content.replace(/<[^>]*>/g, '')}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">导出消息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const json = exportMessages('json')
                      navigator.clipboard.writeText(json)
                      addNotification('JSON格式已复制到剪贴板', 'success')
                    }}
                  >
                    导出为JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const txt = exportMessages('txt')
                      navigator.clipboard.writeText(txt)
                      addNotification('文本格式已复制到剪贴板', 'success')
                    }}
                  >
                    导出为文本
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 设置 */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">用户设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">当前用户:</label>
                    <div className="text-sm text-muted-foreground">
                      {currentUser.name || '未设置'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">消息配置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">最大消息数:</label>
                    <Input
                      type="number"
                      value={config.maxMessages}
                      onChange={(e) => updateConfig({ maxMessages: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.enableFileUpload}
                        onChange={(e) => updateConfig({ enableFileUpload: e.target.checked })}
                      />
                      <span className="text-sm">启用文件上传</span>
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* 统计 */}
            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">总消息数</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.user}</div>
                    <p className="text-xs text-muted-foreground">用户消息</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.bot}</div>
                    <p className="text-xs text-muted-foreground">AI消息</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.withAttachments}</div>
                    <p className="text-xs text-muted-foreground">包含附件</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">UI状态</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">滚动到底部:</span> {ui.isScrolledToBottom ? '是' : '否'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">自动滚动:</span> {ui.autoScroll ? '开启' : '关闭'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">搜索中:</span> {ui.isSearching ? '是' : '否'}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

export default ChatMessagesExample
