# TypingIndicator 打字指示器组件

基于原始JavaScript代码重构的现代化React打字指示器组件系统，使用Zustand进行状态管理。

## 功能特性

- 💬 **实时输入状态**：显示用户正在输入的状态
- 🎭 **多种动画效果**：点、波浪、脉冲、弹跳动画
- 👥 **多用户支持**：同时显示多个用户的输入状态
- 🎨 **自定义样式**：多种变体和大小选择
- 📱 **响应式设计**：适配不同屏幕尺寸
- ⚡ **自动管理**：自动滚动、超时隐藏
- 🔧 **高度可配置**：丰富的配置选项

## 组件结构

```
src/components/TypingIndicator/
├── TypingIndicator.jsx         # 主组件
├── TypingDots.jsx             # 动画点组件
├── TypingUser.jsx             # 单用户状态组件
├── TypingIndicatorExample.jsx # 使用示例
├── index.js                   # 导出文件
└── README.md                  # 使用文档
```

## 快速开始

### 1. 基础使用

```jsx
import { TypingIndicator, useTypingIndicatorStore } from '@/components/TypingIndicator'

function ChatInterface() {
  const { showTyping, hideTyping } = useTypingIndicatorStore()

  const handleAIResponse = () => {
    // 显示AI正在输入
    showTyping({
      id: 'ai',
      name: 'AI助手',
      avatar: 'AI',
      type: 'bot'
    })

    // 模拟AI回复时间
    setTimeout(() => {
      hideTyping('ai')
      // 显示AI回复
    }, 3000)
  }

  return (
    <div className="chat-container">
      {/* 聊天消息 */}
      <div className="messages">
        {/* 消息列表 */}
      </div>
      
      {/* 打字指示器 */}
      <TypingIndicator
        position="inline"
        variant="default"
        size="md"
      />
    </div>
  )
}
```

### 2. 多用户输入状态

```jsx
function MultiUserChat() {
  const { showTyping, hideTyping } = useTypingIndicatorStore()

  const simulateMultipleUsers = () => {
    // 显示多个用户正在输入
    showTyping({ id: 'user1', name: '张三', type: 'user' })
    showTyping({ id: 'user2', name: '李四', type: 'user' })
    showTyping({ id: 'admin', name: '管理员', type: 'admin' })
  }

  return (
    <div>
      <TypingIndicator
        showMultipleUsers={true}
        variant="compact"
      />
      
      <button onClick={simulateMultipleUsers}>
        模拟多用户输入
      </button>
    </div>
  )
}
```

### 3. 自定义动画

```jsx
function CustomAnimation() {
  const { updateAnimation } = useTypingIndicatorStore()

  React.useEffect(() => {
    updateAnimation({
      style: 'wave',
      speed: 'fast',
      dotCount: 4
    })
  }, [])

  return (
    <TypingIndicator
      variant="minimal"
      size="lg"
    />
  )
}
```

## API 参考

### TypingIndicator

主要的打字指示器组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `position` | `'bottom' \| 'inline' \| 'floating'` | `'bottom'` | 显示位置 |
| `variant` | `'default' \| 'compact' \| 'minimal'` | `'default'` | 样式变体 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 组件大小 |
| `showMultipleUsers` | `boolean` | `true` | 是否显示多用户 |
| `showAvatar` | `boolean` | - | 是否显示头像 |
| `showUserName` | `boolean` | - | 是否显示用户名 |
| `onUserRemove` | `(userId) => void` | - | 用户移除回调 |

### TypingDots

动画点组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `style` | `'dots' \| 'wave' \| 'pulse' \| 'bounce'` | `'dots'` | 动画样式 |
| `speed` | `'slow' \| 'normal' \| 'fast'` | `'normal'` | 动画速度 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 点的大小 |
| `dotCount` | `number` | `3` | 点的数量 |
| `color` | `string` | `'current'` | 点的颜色 |

### TypingUser

单用户状态组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `user` | `Object` | - | 用户信息对象 |
| `showAvatar` | `boolean` | `true` | 是否显示头像 |
| `showName` | `boolean` | `true` | 是否显示用户名 |
| `avatarSize` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | 头像大小 |
| `dotSize` | `'sm' \| 'md' \| 'lg'` | `'md'` | 动画点大小 |
| `onRemove` | `(userId) => void` | - | 移除回调 |

## 状态管理

使用Zustand进行状态管理：

