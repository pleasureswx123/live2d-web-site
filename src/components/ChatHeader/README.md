# ChatHeader 聊天头部组件

基于原始JavaScript代码重构的现代化React聊天头部组件系统，使用Zustand进行状态管理。

## 功能特性

- 👤 **角色信息显示**：头像、名称、状态、模型信息
- 🧠 **思考模式**：可切换的思考模式指示器
- 🔊 **音频功能**：音频测试、TTS播放、音量控制
- 🎨 **多种样式**：默认、紧凑、最小三种变体
- 📱 **响应式设计**：适配不同屏幕尺寸
- ⚡ **实时状态**：动态状态更新和视觉反馈
- 🔧 **高度可配置**：丰富的配置选项

## 组件结构

```
src/components/ChatHeader/
├── ChatHeader.jsx          # 主组件
├── AudioTestButton.jsx     # 音频测试按钮
├── ThinkingIndicator.jsx   # 思考指示器
├── AudioPlayer.jsx         # 音频播放器
├── ChatHeaderExample.jsx   # 使用示例
├── index.js               # 导出文件
└── README.md              # 使用文档
```

## 快速开始

### 1. 基础使用

```jsx
import { ChatHeader, useChatHeaderStore } from '@/components/ChatHeader'

function App() {
  const { updateCharacterInfo } = useChatHeaderStore()

  React.useEffect(() => {
    // 设置角色信息
    updateCharacterInfo({
      name: '小助手',
      model: 'gpt-4',
      avatar: '/avatar.jpg'
    })
  }, [])

  return (
    <div className="chat-app">
      <ChatHeader
        variant="default"
        onCharacterClick={(char) => console.log('角色:', char)}
        onModelClick={(model) => console.log('模型:', model)}
      />
      
      {/* 聊天内容 */}
      <div className="chat-content">
        {/* 消息列表 */}
      </div>
    </div>
  )
}
```

### 2. 音频功能集成

```jsx
function ChatWithAudio() {
  const { playTTSAudio, testBrowserAudio } = useChatHeaderStore()

  const handleAIResponse = async (text) => {
    try {
      // 调用TTS API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // 播放TTS音频
        await playTTSAudio(data.audio_data, data.format)
      }
    } catch (error) {
      console.error('TTS播放失败:', error)
    }
  }

  return (
    <ChatHeader
      showAudioTest={true}
      showAudioPlayer={true}
      actions={
        <button onClick={testBrowserAudio}>
          测试音频
        </button>
      }
    />
  )
}
```

### 3. 思考模式集成

```jsx
function ChatWithThinking() {
  const { setThinkingActive, toggleThinkingMode } = useChatHeaderStore()

  const simulateAIThinking = async () => {
    // 开始思考
    setThinkingActive(true)
    
    try {
      // 调用AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello' })
      })
      
      const result = await response.json()
      
      // 思考完成
      setThinkingActive(false)
      
      return result
    } catch (error) {
      setThinkingActive(false)
      throw error
    }
  }

  return (
    <ChatHeader
      showThinkingIndicator={true}
      onCharacterClick={() => toggleThinkingMode()}
    />
  )
}
```

## API 参考

### ChatHeader

主要的聊天头部组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `variant` | `'default' \| 'compact' \| 'minimal'` | `'default'` | 样式变体 |
| `showAvatar` | `boolean` | `true` | 是否显示头像 |
| `showModelInfo` | `boolean` | - | 是否显示模型信息 |
| `showThinkingIndicator` | `boolean` | - | 是否显示思考指示器 |
| `showAudioTest` | `boolean` | - | 是否显示音频测试按钮 |
| `showAudioPlayer` | `boolean` | `true` | 是否显示音频播放器 |
| `onCharacterClick` | `(character) => void` | - | 角色点击回调 |
| `onModelClick` | `(model) => void` | - | 模型点击回调 |
| `actions` | `ReactNode` | - | 自定义操作按钮 |

### AudioTestButton

音频测试按钮组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `variant` | `string` | `'default'` | 按钮变体 |
| `size` | `string` | `'sm'` | 按钮大小 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `onTestStart` | `() => void` | - | 测试开始回调 |
| `onTestSuccess` | `(message) => void` | - | 测试成功回调 |
| `onTestError` | `(error) => void` | - | 测试失败回调 |

### ThinkingIndicator

思考指示器组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `variant` | `'default' \| 'compact' \| 'minimal'` | `'default'` | 样式变体 |
| `clickable` | `boolean` | `true` | 是否可点击切换 |
| `showIcon` | `boolean` | `true` | 是否显示图标 |
| `onToggle` | `(enabled) => void` | - | 切换回调 |

### AudioPlayer

音频播放器组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `showControls` | `boolean` | `true` | 是否显示控制按钮 |
| `showVolume` | `boolean` | `true` | 是否显示音量控制 |
| `showSpeed` | `boolean` | `false` | 是否显示速度控制 |
| `onPlay` | `() => void` | - | 播放回调 |
| `onPause` | `() => void` | - | 暂停回调 |
| `onStop` | `() => void` | - | 停止回调 |

