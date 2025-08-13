import React, { useState } from 'react'
import { ChatHeader, AudioTestButton, ThinkingIndicator, AudioPlayer, useChatHeaderStore } from './index'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

/**
 * 聊天头部组件使用示例
 * 展示如何集成和使用聊天头部功能
 */
const ChatHeaderExample = () => {
  const [notifications, setNotifications] = useState([])
  const [logs, setLogs] = useState([])

  // 聊天头部store状态
  const {
    character,
    thinking,
    audio,
    ui,
    updateCharacterInfo,
    toggleThinkingMode,
    setThinkingActive,
    testBrowserAudio,
    playTTSAudio,
    stopCurrentAudio,
    setAudioVolume,
    updateUIConfig,
    reset
  } = useChatHeaderStore()

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

  // 添加日志
  const addLog = (message) => {
    setLogs(prev => [...prev, {
      id: Date.now(),
      message,
      timestamp: new Date()
    }].slice(-10)) // 只保留最近10条
  }

  // 监听事件
  React.useEffect(() => {
    const handleAudioTestSuccess = (event) => {
      addNotification('音频测试成功！', 'success')
      addLog('音频测试成功')
    }

    const handleAudioTestError = (event) => {
      addNotification(`音频测试失败: ${event.detail.error}`, 'error')
      addLog(`音频测试失败: ${event.detail.error}`)
    }

    const handleThinkingModeChanged = (event) => {
      addNotification(`思考模式已${event.detail.enabled ? '开启' : '关闭'}`, 'info')
      addLog(`思考模式: ${event.detail.enabled ? '开启' : '关闭'}`)
    }

    window.addEventListener('audioTestSuccess', handleAudioTestSuccess)
    window.addEventListener('audioTestError', handleAudioTestError)
    window.addEventListener('thinkingModeChanged', handleThinkingModeChanged)

    return () => {
      window.removeEventListener('audioTestSuccess', handleAudioTestSuccess)
      window.removeEventListener('audioTestError', handleAudioTestError)
      window.removeEventListener('thinkingModeChanged', handleThinkingModeChanged)
    }
  }, [])

  // 模拟AI思考
  const simulateThinking = () => {
    setThinkingActive(true)
    addLog('AI开始思考...')
    
    setTimeout(() => {
      setThinkingActive(false)
      addLog('AI思考完成')
    }, 3000)
  }

  // 模拟TTS播放
  const simulateTTS = () => {
    // 这里应该是真实的Base64音频数据
    // 为了演示，我们使用一个模拟的短音频
    const mockAudioBase64 = 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
    
    playTTSAudio(mockAudioBase64, 'wav')
    addLog('开始播放TTS音频')
  }

  // 更新角色信息
  const updateCharacter = (updates) => {
    updateCharacterInfo(updates)
    addLog(`角色信息已更新: ${JSON.stringify(updates)}`)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>聊天头部组件示例</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="demo" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="demo">演示</TabsTrigger>
              <TabsTrigger value="variants">样式变体</TabsTrigger>
              <TabsTrigger value="components">独立组件</TabsTrigger>
              <TabsTrigger value="settings">设置</TabsTrigger>
            </TabsList>

            {/* 演示 */}
            <TabsContent value="demo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">完整聊天头部</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChatHeader
                    variant="default"
                    onCharacterClick={(char) => addLog(`点击角色: ${char.name}`)}
                    onModelClick={(model) => addLog(`点击模型: ${model}`)}
                    actions={
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={simulateThinking}
                          disabled={thinking.isActive}
                        >
                          {thinking.isActive ? '思考中...' : '模拟思考'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={simulateTTS}
                          disabled={audio.isPlaying}
                        >
                          模拟TTS
                        </Button>
                      </div>
                    }
                  />
                </CardContent>
              </Card>

              {/* 控制面板 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">控制面板</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCharacter({ status: 'online' })}
                    >
                      设为在线
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCharacter({ status: 'thinking' })}
                    >
                      设为思考
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCharacter({ status: 'speaking' })}
                    >
                      设为语音
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCharacter({ status: 'offline' })}
                    >
                      设为离线
                    </Button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleThinkingMode}
                    >
                      切换思考模式
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopCurrentAudio}
                      disabled={!audio.isPlaying}
                    >
                      停止音频
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reset}
                    >
                      重置状态
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 样式变体 */}
            <TabsContent value="variants" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">默认样式</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChatHeader variant="default" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">紧凑样式</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChatHeader variant="compact" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">最小样式</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChatHeader variant="minimal" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 独立组件 */}
            <TabsContent value="components" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">音频测试按钮</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <AudioTestButton
                      onTestStart={() => addLog('开始音频测试')}
                      onTestSuccess={(msg) => addLog(`测试成功: ${msg}`)}
                      onTestError={(err) => addLog(`测试失败: ${err}`)}
                    />
                    <AudioTestButton variant="outline" size="sm">
                      小号按钮
                    </AudioTestButton>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">思考指示器</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ThinkingIndicator variant="default" />
                    <ThinkingIndicator variant="compact" />
                    <ThinkingIndicator variant="minimal" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">音频播放器</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AudioPlayer
                      showControls={true}
                      showVolume={true}
                      showSpeed={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 设置 */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">角色设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">角色名称:</label>
                      <input
                        type="text"
                        value={character.name}
                        onChange={(e) => updateCharacter({ name: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">模型:</label>
                      <input
                        type="text"
                        value={character.model}
                        onChange={(e) => updateCharacter({ model: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">UI设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={ui.showModelInfo}
                        onChange={(e) => updateUIConfig({ showModelInfo: e.target.checked })}
                      />
                      <span className="text-sm">显示模型信息</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={ui.showThinkingIndicator}
                        onChange={(e) => updateUIConfig({ showThinkingIndicator: e.target.checked })}
                      />
                      <span className="text-sm">显示思考指示器</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={ui.showAudioTest}
                        onChange={(e) => updateUIConfig({ showAudioTest: e.target.checked })}
                      />
                      <span className="text-sm">显示音频测试</span>
                    </label>
                  </div>

                  <div>
                    <label className="text-sm font-medium">音频音量:</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={audio.volume}
                      onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                      className="w-full mt-1"
                    />
                    <span className="text-xs text-gray-500">
                      {Math.round(audio.volume * 100)}%
                    </span>
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
            <CardTitle className="text-sm">角色状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs">
              <span className="font-medium">名称:</span> {character.name}
            </div>
            <div className="text-xs">
              <span className="font-medium">状态:</span> {character.status}
            </div>
            <div className="text-xs">
              <span className="font-medium">模型:</span> {character.model}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">音频状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs">
              <span className="font-medium">播放中:</span> {audio.isPlaying ? '是' : '否'}
            </div>
            <div className="text-xs">
              <span className="font-medium">测试中:</span> {audio.isTesting ? '是' : '否'}
            </div>
            <div className="text-xs">
              <span className="font-medium">音量:</span> {Math.round(audio.volume * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">思考状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs">
              <span className="font-medium">模式:</span> {thinking.enabled ? '开启' : '关闭'}
            </div>
            <div className="text-xs">
              <span className="font-medium">活跃:</span> {thinking.isActive ? '是' : '否'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 日志 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">操作日志</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 overflow-y-auto space-y-1">
            {logs.map(log => (
              <div key={log.id} className="text-xs text-muted-foreground">
                <span className="font-mono">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                {' - '}
                {log.message}
              </div>
            ))}
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

export default ChatHeaderExample