```jsx
import { useTypingIndicatorStore } from '@/components/TypingIndicator'

function CustomComponent() {
  const {
    // 状态
    ui,
    typingUsers,
    animation,
    config,
    
    // 方法
    showTyping,
    hideTyping,
    hideAllTyping,
    updateAnimation,
    updateConfig,
    setContainerRef,
    scrollToBottom,
    reset
  } = useTypingIndicatorStore()

  return (
    <div>
      <p>当前输入用户: {typingUsers.length}</p>
      <p>是否可见: {ui.isVisible ? '是' : '否'}</p>
    </div>
  )
}
```

## 事件系统

组件使用自定义事件进行通信：

```javascript
// 监听显示事件
window.addEventListener('typingIndicatorShow', (event) => {
  console.log('用户开始输入:', event.detail.user)
})

// 监听隐藏事件
window.addEventListener('typingIndicatorHide', (event) => {
  console.log('用户停止输入:', event.detail.userId)
})

// 监听隐藏所有事件
window.addEventListener('typingIndicatorHideAll', () => {
  console.log('所有用户停止输入')
})
```

## 高级用法

### WebSocket集成

```jsx
function WebSocketTyping() {
  const { showTyping, hideTyping } = useTypingIndicatorStore()

  React.useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000')
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'user_typing_start':
          showTyping({
            id: data.userId,
            name: data.userName,
            avatar: data.userAvatar,
            type: 'user'
          })
          break
          
        case 'user_typing_stop':
          hideTyping(data.userId)
          break
      }
    }
    
    return () => ws.close()
  }, [showTyping, hideTyping])

  return <TypingIndicator />
}
```

### 自动超时隐藏

```jsx
function AutoHideTyping() {
  const { updateConfig } = useTypingIndicatorStore()

  React.useEffect(() => {
    updateConfig({
      hideTimeout: 5000 // 5秒后自动隐藏
    })
  }, [])

  return <TypingIndicator />
}
```

### 自定义滚动容器

```jsx
function CustomScrollContainer() {
  const containerRef = useRef(null)
  const { setContainerRef } = useTypingIndicatorStore()

  React.useEffect(() => {
    setContainerRef(containerRef)
  }, [setContainerRef])

  return (
    <div ref={containerRef} className="chat-container">
      <TypingIndicator />
    </div>
  )
}
```

### 主题自定义

```jsx
function ThemedTypingIndicator() {
  return (
    <div className="dark-theme">
      <TypingIndicator
        className="bg-gray-800 text-white border-gray-600"
        variant="default"
      />
    </div>
  )
}
```

## 样式自定义

### CSS变量

```css
/* 在你的CSS文件中 */
.typing-indicator {
  --typing-dot-color: #3b82f6;
  --typing-bg-color: rgba(255, 255, 255, 0.95);
  --typing-border-color: #e5e7eb;
  --typing-text-color: #6b7280;
}
```

### 自定义动画

```css
@keyframes custom-typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8) rotate(0deg);
  }
  30% {
    opacity: 1;
    transform: scale(1.2) rotate(180deg);
  }
}

.custom-typing-animation {
  animation: custom-typing 1.5s ease-in-out infinite;
}
```

## 集成示例

### 与聊天系统集成

```jsx
function ChatWithTyping() {
  const [messages, setMessages] = useState([])
  const { showTyping, hideTyping } = useTypingIndicatorStore()

  const sendMessage = (text) => {
    // 发送消息
    setMessages(prev => [...prev, { text, sender: 'user' }])
    
    // 显示AI正在回复
    showTyping({ id: 'ai', name: 'AI', type: 'bot' })
    
    // 模拟AI回复
    setTimeout(() => {
      hideTyping('ai')
      setMessages(prev => [...prev, { text: 'AI回复', sender: 'ai' }])
    }, 2000)
  }

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className="message">{msg.text}</div>
        ))}
        <TypingIndicator />
      </div>
      
      <input onKeyPress={(e) => {
        if (e.key === 'Enter') {
          sendMessage(e.target.value)
          e.target.value = ''
        }
      }} />
    </div>
  )
}
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 注意事项

1. **性能**: 大量用户同时输入时注意性能优化
2. **内存**: 组件会自动清理定时器，避免内存泄漏
3. **可访问性**: 支持屏幕阅读器和键盘导航
4. **响应式**: 在移动设备上自动调整大小和布局

## 故障排除

### 常见问题

1. **动画不显示**
   - 检查CSS动画是否正确加载
   - 确认浏览器支持CSS动画

2. **自动滚动不工作**
   - 检查滚动容器引用是否正确设置
   - 确认容器有正确的overflow样式

3. **多用户状态混乱**
   - 确保每个用户有唯一的ID
   - 检查用户添加和移除的逻辑

4. **样式不正确**
   - 检查Tailwind CSS类是否正确加载
   - 确认组件的className属性
