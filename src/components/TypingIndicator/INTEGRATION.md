# TypingIndicator组件集成指南

本指南说明如何将打字指示器组件集成到现有的Live2D项目中。

## 快速集成

### 1. 在聊天界面中集成

```jsx
// 在你的聊天组件中
import { TypingIndicator, useTypingIndicatorStore } from '@/components/TypingIndicator'

function ChatInterface() {
  const [messages, setMessages] = useState([])
  const [isAIThinking, setIsAIThinking] = useState(false)
  const { showTyping, hideTyping } = useTypingIndicatorStore()

  // 发送消息并触发AI回复
  const sendMessage = async (text) => {
    // 添加用户消息
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    }])

    // 显示AI正在思考
    setIsAIThinking(true)
    showTyping({
      id: 'ai',
      name: 'AI助手',
      avatar: 'AI',
      type: 'bot'
    })

    try {
      // 调用AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      
      const aiResponse = await response.json()
      
      // 隐藏打字指示器
      hideTyping('ai')
      setIsAIThinking(false)
      
      // 添加AI回复
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: aiResponse.message,
        sender: 'ai',
        timestamp: new Date()
      }])
    } catch (error) {
      hideTyping('ai')
      setIsAIThinking(false)
      console.error('AI回复失败:', error)
    }
  }

  return (
    <div className="chat-interface">
      {/* 消息列表 */}
      <div className="messages-container">
        {messages.map(message => (
          <div key={message.id} className="message">
            {message.text}
          </div>
        ))}
        
        {/* 打字指示器 */}
        <TypingIndicator
          position="inline"
          variant="default"
          size="md"
        />
      </div>
      
      {/* 输入区域 */}
      <div className="input-area">
        <input
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              sendMessage(e.target.value.trim())
              e.target.value = ''
            }
          }}
          disabled={isAIThinking}
          placeholder={isAIThinking ? 'AI正在思考...' : '输入消息...'}
        />
      </div>
    </div>
  )
}
```

### 2. 与WebSocket实时通信集成

```jsx
import { useTypingIndicatorStore } from '@/components/TypingIndicator'

function RealtimeChat() {
  const { showTyping, hideTyping } = useTypingIndicatorStore()
  const [socket, setSocket] = useState(null)

  React.useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/chat')
    
    ws.onopen = () => {
      console.log('WebSocket连接已建立')
      setSocket(ws)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'user_typing_start':
          showTyping({
            id: data.userId,
            name: data.userName,
            avatar: data.userAvatar || data.userName[0],
            type: 'user'
          })
          break
          
        case 'user_typing_stop':
          hideTyping(data.userId)
          break
          
        case 'ai_thinking_start':
          showTyping({
            id: 'ai',
            name: 'AI助手',
            avatar: 'AI',
            type: 'bot'
          })
          break
          
        case 'ai_thinking_stop':
          hideTyping('ai')
          break
          
        case 'message':
          // 处理接收到的消息
          handleNewMessage(data.message)
          break
      }
    }

    return () => {
      ws.close()
    }
  }, [showTyping, hideTyping])

  // 发送输入状态
  const sendTypingStatus = (isTyping) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: isTyping ? 'typing_start' : 'typing_stop',
        userId: 'current_user_id'
      }))
    }
  }

  return (
    <div className="realtime-chat">
      <TypingIndicator showMultipleUsers={true} />
      
      <input
        onFocus={() => sendTypingStatus(true)}
        onBlur={() => sendTypingStatus(false)}
        onChange={(e) => {
          // 可以添加防抖来减少发送频率
          if (e.target.value.length > 0) {
            sendTypingStatus(true)
          } else {
            sendTypingStatus(false)
          }
        }}
      />
    </div>
  )
}
```

### 3. 与Live2D角色交互集成

