# ASR 语音识别组件

基于原始JavaScript代码重构的现代化React语音识别组件系统，使用Zustand进行状态管理。

## 功能特性

- 🎤 **长按空格键触发语音识别**
- 🔊 **实时音频处理和PCM转换**
- 🌐 **WebSocket通信支持**
- 🎯 **智能停顿检测**
- 🎨 **现代化UI设计**
- 📱 **响应式布局**
- ♿ **无障碍支持**

## 组件结构

```
src/components/ASR/
├── ASRButton.jsx      # 语音识别按钮
├── ASRStatus.jsx      # 状态显示组件
├── ASRProvider.jsx    # 键盘事件提供者
├── ASRComplete.jsx    # 完整组合组件
├── index.js          # 导出文件
└── README.md         # 使用文档
```

## 快速开始

### 1. 基础使用

```jsx
import { ASRComplete } from '@/components/ASR'

function App() {
  const [webSocket, setWebSocket] = useState(null)

  const handleResult = (text) => {
    console.log('识别结果:', text)
    // 处理识别结果
  }

  const handleError = (error) => {
    console.error('ASR错误:', error)
    // 处理错误
  }

  const handleNotification = (message, type) => {
    console.log('通知:', message, type)
    // 显示通知
  }

  return (
    <div>
      <input id="messageInput" placeholder="输入消息..." />
      
      <ASRComplete
        webSocket={webSocket}
        onResult={handleResult}
        onError={handleError}
        onNotification={handleNotification}
        targetInputId="messageInput"
      />
    </div>
  )
}
```

### 2. 分离使用

```jsx
import { ASRButton, ASRStatus, ASRProvider } from '@/components/ASR'

function CustomASR() {
  return (
    <ASRProvider
      targetInputId="messageInput"
      onResult={(text) => console.log(text)}
      onError={(error) => console.error(error)}
    >
      <div className="flex items-center space-x-4">
        <ASRButton variant="default" size="sm" />
        <span>长按空格键开始语音输入</span>
      </div>
      
      <ASRStatus position="bottom" showWave={true} />
    </ASRProvider>
  )
}
```

### 3. 自定义样式

```jsx
<ASRComplete
  webSocket={webSocket}
  onResult={handleResult}
  buttonVariant="outline"
  buttonSize="lg"
  buttonClassName="bg-blue-500 hover:bg-blue-600"
  statusPosition="top"
  statusClassName="bg-white/90"
  showWave={true}
/>
```

## API 参考

### ASRComplete

完整的ASR组件，包含所有功能。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `webSocket` | `WebSocket` | - | WebSocket连接对象 |
| `onResult` | `(text: string) => void` | - | 识别结果回调 |
| `onError` | `(error: string) => void` | - | 错误回调 |
| `onNotification` | `(message: string, type: string) => void` | - | 通知回调 |
| `targetInputId` | `string` | `'messageInput'` | 目标输入框ID |
| `buttonVariant` | `string` | `'outline'` | 按钮样式变体 |
| `buttonSize` | `string` | `'default'` | 按钮大小 |
| `statusPosition` | `'top' \| 'bottom' \| 'center'` | `'center'` | 状态显示位置 |
| `showWave` | `boolean` | `true` | 是否显示音波动画 |
| `disabled` | `boolean` | `false` | 是否禁用 |

### ASRButton

语音识别按钮组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `webSocket` | `WebSocket` | - | WebSocket连接对象 |
| `onResult` | `(text: string) => void` | - | 识别结果回调 |
| `onError` | `(error: string) => void` | - | 错误回调 |
| `variant` | `string` | `'outline'` | 按钮样式变体 |
| `size` | `string` | `'default'` | 按钮大小 |
| `disabled` | `boolean` | `false` | 是否禁用 |

### ASRStatus

状态显示组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `position` | `'top' \| 'bottom' \| 'center'` | `'center'` | 显示位置 |
| `showWave` | `boolean` | `true` | 是否显示音波动画 |
| `className` | `string` | - | 额外CSS类名 |

### ASRProvider

键盘事件提供者组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `targetInputId` | `string` | `'messageInput'` | 目标输入框ID |
| `onResult` | `(text: string) => void` | - | 识别结果回调 |
| `onError` | `(error: string) => void` | - | 错误回调 |
| `onNotification` | `(message: string, type: string) => void` | - | 通知回调 |
| `children` | `ReactNode` | - | 子组件 |

## 状态管理

使用Zustand进行状态管理，可以直接访问store：

```jsx
import { useASRStore } from '@/components/ASR'

function CustomComponent() {
  const {
    recording,
    recognition,
    ui,
    startSpaceKeyASR,
    stopSpaceKeyASR,
    reset
  } = useASRStore()

  return (
    <div>
      <p>录音状态: {recording.isRecording ? '录音中' : '未录音'}</p>
      <p>识别文本: {recognition.currentText}</p>
      <p>最佳结果: {recognition.bestText}</p>
    </div>
  )
}
```

## WebSocket 消息格式

### 发送消息

```javascript
// 开始ASR
{
  type: 'start_asr'
}

// 音频数据块
{
  type: 'audio_chunk',
  audio_data: 'base64编码的PCM数据'
}

// 停止ASR
{
  type: 'stop_asr'
}
```

### 接收消息

```javascript
// ASR启动确认
{
  type: 'asr_started'
}

// 识别结果
{
  type: 'asr_result',
  text: '识别的文本',
  is_final: false,
  confidence: 0.95
}

// ASR停止确认
{
  type: 'asr_stopped'
}

// 错误消息
{
  type: 'asr_error',
  error: '错误描述'
}
```

## 事件系统

组件使用自定义事件进行通信：

```javascript
// 监听识别结果
window.addEventListener('asrResult', (event) => {
  console.log('最终结果:', event.detail.text)
})

// 监听实时结果
window.addEventListener('asrRealtimeResult', (event) => {
  console.log('实时结果:', event.detail.text)
})

// 监听错误
window.addEventListener('asrError', (event) => {
  console.error('ASR错误:', event.detail.error)
})

// 监听通知
window.addEventListener('asrNotification', (event) => {
  console.log('通知:', event.detail.message, event.detail.type)
})
```

## 键盘交互

- **长按空格键（>0.4秒）**: 开始语音识别
- **短按空格键（<0.4秒）**: 在输入框中插入空格
- **松开空格键**: 停止语音识别并发送结果

## 浏览器兼容性

- Chrome 66+
- Firefox 60+
- Safari 11.1+
- Edge 79+

需要支持：
- `navigator.mediaDevices.getUserMedia`
- `AudioContext`
- `WebSocket`

## 注意事项

1. **权限要求**: 需要用户授权麦克风权限
2. **HTTPS要求**: 在生产环境中需要HTTPS协议
3. **资源清理**: 组件会自动清理音频资源，避免内存泄漏
4. **错误处理**: 提供完整的错误处理和用户反馈
5. **性能优化**: 使用16kHz采样率和PCM格式优化传输

## 故障排除

### 常见问题

1. **麦克风权限被拒绝**
   - 检查浏览器权限设置
   - 确保使用HTTPS协议

2. **WebSocket连接失败**
   - 检查WebSocket服务器状态
   - 验证连接URL和协议

3. **识别结果不准确**
   - 检查网络连接质量
   - 确保环境噪音较小
   - 调整音量阈值设置

4. **键盘事件不响应**
   - 确保目标输入框ID正确
   - 检查是否有其他组件阻止事件传播
