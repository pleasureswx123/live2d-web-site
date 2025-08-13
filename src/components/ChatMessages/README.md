# ChatMessages 聊天消息组件

基于原始JavaScript代码重构的现代化React聊天消息组件系统，使用Zustand进行状态管理。

## 功能特性

- 💬 **消息显示**：用户消息、AI消息、系统消息
- 📎 **文件附件**：图片预览、文件下载、多种文件类型支持
- 🎨 **消息格式化**：HTML转义、代码块、换行处理
- 👤 **用户管理**：多用户切换、个性化欢迎消息
- 🔍 **搜索功能**：消息搜索、搜索指示器
- 📱 **响应式设计**：适配不同屏幕尺寸
- ⚡ **性能优化**：虚拟滚动、自动滚动管理
- 🔧 **高度可配置**：丰富的配置选项

## 组件结构

```
src/components/ChatMessages/
├── ChatMessages.jsx        # 主容器组件
├── Message.jsx             # 单条消息组件
├── MessageContent.jsx      # 消息内容组件
├── FileAttachment.jsx      # 文件附件组件
├── SearchIndicator.jsx     # 搜索指示器
├── ChatMessagesExample.jsx # 使用示例
├── index.js               # 导出文件
└── README.md              # 使用文档
```

## 快速开始

### 1. 基础使用

```jsx
import { ChatMessages, useChatMessagesStore } from '@/components/ChatMessages'

function ChatApp() {
  const { addUserMessage, addBotMessage, setCurrentUser } = useChatMessagesStore()

  React.useEffect(() => {
    // 设置当前用户
    setCurrentUser({
      name: '张三',
      avatar: '张',
      id: 'user_123'
    })
  }, [])

  const sendMessage = (text) => {
    // 添加用户消息
    addUserMessage(text)
    
    // 模拟AI回复
    setTimeout(() => {
      addBotMessage('这是AI的回复')
    }, 1000)
  }

  return (
    <div className="h-96">
      <ChatMessages
        showAvatar={true}
        showTimestamp={true}
        showStatus={true}
      />
    </div>
  )
}
```

### 2. 文件附件支持

```jsx
function ChatWithFiles() {
  const { addUserMessage } = useChatMessagesStore()

  const handleFileUpload = (text, file) => {
    // 添加带附件的用户消息
    addUserMessage(text, file)
  }

  return (
    <ChatMessages
      onAttachmentClick={(attachment) => {
        // 处理附件点击
        if (attachment.type.startsWith('image/')) {
          window.open(attachment.url, '_blank')
        }
      }}
    />
  )
}
```

### 3. 消息操作

```jsx
function ChatWithActions() {
  const { deleteMessage, updateMessageContent } = useChatMessagesStore()

  return (
    <ChatMessages
      showActions={true}
      onMessageDelete={(messageId) => {
        if (confirm('确定删除这条消息吗？')) {
          deleteMessage(messageId)
        }
      }}
      onMessageEdit={(message) => {
        const newContent = prompt('编辑消息:', message.content)
        if (newContent) {
          updateMessageContent(message.id, newContent)
        }
      }}
      onMessageReply={(message) => {
        console.log('回复消息:', message)
      }}
    />
  )
}
```

## API 参考

### ChatMessages

主要的聊天消息容器组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `showAvatar` | `boolean` | `true` | 是否显示头像 |
| `showTimestamp` | `boolean` | `true` | 是否显示时间戳 |
| `showStatus` | `boolean` | `true` | 是否显示消息状态 |
| `showActions` | `boolean` | `false` | 是否显示消息操作 |
| `enableVirtualScroll` | `boolean` | `false` | 是否启用虚拟滚动 |
| `onMessageClick` | `(message) => void` | - | 消息点击回调 |
| `onAvatarClick` | `(user) => void` | - | 头像点击回调 |
| `onAttachmentClick` | `(attachment) => void` | - | 附件点击回调 |
| `onMessageDelete` | `(messageId) => void` | - | 消息删除回调 |
| `onMessageEdit` | `(message) => void` | - | 消息编辑回调 |
| `onMessageReply` | `(message) => void` | - | 消息回复回调 |
| `emptyState` | `ReactNode` | - | 空状态显示 |

