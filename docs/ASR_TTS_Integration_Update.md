# ASR与TTS音频集成更新

## 更新概述

为了提供更好的用户体验，在启动任何ASR（语音识别）功能时，现在会自动停止所有正在播放的TTS（文本转语音）音频。这样可以避免TTS音频干扰语音识别，提供更清晰的音频环境。

## 修改的文件

### 1. `src/components/WorkingChatInterface.jsx`

在 `handleASRToggle` 函数中添加了TTS停止逻辑：

```javascript
const handleASRToggle = () => {
  if (recording.isContinuousMode) {
    stopContinuousASR()
    if (onNotification) {
      onNotification('已停止持续语音识别', 'info')
    }
  } else {
    // 开始持续ASR前先停止所有TTS音频
    stopAllTTSAudio()
    startContinuousASR()
    if (onNotification) {
      onNotification('已开始持续语音识别', 'info')
    }
  }
}
```

### 2. `src/stores/asrStore.js`

在两个关键方法中添加了TTS停止逻辑：

#### `startContinuousASR` 方法：
```javascript
try {
  // 开始持续ASR前先停止所有TTS音频
  console.log('🛑 停止所有TTS音频以开始持续ASR')
  window.dispatchEvent(new CustomEvent('stopAllTTS'))
  window.dispatchEvent(new CustomEvent('clearAudioQueue'))

  updateRecordingState({ isContinuousMode: true })
  console.log('🎤 开始持续模式ASR')
  // ... 其余代码
}
```

#### `startSpaceKeyASR` 方法：
```javascript
try {
  // 开始长按空格键ASR前先停止所有TTS音频
  console.log('🛑 停止所有TTS音频以开始长按空格键ASR')
  window.dispatchEvent(new CustomEvent('stopAllTTS'))
  window.dispatchEvent(new CustomEvent('clearAudioQueue'))

  updateRecordingState({ isSpaceKeyASRActive: true })
  console.log('🎤 开始长按空格键ASR模式')
  // ... 其余代码
}
```

### 3. `src/components/ASRTestComponent.jsx`

在测试组件中也添加了相同的逻辑：

```javascript
const handleToggleASR = () => {
  if (recording.isContinuousMode) {
    stopContinuousASR()
    addTestResult('停止持续ASR', 'info')
  } else {
    // 开始持续ASR前先停止所有TTS音频
    console.log('🛑 停止所有TTS音频以开始持续ASR')
    window.dispatchEvent(new CustomEvent('stopAllTTS'))
    window.dispatchEvent(new CustomEvent('clearAudioQueue'))
    addTestResult('停止所有TTS音频', 'info')
    
    startContinuousASR()
    addTestResult('开始持续ASR', 'info')
  }
}
```

### 4. 文档更新

更新了 `docs/ASR_Chat_Integration_Simplified.md`，添加了TTS音频自动停止功能的说明。

## 功能特点

### 自动TTS停止时机

1. **持续语音识别模式启动时**
   - 用户点击麦克风按钮开始持续识别
   - 自动停止所有正在播放的TTS音频

2. **长按空格键ASR启动时**
   - 用户按住空格键开始录音
   - 自动停止所有正在播放的TTS音频

3. **任何ASR模式启动前**
   - 确保音频环境清晰
   - 避免TTS音频干扰语音识别

### 实现机制

使用自定义DOM事件来停止TTS音频：

```javascript
// 停止所有TTS播放
window.dispatchEvent(new CustomEvent('stopAllTTS'))
// 清空音频队列
window.dispatchEvent(new CustomEvent('clearAudioQueue'))
```

这些事件会被 `WebSocketContext.jsx` 中的事件监听器捕获并处理。

## 用户体验改进

### 1. 避免音频冲突
- TTS音频不会干扰语音识别
- 提供更清晰的录音环境
- 减少识别错误

### 2. 自动化处理
- 用户无需手动停止TTS
- 系统自动处理音频切换
- 流畅的交互体验

### 3. 一致性保证
- 所有ASR启动方式都包含此功能
- 统一的行为模式
- 可预期的用户体验

## 技术优势

### 1. 解耦设计
- 使用事件系统进行通信
- ASR Store不直接依赖TTS组件
- 松耦合的架构设计

### 2. 全面覆盖
- 覆盖所有ASR启动场景
- 包括UI按钮和程序调用
- 确保功能的完整性

### 3. 调试友好
- 详细的控制台日志
- 清晰的执行流程
- 便于问题排查

## 注意事项

1. **事件依赖**: 依赖 `WebSocketContext.jsx` 中的事件监听器
2. **时序控制**: TTS停止在ASR启动之前执行
3. **错误处理**: 即使TTS停止失败，ASR仍会正常启动
4. **性能影响**: 事件触发的性能开销很小

## 测试建议

1. 测试持续语音识别模式的TTS停止功能
2. 测试长按空格键ASR的TTS停止功能
3. 验证TTS音频确实被停止
4. 确认ASR功能正常工作
5. 检查控制台日志输出

这次更新显著改善了ASR和TTS功能的协同工作，提供了更好的用户体验。