```jsx
import { useTypingIndicatorStore } from '@/components/TypingIndicator'
import { useLive2DStore } from '@/stores/live2dStore'

function Live2DChat() {
  const { showTyping, hideTyping } = useTypingIndicatorStore()
  const { playExpression, playMotion } = useLive2DStore()

  const handleAIResponse = async (userMessage) => {
    // 1. 显示AI正在思考
    showTyping({
      id: 'ai',
      name: 'Live2D助手',
      avatar: '🤖',
      type: 'bot'
    })

    // 2. Live2D角色表现思考状态
    playExpression('thinking')
    playMotion('Idle', 'thinking')

    try {
      // 3. 调用AI API
      const response = await fetch('/api/live2d-chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMessage })
      })
      
      const aiData = await response.json()
      
      // 4. 隐藏打字指示器
      hideTyping('ai')
      
      // 5. Live2D角色表现回复状态
      playExpression(aiData.expression || 'happy')
      playMotion('TapBody', aiData.motion || 'greeting')
      
      // 6. 显示AI回复
      return aiData.message
      
    } catch (error) {
      hideTyping('ai')
      playExpression('sad')
      throw error
    }
  }

  return (
    <div className="live2d-chat">
      <div className="live2d-container">
        {/* Live2D模型显示区域 */}
      </div>
      
      <div className="chat-area">
        <TypingIndicator
          variant="compact"
          size="sm"
          position="floating"
        />
        
        {/* 聊天界面 */}
      </div>
    </div>
  )
}
```

## 与现有状态管理集成

### 与主应用Store集成

```jsx
// 在你的主store中
import { create } from 'zustand'

export const useAppStore = create((set, get) => ({
  // 现有状态
  user: null,
  messages: [],
  
  // 聊天状态
  isAIResponding: false,
  typingUsers: [],
  
  // 设置AI响应状态
  setAIResponding: (responding) => {
    set({ isAIResponding: responding })
    
    // 同步到打字指示器
    if (responding) {
      useTypingIndicatorStore.getState().showTyping({
        id: 'ai',
        name: 'AI助手',
        type: 'bot'
      })
    } else {
      useTypingIndicatorStore.getState().hideTyping('ai')
    }
  },
  
  // 添加消息
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, {
        ...message,
        id: Date.now(),
        timestamp: new Date()
      }]
    }))
  },
  
  // 发送消息并获取AI回复
  sendMessage: async (text) => {
    const { addMessage, setAIResponding } = get()
    
    // 添加用户消息
    addMessage({
      text,
      sender: 'user'
    })
    
    // 设置AI正在响应
    setAIResponding(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text })
      })
      
      const aiResponse = await response.json()
      
      // 添加AI回复
      addMessage({
        text: aiResponse.message,
        sender: 'ai'
      })
    } catch (error) {
      console.error('发送消息失败:', error)
    } finally {
      setAIResponding(false)
    }
  }
}))

// 在组件中使用
function IntegratedChat() {
  const { messages, isAIResponding, sendMessage } = useAppStore()

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.text}</div>
      ))}
      
      <TypingIndicator />
      
      <input
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.target.value)
            e.target.value = ''
          }
        }}
        disabled={isAIResponding}
      />
    </div>
  )
}
```

## 服务器端集成

### Express.js 后端示例

```javascript
const express = require('express')
const WebSocket = require('ws')

const app = express()
const wss = new WebSocket.Server({ port: 8080 })

// 存储连接的客户端
const clients = new Map()

wss.on('connection', (ws) => {
  const clientId = generateClientId()
  clients.set(clientId, ws)
  
  ws.on('message', (data) => {
    const message = JSON.parse(data)
    
    switch (message.type) {
      case 'typing_start':
        // 广播用户开始输入
        broadcast({
          type: 'user_typing_start',
          userId: message.userId,
          userName: message.userName
        }, clientId)
        break
        
      case 'typing_stop':
        // 广播用户停止输入
        broadcast({
          type: 'user_typing_stop',
          userId: message.userId
        }, clientId)
        break
        
      case 'chat_message':
        // 处理聊天消息
        handleChatMessage(message, clientId)
        break
    }
  })
  
  ws.on('close', () => {
    clients.delete(clientId)
    // 通知其他客户端用户离线
    broadcast({
      type: 'user_typing_stop',
      userId: clientId
    }, clientId)
  })
})

// 广播消息给其他客户端
function broadcast(message, excludeClientId) {
  clients.forEach((client, clientId) => {
    if (clientId !== excludeClientId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
}

// 处理聊天消息
async function handleChatMessage(message, clientId) {
  // 广播AI开始思考
  broadcast({
    type: 'ai_thinking_start'
  })
  
  try {
    // 调用AI服务
    const aiResponse = await callAIService(message.text)
    
    // 广播AI停止思考
    broadcast({
      type: 'ai_thinking_stop'
    })
    
    // 广播AI回复
    broadcast({
      type: 'message',
      message: {
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      }
    })
  } catch (error) {
    broadcast({
      type: 'ai_thinking_stop'
    })
    console.error('AI回复失败:', error)
  }
}
```

