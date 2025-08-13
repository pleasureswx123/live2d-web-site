# MainChatInterface 主聊天界面组件

这是整个项目的核心聊天组件，整合了所有聊天相关功能，提供完整的聊天体验。

## 🎯 功能特性

### 核心功能
- 💬 **完整聊天界面** - 头部、消息、输入区域
- 🔄 **实时通信** - WebSocket集成
- 📎 **文件上传** - 图片、文档支持
- 🎤 **语音识别** - ASR集成
- 🔍 **智能搜索** - 关键词自动检测
- 🔊 **TTS管理** - 发送时自动打断播放

### 界面组件
- **ChatHeader** - 聊天头部（角色信息、状态）
- **ChatMessages** - 消息显示区域
- **TypingIndicator** - 打字指示器
- **FileUpload** - 文件上传组件
- **ASRChatIntegration** - 语音识别集成
- **MessageInput** - 消息输入框

### 智能功能
- **搜索触发** - 自动检测搜索关键词
- **文件处理** - 自动上传和预览
- **音频管理** - 智能TTS播放控制
- **响应式设计** - 适配不同屏幕

## 🚀 快速开始

### 基础使用

```jsx
import MainChatInterface from '@/components/MainChatInterface'

function App() {
  return (
    <div className="h-screen">
      <MainChatInterface
        enableSearch={true}
        enableFileUpload={true}
        enableASR={true}
        onError={(error) => console.error(error)}
        onNotification={(message, type) => console.log(message, type)}
      />
    </div>
  )
}
```

### 完整配置

```jsx
<MainChatInterface
  // 基础配置
  className="custom-chat"
  placeholder="输入你的消息..."
  maxMessageLength={2000}
  
  // 功能开关
  enableSearch={true}
  enableFileUpload={true}
  enableASR={true}
  
  // 事件处理
  onError={(error) => showErrorToast(error)}
  onNotification={(message, type) => showNotification(message, type)}
/>
```

## 📋 API 参考

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `className` | `string` | `''` | 额外的CSS类名 |
| `enableSearch` | `boolean` | `true` | 启用智能搜索 |
| `enableFileUpload` | `boolean` | `true` | 启用文件上传 |
| `enableASR` | `boolean` | `true` | 启用语音识别 |
| `maxMessageLength` | `number` | `1000` | 最大消息长度 |
| `placeholder` | `string` | `"发送消息给悠悠..."` | 输入框占位符 |
| `onError` | `function` | - | 错误处理回调 |
| `onNotification` | `function` | - | 通知回调 |

### 搜索关键词

组件会自动检测以下关键词并触发搜索：

**通用搜索：**
- 搜索、查找、查询、最新、现在、今天、新闻
- 什么是、怎么样、如何

**时间查询：**
- 现在、今天、几号、时间、日期

**新闻查询：**
- 新闻、最新、热点、时事

## 🔧 集成说明

### 与现有组件的集成

```jsx
// 在App.jsx中使用
import { VoiceProvider } from '@/contexts/VoiceContext'
import { WebSocketProvider } from '@/contexts/WebSocketContext'
import MainChatInterface from '@/components/MainChatInterface'

function App() {
  return (
    <VoiceProvider>
      <WebSocketProvider>
        <div className="app-layout">
          {/* Live2D模型 */}
          <Live2DViewer />
          
          {/* 主聊天界面 */}
          <MainChatInterface className="chat-panel" />
          
          {/* 其他组件 */}
        </div>
      </WebSocketProvider>
    </VoiceProvider>
  )
}
```

### 状态管理集成

组件使用以下Zustand stores：

- `useChatMessagesStore` - 消息管理
- `useTypingIndicatorStore` - 打字指示器
- `useFileUploadStore` - 文件上传
- `useASRStore` - 语音识别
- `useChatHeaderStore` - 聊天头部

### WebSocket集成

```javascript
// 消息发送格式
{
  type: 'chat',
  content: '用户消息',
  search_query: '搜索关键词', // 可选
  image_url: 'https://...', // 可选，文件上传后的URL
}
```

## 🎨 样式自定义

### 基础样式

```jsx
<MainChatInterface
  className="
    h-full 
    bg-white/95 
    backdrop-blur-sm 
    rounded-lg 
    shadow-xl 
    border
  "
/>
```

### 响应式布局

```jsx
// 桌面端
<div className="hidden md:block w-96 h-full">
  <MainChatInterface />
</div>

// 移动端
<div className="md:hidden w-full h-full">
  <MainChatInterface className="rounded-none" />
</div>
```

## 🔄 事件处理

### 错误处理

```jsx
const handleError = (error) => {
  console.error('聊天错误:', error)
  
  // 显示用户友好的错误信息
  if (error.includes('连接')) {
    showToast('网络连接问题，请检查网络', 'error')
  } else if (error.includes('文件')) {
    showToast('文件上传失败，请重试', 'error')
  } else {
    showToast('操作失败，请重试', 'error')
  }
}

<MainChatInterface onError={handleError} />
```

### 通知处理

```jsx
const handleNotification = (message, type) => {
  switch (type) {
    case 'info':
      showToast(message, 'info')
      break
    case 'success':
      showToast(message, 'success')
      break
    case 'warning':
      showToast(message, 'warning')
      break
  }
}

<MainChatInterface onNotification={handleNotification} />
```

## 🧪 测试

### 功能测试

```jsx
// 测试消息发送
const testSendMessage = () => {
  // 模拟用户输入
  fireEvent.change(messageInput, { target: { value: '测试消息' } })
  fireEvent.click(sendButton)
  
  // 验证消息是否发送
  expect(mockWebSocket.send).toHaveBeenCalledWith(
    JSON.stringify({
      type: 'chat',
      content: '测试消息'
    })
  )
}

// 测试搜索触发
const testSearchTrigger = () => {
  fireEvent.change(messageInput, { target: { value: '搜索最新新闻' } })
  fireEvent.click(sendButton)
  
  // 验证搜索参数
  expect(mockWebSocket.send).toHaveBeenCalledWith(
    JSON.stringify({
      type: 'chat',
      content: '搜索最新新闻',
      search_query: '搜索最新新闻'
    })
  )
}
```

## 📱 移动端适配

```jsx
// 移动端优化配置
<MainChatInterface
  className="
    h-full 
    w-full 
    md:w-96 
    md:rounded-lg 
    md:shadow-xl
  "
  placeholder="输入消息..."
  maxMessageLength={500} // 移动端限制更短
/>
```

## 🔧 故障排除

### 常见问题

1. **WebSocket连接失败**
   - 检查WebSocketProvider是否正确包装
   - 确认WebSocket服务器地址

2. **文件上传失败**
   - 检查文件大小限制
   - 确认上传接口配置

3. **ASR不工作**
   - 检查麦克风权限
   - 确认ASR服务配置

4. **消息不显示**
   - 检查ChatMessagesStore状态
   - 确认消息格式正确

这个组件是整个项目的核心，提供了完整的聊天体验，可以根据具体需求进行定制和扩展。
