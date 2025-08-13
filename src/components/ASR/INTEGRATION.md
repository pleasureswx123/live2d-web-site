# ASR组件集成指南

本指南说明如何将ASR语音识别组件集成到现有的Live2D项目中。

## 快速集成

### 1. 在聊天界面中使用

如果你的项目中有聊天输入框，可以这样集成：

```jsx
// 在你的聊天组件中
import { ASRComplete } from '@/components/ASR'

function ChatInterface() {
  const [message, setMessage] = useState('')
  const [webSocket, setWebSocket] = useState(null)

  // 处理ASR识别结果
  const handleASRResult = (text) => {
    setMessage(text)
    // 可以选择自动发送消息
    sendMessage(text)
  }

  const handleASRError = (error) => {
    // 显示错误提示
    showNotification(`语音识别错误: ${error}`, 'error')
  }

  return (
    <div className="chat-interface">
      <div className="input-area flex items-center space-x-2">
        <input
          id="messageInput"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入消息或长按空格键语音输入..."
          className="flex-1 px-3 py-2 border rounded"
        />
        
        <ASRComplete
          webSocket={webSocket}
          onResult={handleASRResult}
          onError={handleASRError}
          targetInputId="messageInput"
          buttonSize="sm"
        />
        
        <button onClick={() => sendMessage(message)}>
          发送
        </button>
      </div>
    </div>
  )
}
```

### 2. 在App.jsx中全局集成

```jsx
// 在App.jsx中添加ASR支持
import { ASRProvider } from '@/components/ASR'

function App() {
  const [webSocket, setWebSocket] = useState(null)

  // 初始化WebSocket连接
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws')
    setWebSocket(ws)
    return () => ws.close()
  }, [])

  const handleGlobalASRResult = (text) => {
    // 全局处理ASR结果
    console.log('全局ASR结果:', text)
    
    // 可以触发全局事件或更新全局状态
    // 例如：更新当前活动输入框的值
  }

  return (
    <ASRProvider
      targetInputId="messageInput"
      onResult={handleGlobalASRResult}
      onError={(error) => console.error('ASR错误:', error)}
      onNotification={(msg, type) => showNotification(msg, type)}
    >
      <div className="app">
        {/* 你的现有组件 */}
        <Live2DViewer />
        <ConversationStage />
        {/* 其他组件... */}
      </div>
    </ASRProvider>
  )
}
```

### 3. 与现有状态管理集成

如果你使用Zustand或其他状态管理，可以这样集成：

```jsx
// 在你的聊天store中
import { useASRStore } from '@/components/ASR'

export const useChatStore = create((set, get) => ({
  messages: [],
  currentInput: '',
  
  // 设置输入文本（可以来自ASR）
  setCurrentInput: (text) => {
    set({ currentInput: text })
  },
  
  // 发送消息
  sendMessage: (text) => {
    const message = {
      id: Date.now(),
      text: text || get().currentInput,
      sender: 'user',
      timestamp: new Date()
    }
    
    set((state) => ({
      messages: [...state.messages, message],
      currentInput: ''
    }))
  }
}))

// 在组件中使用
function ChatComponent() {
  const { currentInput, setCurrentInput, sendMessage } = useChatStore()
  const { webSocket } = useSystemStore() // 假设你有系统store

  return (
    <div>
      <input
        id="messageInput"
        value={currentInput}
        onChange={(e) => setCurrentInput(e.target.value)}
      />
      
      <ASRComplete
        webSocket={webSocket}
        onResult={(text) => {
          setCurrentInput(text)
          sendMessage(text) // 自动发送
        }}
        targetInputId="messageInput"
      />
    </div>
  )
}
```

## WebSocket服务器配置

ASR组件需要WebSocket服务器支持以下消息格式：

### 后端示例（Python FastAPI）

```python
from fastapi import FastAPI, WebSocket
import json
import base64

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "start_asr":
                # 启动ASR服务
                await websocket.send_text(json.dumps({
                    "type": "asr_started"
                }))
                
            elif message["type"] == "audio_chunk":
                # 处理音频数据
                audio_data = base64.b64decode(message["audio_data"])
                
                # 调用ASR服务（如科大讯飞、百度等）
                result = await process_audio_chunk(audio_data)
                
                if result:
                    await websocket.send_text(json.dumps({
                        "type": "asr_result",
                        "text": result["text"],
                        "is_final": result["is_final"],
                        "confidence": result.get("confidence", 0)
                    }))
                    
            elif message["type"] == "stop_asr":
                # 停止ASR服务
                await websocket.send_text(json.dumps({
                    "type": "asr_stopped"
                }))
                
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "asr_error",
            "error": str(e)
        }))
```

