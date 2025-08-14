# ASR持续模式内容采集修复

## 问题分析

从 `startContinuousASR` 到 `stopContinuousASR` 过程中内容采集存在以下问题：

1. **内容丢失**: 持续模式下多个语音片段没有正确累积
2. **覆盖问题**: 新的识别结果会覆盖之前的内容
3. **时序问题**: 停止时可能丢失最后的识别片段
4. **片段分割**: 无法正确识别和处理连续的语音片段

## 解决方案

### 1. 新增数据结构

在 `recognition` 状态中添加持续模式专用字段：

```javascript
recognition: {
  currentText: '',           // 当前识别文本
  bestText: '',             // 最佳识别文本
  lastResultTime: null,     // 最后结果时间
  confidence: 0,            // 置信度
  // 持续模式专用字段
  continuousText: '',       // 持续模式累积的完整文本
  lastContinuousSegment: '', // 最后一个连续片段
  continuousSegments: []    // 所有连续片段的数组
}
```

### 2. 智能片段识别

基于时间间隔和内容变化来识别语音片段：

```javascript
// 检查是否是新的语音片段
const timeSinceLastResult = currentState.recognition.lastResultTime ? 
  now - currentState.recognition.lastResultTime : 0

// 如果是最终结果或者时间间隔较长，认为是一个完整的片段
if (isFinal || timeSinceLastResult > 2000) {
  // 处理为新片段
  const newSegments = [...currentState.recognition.continuousSegments]
  if (trimmedText !== currentState.recognition.lastContinuousSegment) {
    newSegments.push(trimmedText)
  }
  const fullContinuousText = newSegments.join(' ')
} else {
  // 处理为中间结果
  const tempDisplayText = currentState.recognition.continuousText ? 
    `${currentState.recognition.continuousText} ${trimmedText}` : trimmedText
}
```

### 3. 内容累积策略

#### 片段累积
- 每个完整的语音片段添加到 `continuousSegments` 数组
- 使用空格连接所有片段形成完整文本
- 避免重复添加相同的片段

#### 实时显示
- 中间结果：显示已确认片段 + 当前识别内容
- 最终结果：显示完整的累积文本

### 4. 停止时的完整性保证

```javascript
// 优先使用持续模式累积的完整文本
let finalText = ''
if (continuousText && continuousText.trim()) {
  finalText = continuousText.trim()
  console.log('🎤 使用持续模式累积文本:', finalText)
} else if (currentText && currentText.trim()) {
  finalText = currentText.trim()
  console.log('🎤 使用当前识别文本:', finalText)
} else if (bestText && bestText.trim()) {
  finalText = bestText.trim()
  console.log('🎤 使用最佳识别文本:', finalText)
}
```

## 工作流程

### 开始持续模式
1. 重置所有持续模式相关字段
2. 清空片段数组和累积文本
3. 开始语音识别

### 识别过程中
1. **新片段检测**:
   - 基于时间间隔（>2秒）或最终结果标志
   - 避免重复片段

2. **内容累积**:
   - 新片段添加到数组
   - 重新构建完整文本
   - 更新最佳结果

3. **实时显示**:
   - 中间结果：临时显示
   - 确认片段：更新输入框

### 停止持续模式
1. 获取累积的完整文本
2. 等待最后的识别结果
3. 选择最完整的文本
4. 触发最终结果事件

## 调试信息

增强的日志输出帮助调试：

```javascript
console.log('🎤 持续模式新片段:', trimmedText, '(final:', isFinal, ')')
console.log('🎤 持续模式中间结果:', trimmedText)
console.log('🎤 使用持续模式累积文本:', finalText)
console.log('🎤 累积片段:', latestState.recognition.continuousSegments)
```

## 事件类型

### asrInputUpdate
- `mode: 'continuous'`: 确认的片段更新
- `mode: 'continuous_temp'`: 临时中间结果

### asrResult
- `mode: 'continuous_final'`: 持续模式最终结果

## 用户体验改进

1. **完整内容**: 确保所有语音片段都被正确采集
2. **实时反馈**: 用户可以看到识别过程
3. **智能分割**: 自动识别语音片段边界
4. **容错处理**: 多种备选方案确保内容不丢失

## 测试场景

1. **连续说话**: "今天天气很好，我想出去走走，顺便买点东西"
2. **间断说话**: "今天天气很好" [停顿2秒] "我想出去走走" [停顿2秒] "顺便买点东西"
3. **长时间说话**: 持续说话超过30秒
4. **快速停止**: 说话过程中立即停止

## 预期效果

- 所有语音片段都被正确采集和累积
- 停止时获得完整的识别内容
- 实时显示让用户了解识别进度
- 智能分割提高识别准确性

这些改进确保了从开始到停止持续语音识别的整个过程中，所有内容都能被正确采集和保存。
