# ASR Store 与 WebSocket Context 集成说明

## 概述

本文档说明了如何将 `asrStore.js` 与 `WebSocketContext.jsx` 进行集成，实现语音识别功能与WebSocket通信的无缝连接。

## 集成内容

### 1. 导入关系

在 `asrStore.js` 中添加了对 `WebSocketContext` 的引用：

```javascript
import { useWebSocket } from '../contexts/WebSocketContext'
```

### 2. 新增方法

#### asrStore.js 中新增的方法：

- `initializeWebSocketConnection()`: 初始化WebSocket连接
- `updateConnectionFromContext(wsRef, connectionStatus)`: 从WebSocketContext更新连接状态
- `useASRWithWebSocket()`: 导出的Hook，用于在组件中连接ASR Store和WebSocket Context

#### WebSocketContext.jsx 中的修改：

- 在WebSocket连接建立时自动设置ASR Store的WebSocket实例
- 在WebSocket断开时清除ASR Store的WebSocket连接
- 添加了useEffect监听连接状态变化并同步到ASR Store

## 使用方法

### 1. 基本使用

在需要使用ASR功能的组件中：

```jsx
import React, { useEffect } from 'react'
import { useASRStore } from '../stores/asrStore'
import { useWebSocket } from '../contexts/WebSocketContext'

const MyComponent = () => {
  const asrStore = useASRStore()
  const { wsRef, connectionStatus } = useWebSocket()

  // 监听WebSocket连接状态变化
  useEffect(() => {
    if (asrStore.updateConnectionFromContext) {
      asrStore.updateConnectionFromContext(wsRef, connectionStatus)
    }
  }, [connectionStatus, wsRef, asrStore])

  // 使用ASR功能
  const handleStartASR = () => {
    if (asrStore.connection.isConnected) {
      asrStore.startSpaceKeyASR()
    }
  }

  return (
    <div>
      <button onClick={handleStartASR}>开始语音识别</button>
    </div>
  )
}
```

### 2. 使用便捷Hook

```jsx
import { useASRWithWebSocket } from '../stores/asrStore'

const MyComponent = () => {
  const asrStore = useASRWithWebSocket()
  
  // 直接使用ASR功能，WebSocket连接已自动处理
  const handleStartASR = () => {
    asrStore.startSpaceKeyASR()
  }

  return (
    <div>
      <button onClick={handleStartASR}>开始语音识别</button>
    </div>
  )
}
```

### 3. 监听ASR事件

ASR Store会触发以下自定义事件：

```jsx
useEffect(() => {
  const handleASRResult = (event) => {
    console.log('ASR识别结果:', event.detail.text)
  }

  const handleASRError = (event) => {
    console.log('ASR错误:', event.detail.error)
  }

  const handleASRInputUpdate = (event) => {
    console.log('输入更新:', event.detail.text)
  }

  window.addEventListener('asrResult', handleASRResult)
  window.addEventListener('asrError', handleASRError)
  window.addEventListener('asrInputUpdate', handleASRInputUpdate)

  return () => {
    window.removeEventListener('asrResult', handleASRResult)
    window.removeEventListener('asrError', handleASRError)
    window.removeEventListener('asrInputUpdate', handleASRInputUpdate)
  }
}, [])
```

## 主要功能

### 1. 长按空格键ASR模式

```javascript
// 开始长按空格键ASR
asrStore.startSpaceKeyASR()

// 停止长按空格键ASR
asrStore.stopSpaceKeyASR()
```

### 2. 持续模式ASR

```javascript
// 开始持续模式ASR
asrStore.startContinuousASR()

// 停止持续模式ASR
asrStore.stopContinuousASR()
```

### 3. 状态监控

```javascript
// 检查连接状态
const isConnected = asrStore.connection.isConnected

// 检查录音状态
const isRecording = asrStore.recording.isRecording

// 获取识别结果
const currentText = asrStore.recognition.currentText
const bestText = asrStore.recognition.bestText
```

## 自动化集成

WebSocketContext会自动处理以下集成：

1. **连接建立时**: 自动设置ASR Store的WebSocket实例
2. **连接断开时**: 自动清除ASR Store的WebSocket连接
3. **状态同步**: 自动同步WebSocket连接状态到ASR Store
4. **消息处理**: 自动处理来自服务器的ASR相关消息

## 示例组件

参考 `src/components/ASRIntegrationExample.jsx` 获取完整的使用示例。

## 注意事项

1. 确保在使用ASR功能前WebSocket已连接
2. ASR Store会自动处理WebSocket消息，无需手动处理
3. 所有ASR事件都通过自定义DOM事件触发，便于组件间通信
4. 连接状态会自动同步，无需手动管理

## 错误处理

ASR Store包含完整的错误处理机制：

- 自动重试机制
- 降级模式支持
- 详细的错误日志
- 用户友好的错误提示

通过这种集成方式，ASR功能与WebSocket通信实现了完全的解耦和自动化管理。