### Message

单条消息组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `message` | `Object` | - | 消息对象 |
| `showAvatar` | `boolean` | `true` | 是否显示头像 |
| `showTimestamp` | `boolean` | `true` | 是否显示时间戳 |
| `showStatus` | `boolean` | `true` | 是否显示状态 |
| `showActions` | `boolean` | `false` | 是否显示操作 |

### MessageContent

消息内容组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `content` | `string` | - | 消息内容 |
| `attachments` | `Array` | `[]` | 附件列表 |
| `isStreaming` | `boolean` | `false` | 是否流式输出 |

### FileAttachment

文件附件组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `attachment` | `Object` | - | 附件对象 |
| `showDownload` | `boolean` | `true` | 是否显示下载按钮 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 显示大小 |
| `onDownload` | `(attachment) => void` | - | 下载回调 |
| `onClick` | `(attachment) => void` | - | 点击回调 |

## 状态管理

使用Zustand进行状态管理：

```jsx
import { useChatMessagesStore } from '@/components/ChatMessages'

function CustomComponent() {
  const {
    // 状态
    messages,
    currentUser,
    ui,
    config,
    
    // 消息操作
    addMessage,
    addUserMessage,
    addBotMessage,
    addSystemMessage,
    updateMessageStatus,
    updateMessageContent,
    deleteMessage,
    clearMessages,
    
    // 用户操作
    setCurrentUser,
    switchToUser,
    logoutUser,
    
    // UI操作
    showSearchIndicator,
    hideSearchIndicator,
    scrollToBottom,
    
    // 工具方法
    formatMessageText,
    searchMessages,
    getMessageStats,
    exportMessages,
    
    // 配置
    updateConfig,
    reset
  } = useChatMessagesStore()

  return (
    <div>
      <p>消息总数: {messages.length}</p>
      <p>当前用户: {currentUser.name}</p>
    </div>
  )
}
```

## 消息对象结构

```javascript
{
  id: string,              // 消息ID
  type: 'user' | 'bot' | 'system', // 消息类型
  content: string,         // 消息内容（HTML格式）
  timestamp: Date,         // 时间戳
  user: {                  // 用户信息
    name: string,
    avatar: string,
    id: string
  },
  attachments: [           // 附件列表
    {
      id: string,
      type: string,        // MIME类型
      name: string,        // 文件名
      size: number,        // 文件大小
      url: string,         // 文件URL
      file?: File          // 原始文件对象
    }
  ],
  status: 'sending' | 'sent' | 'delivered' | 'error', // 消息状态
  isStreaming?: boolean,   // 是否流式输出
  isSearchIndicator?: boolean // 是否搜索指示器
}
```

## 事件系统

组件使用自定义事件进行通信：

```javascript
// 监听消息添加
window.addEventListener('messageAdded', (event) => {
  console.log('新消息:', event.detail.message)
})

// 监听消息删除
window.addEventListener('messageDeleted', (event) => {
  console.log('删除消息ID:', event.detail.messageId)
})

// 监听消息清空
window.addEventListener('messagesCleared', () => {
  console.log('消息已清空')
})
```

## 高级用法

### 流式消息输出

```jsx
function StreamingChat() {
  const { createNewBotMessage, updateMessageContent } = useChatMessagesStore()

  const simulateStreaming = async () => {
    const messageId = createNewBotMessage()
    const text = "这是一个流式输出的示例消息，会逐字显示。"

    for (let i = 0; i <= text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50))
      updateMessageContent(messageId, text.substring(0, i))
    }
  }

  return (
    <ChatMessages />
  )
}
```

### 自定义消息格式化

```jsx
function CustomFormatting() {
  const { formatMessageText } = useChatMessagesStore()

  // 自定义格式化函数
  const customFormat = (text) => {
    let formatted = formatMessageText(text)

    // 添加自定义格式化
    formatted = formatted.replace(/@(\w+)/g, '<span class="mention">@$1</span>')
    formatted = formatted.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')

    return formatted
  }

  return <ChatMessages />
}
```

### 消息搜索和过滤

