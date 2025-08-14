# ASR完整结果获取修复

## 问题描述

当停止持续语音识别时，消息输入框中的内容不完整。这是因为在停止ASR时没有正确获取最新的识别结果。

## 问题原因

1. **时序问题**: 停止ASR时，最新的识别结果可能还没有完全处理完成
2. **结果选择**: 只使用 `bestText` 而忽略了可能更新的 `currentText`
3. **事件处理**: 缺少ASR停止时的专门事件处理

## 解决方案

### 1. 改进停止逻辑

#### `stopContinuousASR` 方法改进：

```javascript
// 停止ASR前先获取当前最新的识别结果
const currentState = get()
const currentText = currentState.recognition.currentText
const bestText = currentState.recognition.bestText

// 选择最长或最新的文本作为最终结果
let finalText = ''
if (currentText && currentText.trim()) {
  finalText = currentText.trim()
} else if (bestText && bestText.trim()) {
  finalText = bestText.trim()
}

// 停止ASR
await stopASR()

// 等待一小段时间确保最后的识别结果被处理
setTimeout(() => {
  const latestState = get()
  const latestCurrentText = latestState.recognition.currentText
  const latestBestText = latestState.recognition.bestText
  
  // 再次选择最完整的文本
  let completeFinalText = finalText
  if (latestCurrentText && latestCurrentText.trim() && latestCurrentText.length > completeFinalText.length) {
    completeFinalText = latestCurrentText.trim()
  } else if (latestBestText && latestBestText.trim() && latestBestText.length > completeFinalText.length) {
    completeFinalText = latestBestText.trim()
  }

  if (completeFinalText) {
    const event = new CustomEvent('asrResult', {
      detail: { text: completeFinalText, mode: 'continuous_final' }
    })
    window.dispatchEvent(event)
  }
}, 300) // 等待300ms确保获取最后的识别结果
```

### 2. 新增事件类型

#### ASR停止事件：
```javascript
const stopEvent = new CustomEvent('asrStopped', {
  detail: { mode: 'continuous' }
})
window.dispatchEvent(stopEvent)
```

#### 带模式标识的结果事件：
```javascript
const event = new CustomEvent('asrResult', {
  detail: { text: finalText, mode: 'continuous_final' }
})
```

### 3. 改进事件处理

#### WorkingChatInterface.jsx 中的处理：

```javascript
const handleASRResult = (event) => {
  const { text, mode } = event.detail
  
  if (text && text.trim()) {
    setMessage(text.trim())
    setTimeout(autoResizeTextarea, 0)

    // 如果是持续模式的最终结果，不自动发送，让用户确认
    if (mode === 'continuous_final') {
      console.log('🎤 持续模式最终结果，等待用户确认发送')
      if (onNotification) {
        onNotification('语音识别完成，请确认后发送', 'info')
      }
    } else if (recording.isContinuousMode) {
      // 持续模式中的中间结果，自动发送
      setTimeout(() => {
        handleSendMessage()
      }, 500)
    }
  }
}

const handleASRStopped = (event) => {
  console.log('🎤 ASR已停止')
  // 当ASR停止时，确保获取最新的识别结果
  if (recognition.currentText && recognition.currentText.trim()) {
    const finalText = recognition.currentText.trim()
    setMessage(finalText)
    setTimeout(autoResizeTextarea, 0)
    
    if (onNotification) {
      onNotification('语音识别已停止，请确认内容后发送', 'info')
    }
  }
}
```

## 修改的文件

### 1. `src/stores/asrStore.js`
- 改进 `stopContinuousASR` 方法
- 改进 `stopSpaceKeyASR` 方法
- 添加ASR停止事件触发
- 增强结果选择逻辑

### 2. `src/components/WorkingChatInterface.jsx`
- 改进ASR结果事件处理
- 添加ASR停止事件监听
- 区分不同模式的处理方式
- 改进用户通知

### 3. `src/components/ASRTestComponent.jsx`
- 添加ASR停止事件监听
- 改进测试结果显示
- 增加模式信息显示

## 关键改进点

### 1. 双重结果获取
- 停止前获取当前结果
- 停止后再次获取最新结果
- 选择最完整的文本

### 2. 延迟处理
- 等待300ms确保最后的识别结果被处理
- 给ASR服务足够时间完成最后的处理

### 3. 模式区分
- `continuous_final`: 持续模式的最终结果
- `spacekey_final`: 长按空格键的最终结果
- 普通模式: 中间结果

### 4. 用户体验改进
- 持续模式最终结果不自动发送，让用户确认
- 提供明确的状态通知
- 确保输入框内容完整

## 使用效果

### 停止持续ASR时：
1. 系统会获取最完整的识别结果
2. 结果显示在输入框中
3. 用户可以确认后手动发送
4. 提供状态通知

### 停止长按空格键ASR时：
1. 同样获取最完整的结果
2. 结果显示在输入框中
3. 用户手动发送消息

### 调试信息：
- 详细的控制台日志
- 清晰的事件流程
- 便于问题排查

这些改进确保了在任何情况下停止ASR时都能获取到完整的识别结果，解决了内容不完整的问题。