## 状态管理

使用Zustand进行状态管理：

```jsx
import { useChatHeaderStore } from '@/components/ChatHeader'

function CustomComponent() {
  const {
    // 状态
    character,
    thinking,
    audio,
    ui,
    
    // 角色相关方法
    updateCharacterInfo,
    
    // 思考相关方法
    toggleThinkingMode,
    setThinkingActive,
    
    // 音频相关方法
    testBrowserAudio,
    playTTSAudio,
    stopCurrentAudio,
    setAudioVolume,
    
    // 配置方法
    updateUIConfig,
    updateConfig,
    reset
  } = useChatHeaderStore()

  return (
    <div>
      <p>角色: {character.name}</p>
      <p>状态: {character.status}</p>
      <p>思考模式: {thinking.enabled ? '开启' : '关闭'}</p>
      <p>音频播放: {audio.isPlaying ? '播放中' : '未播放'}</p>
    </div>
  )
}
```

## 事件系统

组件使用自定义事件进行通信：

```javascript
// 监听音频测试事件
window.addEventListener('audioTestSuccess', (event) => {
  console.log('音频测试成功:', event.detail.message)
})

window.addEventListener('audioTestError', (event) => {
  console.error('音频测试失败:', event.detail.error)
})

// 监听思考模式变化
window.addEventListener('thinkingModeChanged', (event) => {
  console.log('思考模式变化:', event.detail.enabled)
})

// 监听音频播放事件
window.addEventListener('audioPlayError', (event) => {
  console.error('音频播放错误:', event.detail.error)
})

// 监听显示播放按钮事件（处理自动播放限制）
window.addEventListener('showAudioPlayButton', (event) => {
  console.log('需要显示手动播放按钮:', event.detail.audioUrl)
})
```

## 高级用法

### 自定义角色状态

```jsx
function CustomCharacterStatus() {
  const { updateCharacterInfo } = useChatHeaderStore()

  const setCharacterStatus = (status) => {
    updateCharacterInfo({ status })
    
    // 根据状态执行不同操作
    switch (status) {
      case 'thinking':
        // 显示思考动画
        break
      case 'speaking':
        // 显示语音动画
        break
      case 'offline':
        // 显示离线状态
        break
    }
  }

  return (
    <div>
      <button onClick={() => setCharacterStatus('thinking')}>
        设为思考中
      </button>
      <button onClick={() => setCharacterStatus('speaking')}>
        设为语音中
      </button>
    </div>
  )
}
```

### TTS集成

```jsx
function TTSIntegration() {
  const { playTTSAudio, updateConfig } = useChatHeaderStore()

  React.useEffect(() => {
    // 配置TTS API
    updateConfig({
      ttsApiUrl: 'https://your-tts-api.com/synthesize',
      audioFormat: 'mp3'
    })
  }, [])

  const speakText = async (text) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: 'zh-CN-XiaoxiaoNeural',
          format: 'mp3'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        await playTTSAudio(data.audio_data, data.format)
      }
    } catch (error) {
      console.error('TTS失败:', error)
    }
  }

  return (
    <ChatHeader
      actions={
        <button onClick={() => speakText('你好，我是AI助手')}>
          语音问候
        </button>
      }
    />
  )
}
```

### 主题自定义

```jsx
function ThemedChatHeader() {
  const { theme } = useTheme() // 假设你有主题系统

  return (
    <ChatHeader
      className={cn(
        'transition-colors duration-200',
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-700'
          : 'bg-white border-gray-200'
      )}
      variant="default"
    />
  )
}
```

## 样式自定义

### CSS变量

```css
/* 在你的CSS文件中 */
.chat-header {
  --header-bg-color: rgba(255, 255, 255, 0.95);
  --header-border-color: #e5e7eb;
  --header-text-color: #1f2937;
  --status-online-color: #10b981;
  --status-thinking-color: #3b82f6;
  --status-speaking-color: #f59e0b;
}
```

### 自定义样式

```jsx
<ChatHeader
  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
  variant="compact"
/>
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

需要支持：
- `Web Audio API`
- `Fetch API`
- `URL.createObjectURL`
- `Audio元素`

## 注意事项

1. **音频权限**: 需要用户授权音频播放权限
2. **自动播放**: 现代浏览器限制自动播放，组件会自动处理
3. **内存管理**: 组件会自动清理音频资源和URL对象
4. **网络请求**: TTS功能需要配置正确的API端点
5. **性能**: 大量音频播放时注意内存使用

## 故障排除

### 常见问题

1. **音频无法播放**
   - 检查浏览器是否支持Web Audio API
   - 确认用户已授权音频权限
   - 检查TTS API配置是否正确

2. **思考指示器不响应**
   - 确认组件的clickable属性为true
   - 检查事件监听器是否正确设置

3. **样式显示异常**
   - 确认Tailwind CSS正确加载
   - 检查组件的className属性

4. **状态不同步**
   - 确认使用同一个store实例
   - 检查状态更新方法是否正确调用