```jsx
function SearchableChat() {
  const { searchMessages, showSearchIndicator, hideSearchIndicator } = useChatMessagesStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredMessages, setFilteredMessages] = useState([])

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setFilteredMessages([])
      return
    }

    showSearchIndicator(query)

    // 模拟搜索延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    const results = searchMessages(query)
    setFilteredMessages(results)
    hideSearchIndicator()
  }

  return (
    <div>
      <input
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value)
          handleSearch(e.target.value)
        }}
        placeholder="搜索消息..."
      />
      <ChatMessages />
    </div>
  )
}
```

### 消息导出功能

```jsx
function ExportableChat() {
  const { exportMessages, getMessageStats } = useChatMessagesStore()

  const handleExport = (format) => {
    const data = exportMessages(format)

    if (format === 'json') {
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'chat-messages.json'
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'txt') {
      const blob = new Blob([data], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'chat-messages.txt'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const stats = getMessageStats()

  return (
    <div>
      <div>总消息数: {stats.total}</div>
      <button onClick={() => handleExport('json')}>导出JSON</button>
      <button onClick={() => handleExport('txt')}>导出文本</button>
      <ChatMessages />
    </div>
  )
}
```

## 样式自定义

### CSS变量

```css
/* 在你的CSS文件中 */
.chat-messages {
  --message-user-bg: #007AFF;
  --message-bot-bg: #F2F2F7;
  --message-system-bg: #FFF3CD;
  --message-border-radius: 12px;
  --message-padding: 12px;
  --avatar-size: 32px;
}
```

### 自定义主题

```jsx
function ThemedChatMessages() {
  const { theme } = useTheme()

  return (
    <ChatMessages
      className={cn(
        'transition-colors duration-200',
        theme === 'dark'
          ? 'bg-gray-900 text-white'
          : 'bg-white text-gray-900'
      )}
    />
  )
}
```

## 性能优化

### 虚拟滚动

```jsx
function LargeChatMessages() {
  return (
    <ChatMessages
      enableVirtualScroll={true}
      // 当消息数量超过100时自动启用虚拟滚动
    />
  )
}
```

### 消息分页

```jsx
function PaginatedChat() {
  const { messages, updateConfig } = useChatMessagesStore()

  React.useEffect(() => {
    // 限制内存中的消息数量
    updateConfig({ maxMessages: 500 })
  }, [])

  return <ChatMessages />
}
```

## 集成示例

### 与WebSocket集成

```jsx
function RealtimeChat() {
  const { addUserMessage, addBotMessage, setCurrentUser } = useChatMessagesStore()

  React.useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/chat')

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'message':
          addBotMessage(data.content)
          break
        case 'user_joined':
          setCurrentUser(data.user)
          break
      }
    }

    return () => ws.close()
  }, [])

  return <ChatMessages />
}
```

### 与文件上传集成

```jsx
import { FileUploadComplete } from '@/components/FileUpload'

function ChatWithFileUpload() {
  const { addUserMessage } = useChatMessagesStore()

  const handleFileSelect = (file) => {
    addUserMessage('', file.file)
  }

  return (
    <div>
      <ChatMessages />
      <FileUploadComplete
        mode="button"
        onFileSelect={handleFileSelect}
        acceptedTypes={['image/*', '.pdf', '.doc', '.docx']}
      />
    </div>
  )
}
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

需要支持：
- `Blob API`
- `URL.createObjectURL`
- `File API`
- `Intersection Observer` (虚拟滚动)

## 注意事项

1. **内存管理**: 组件会自动清理附件URL，避免内存泄漏
2. **文件大小**: 建议限制附件文件大小，避免性能问题
3. **安全性**: 消息内容会进行HTML转义，防止XSS攻击
4. **性能**: 大量消息时建议启用虚拟滚动
5. **可访问性**: 支持键盘导航和屏幕阅读器

## 故障排除

### 常见问题

1. **消息不显示**
   - 检查消息对象结构是否正确
   - 确认组件容器有正确的高度

2. **附件无法预览**
   - 检查文件类型是否支持
   - 确认文件URL是否有效

3. **滚动不工作**
   - 检查容器的overflow样式
   - 确认容器引用是否正确设置

4. **格式化异常**
   - 检查HTML内容是否正确转义
   - 确认CSS样式是否正确加载