## 性能优化

### 防抖输入状态

```jsx
import { debounce } from 'lodash'

function OptimizedTyping() {
  const { showTyping, hideTyping } = useTypingIndicatorStore()
  
  // 防抖发送输入状态
  const debouncedTypingStart = debounce(() => {
    showTyping({ id: 'current_user', name: '我', type: 'user' })
  }, 300)
  
  const debouncedTypingStop = debounce(() => {
    hideTyping('current_user')
  }, 1000)

  const handleInputChange = (e) => {
    if (e.target.value.length > 0) {
      debouncedTypingStart()
      debouncedTypingStop()
    } else {
      debouncedTypingStart.cancel()
      hideTyping('current_user')
    }
  }

  return (
    <input
      onChange={handleInputChange}
      placeholder="输入消息..."
    />
  )
}
```

### 内存优化

```jsx
function MemoryOptimizedTyping() {
  const { updateConfig } = useTypingIndicatorStore()

  React.useEffect(() => {
    // 设置合理的配置
    updateConfig({
      maxUsers: 5,        // 限制最大显示用户数
      hideTimeout: 10000  // 10秒自动隐藏
    })
  }, [])

  // 组件卸载时清理
  React.useEffect(() => {
    return () => {
      useTypingIndicatorStore.getState().reset()
    }
  }, [])

  return <TypingIndicator />
}
```

## 样式集成

### 与现有主题集成

```jsx
function ThemedTypingIndicator() {
  const { theme } = useTheme() // 假设你有主题系统

  return (
    <TypingIndicator
      className={cn(
        'transition-colors duration-200',
        theme === 'dark' 
          ? 'bg-gray-800 text-white border-gray-600'
          : 'bg-white text-gray-900 border-gray-200'
      )}
      variant="default"
    />
  )
}
```

### 响应式设计

```jsx
function ResponsiveTypingIndicator() {
  return (
    <TypingIndicator
      className="
        sm:variant-compact sm:size-sm
        md:variant-default md:size-md
        lg:variant-default lg:size-lg
      "
      position="inline"
    />
  )
}
```

## 测试

### 单元测试示例

```jsx
import { render, screen, act } from '@testing-library/react'
import { TypingIndicator, useTypingIndicatorStore } from '@/components/TypingIndicator'

describe('TypingIndicator', () => {
  beforeEach(() => {
    useTypingIndicatorStore.getState().reset()
  })

  test('显示和隐藏打字指示器', () => {
    render(<TypingIndicator />)
    
    act(() => {
      useTypingIndicatorStore.getState().showTyping({
        id: 'test',
        name: '测试用户',
        type: 'user'
      })
    })
    
    expect(screen.getByText(/正在输入/)).toBeInTheDocument()
    
    act(() => {
      useTypingIndicatorStore.getState().hideTyping('test')
    })
    
    expect(screen.queryByText(/正在输入/)).not.toBeInTheDocument()
  })
})
```

## 常见问题

### Q: 如何自定义动画效果？
A: 使用 `updateAnimation()` 方法或直接传递props给 `TypingDots` 组件

### Q: 如何限制同时显示的用户数？
A: 使用 `updateConfig({ maxUsers: 3 })` 设置最大用户数

### Q: 如何实现自动滚动？
A: 使用 `setContainerRef()` 设置滚动容器，组件会自动处理滚动

### Q: 如何与现有的聊天系统集成？
A: 在发送消息前调用 `showTyping()`，收到回复后调用 `hideTyping()`

这个打字指示器组件系统提供了完整的输入状态显示功能，可以轻松集成到你的Live2D项目中，支持实时通信和多用户场景。