### 后端示例（Node.js）

```javascript
const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8000 })

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data)
      
      switch (message.type) {
        case 'start_asr':
          ws.send(JSON.stringify({ type: 'asr_started' }))
          break
          
        case 'audio_chunk':
          const audioBuffer = Buffer.from(message.audio_data, 'base64')
          
          // 调用ASR服务
          const result = await processAudioChunk(audioBuffer)
          
          if (result) {
            ws.send(JSON.stringify({
              type: 'asr_result',
              text: result.text,
              is_final: result.is_final,
              confidence: result.confidence || 0
            }))
          }
          break
          
        case 'stop_asr':
          ws.send(JSON.stringify({ type: 'asr_stopped' }))
          break
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'asr_error',
        error: error.message
      }))
    }
  })
})
```

## 样式自定义

### 自定义按钮样式

```jsx
<ASRComplete
  buttonClassName="bg-blue-500 hover:bg-blue-600 text-white"
  buttonVariant="default"
  buttonSize="lg"
/>
```

### 自定义状态显示

```jsx
<ASRComplete
  statusClassName="bg-white/95 border-blue-200"
  statusPosition="bottom"
  showWave={false}
/>
```

### 使用CSS变量

```css
/* 在你的CSS文件中 */
.asr-button {
  --asr-primary-color: #3b82f6;
  --asr-recording-color: #ef4444;
  --asr-background: rgba(255, 255, 255, 0.95);
}
```

## 错误处理

### 权限错误处理

```jsx
const handleASRError = (error) => {
  if (error.includes('Permission denied')) {
    showNotification('请允许麦克风权限以使用语音输入', 'warning')
  } else if (error.includes('NotFoundError')) {
    showNotification('未找到麦克风设备', 'error')
  } else {
    showNotification(`语音识别错误: ${error}`, 'error')
  }
}
```

### 网络错误处理

```jsx
const [retryCount, setRetryCount] = useState(0)

const handleWebSocketError = () => {
  if (retryCount < 3) {
    setTimeout(() => {
      setRetryCount(prev => prev + 1)
      reconnectWebSocket()
    }, 1000 * Math.pow(2, retryCount)) // 指数退避
  } else {
    showNotification('语音服务连接失败，请刷新页面重试', 'error')
  }
}
```

## 性能优化

### 音频数据压缩

```jsx
// 在ASR store中可以添加音频压缩逻辑
const compressAudioData = (pcmData) => {
  // 降采样或压缩音频数据
  const compressed = downsample(pcmData, 16000, 8000)
  return compressed
}
```

### 防抖处理

```jsx
import { debounce } from 'lodash'

const debouncedASRResult = debounce((text) => {
  // 处理ASR结果
  handleASRResult(text)
}, 300)
```

## 测试

### 单元测试示例

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ASRButton } from '@/components/ASR'

test('ASR按钮点击显示提示', () => {
  render(<ASRButton />)
  
  const button = screen.getByRole('button')
  fireEvent.click(button)
  
  // 验证提示信息
  expect(screen.getByText(/请使用长按空格键/)).toBeInTheDocument()
})
```

### 集成测试

```jsx
test('长按空格键触发ASR', async () => {
  render(<ASRComplete targetInputId="test-input" />)
  
  const input = screen.getByRole('textbox')
  input.focus()
  
  // 模拟长按空格键
  fireEvent.keyDown(input, { code: 'Space' })
  
  await waitFor(() => {
    expect(screen.getByText(/识别中/)).toBeInTheDocument()
  })
  
  fireEvent.keyUp(input, { code: 'Space' })
})
```

## 常见问题

### Q: 为什么空格键不响应？
A: 检查目标输入框ID是否正确，确保输入框获得了焦点。

### Q: 为什么没有声音输入？
A: 检查麦克风权限，确保浏览器允许访问麦克风。

### Q: WebSocket连接失败怎么办？
A: 检查服务器地址和端口，确保WebSocket服务正常运行。

### Q: 识别结果不准确？
A: 检查网络连接，确保环境安静，可以调整音量阈值。

## 下一步

1. 根据你的具体需求调整组件配置
2. 集成到现有的聊天或输入系统中
3. 配置WebSocket服务器支持ASR
4. 测试各种场景和错误情况
5. 根据用户反馈优化体验
