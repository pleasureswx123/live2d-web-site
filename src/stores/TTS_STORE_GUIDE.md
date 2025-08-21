# TTS Store 使用指南

## 概述

TTS Store 是一个专门管理TTS（文本转语音）音频播放的状态管理store，采用Zustand实现。它将原本在WebSocketContext中的TTS功能抽取出来，实现了更好的关注点分离。

## 主要功能

### 1. 音频播放管理
- 基础音频播放：`playTTSAudio(audioBase64, format)`
- 流式音频播放：`playTTSAudioChunk(audioBase64, format)`
- 有序音频播放：`playTTSAudioChunkWithOrder(audioBase64, format, order)`
- 音频队列管理：自动处理音频片段的排队和播放

### 2. 表情同步
- 表情匹配：`matchExpression(text)` - 从文本中匹配对应的Live2D表情
- 表情播放：`playLive2DExpression(expressionName)` - 播放Live2D表情

### 3. 音频控制
- 停止所有音频：`stopAllAudio()`
- 清空音频队列：`clearAudioQueue()`
- 音频状态检查：`showAudioStatus()`

### 4. WebSocket集成
- 设置WebSocket引用：`setWebSocketRef(wsRef)`
- 音频播放完成通知：自动通知服务端音频播放完成

## 使用方法

### 基本使用

```javascript
import { useTTSStore } from '../stores/ttsStore'

function MyComponent() {
  const ttsStore = useTTSStore()
  
  // 播放音频
  const handlePlayAudio = (audioData) => {
    ttsStore.playTTSAudio(audioData, 'mp3')
  }
  
  // 停止所有音频
  const handleStopAudio = () => {
    ttsStore.stopAllAudio()
  }
  
  return (
    <div>
      <button onClick={handlePlayAudio}>播放音频</button>
      <button onClick={handleStopAudio}>停止音频</button>
    </div>
  )
}
```

### 表情同步

```javascript
import { useTTSStore } from '../stores/ttsStore'

function ChatComponent() {
  const ttsStore = useTTSStore()
  
  // 处理文本并同步表情
  const handleText = (text) => {
    const expression = ttsStore.matchExpression(text)
    if (expression) {
      ttsStore.playLive2DExpression(expression)
    }
  }
  
  return (
    <div>
      {/* 聊天界面 */}
    </div>
  )
}
```

### 流式音频播放

```javascript
import { useTTSStore } from '../stores/ttsStore'

function StreamingAudioComponent() {
  const ttsStore = useTTSStore()
  
  // 处理流式音频片段
  const handleAudioChunk = (audioData, order) => {
    if (order !== undefined) {
      // 有序播放
      ttsStore.playTTSAudioChunkWithOrder(audioData, 'mp3', order)
    } else {
      // 无序播放
      ttsStore.playTTSAudioChunk(audioData, 'mp3')
    }
  }
  
  // TTS完成处理
  const handleTTSComplete = () => {
    ttsStore.onTTSComplete()
  }
  
  return (
    <div>
      {/* 流式音频界面 */}
    </div>
  )
}
```

## 状态结构

```javascript
{
  // 音频播放状态
  audio: {
    isPlaying: false,           // 是否正在播放
    isTesting: false,           // 是否正在测试
    volume: 0.8,               // 音量
    playbackRate: 1.0,         // 播放速度
    currentAudio: null,        // 当前播放的音频元素
    audioElements: [],         // 所有音频元素列表
    audioQueue: [],            // 音频播放队列
    orderedAudioBuffer: Map,   // 有序音频缓冲区
    expectedOrder: 1,          // 期望的下一个顺序号
    isPlayingQueue: false,     // 是否正在播放队列
    isTTSGenerationComplete: false // TTS生成是否完成
  },
  
  // 表情同步状态
  expression: {
    lastExpressionTime: 0,     // 上次表情播放时间
    currentExpression: null,   // 当前表情
    EXPRESSION_DEBOUNCE_TIME: 1000 // 表情防抖时间
  },
  
  // 表情关键词映射表
  EXPRESSION_KEYWORDS: {
    'shengqi': ['生气', '愤怒', '讨厌'],
    'weiqu': ['委屈', '难过', '伤心'],
    // ... 更多表情映射
  }
}
```

## 与WebSocket的集成

TTS Store 与 WebSocketContext 紧密集成：

1. **WebSocket连接建立时**：自动设置WebSocket引用
2. **音频播放完成时**：自动通知服务端
3. **全局事件监听**：响应 `stopAllTTS` 和 `clearAudioQueue` 事件

## 注意事项

1. **音频权限**：首次播放可能需要用户交互来启用音频
2. **Live2D模型**：表情播放需要Live2D模型已加载
3. **WebSocket连接**：音频播放完成通知需要WebSocket连接正常
4. **内存管理**：音频元素会自动清理，避免内存泄漏

## 迁移指南

从WebSocketContext迁移到TTS Store：

### 之前（在WebSocketContext中）
```javascript
// 直接调用函数
playTTSAudio(audioData, 'mp3')
playLive2DExpression('happy')
```

### 现在（使用TTS Store）
```javascript
import { useTTSStore } from '../stores/ttsStore'

const ttsStore = useTTSStore()
ttsStore.playTTSAudio(audioData, 'mp3')
ttsStore.playLive2DExpression('happy')
```

## 优势

1. **关注点分离**：TTS功能独立管理，不影响WebSocket连接逻辑
2. **可复用性**：TTS Store可以在任何组件中使用
3. **状态管理**：使用Zustand提供响应式状态管理
4. **类型安全**：可以轻松添加TypeScript支持
5. **测试友好**：独立的store更容易进行单元测试
