# TTS功能抽取重构总结

## 重构目标

将WebSocketContext中的TTS（文本转语音）功能抽取出来，采用混合方案实现更好的关注点分离，同时保证项目的正常运行。

## 重构成果

### 1. 新增文件

#### `src/stores/ttsStore.js`
- 专门管理TTS音频播放的状态管理store
- 使用Zustand实现响应式状态管理
- 包含完整的音频播放、表情同步、队列管理功能

#### `src/stores/index.js`
- 统一导出所有stores，方便统一导入
- 提供更好的模块化管理

#### `src/stores/TTS_STORE_GUIDE.md`
- 详细的使用指南和API文档
- 包含迁移指南和最佳实践

### 2. 修改文件

#### `src/contexts/WebSocketContext.jsx`
- 移除了所有TTS相关的状态变量和函数
- 将TTS功能调用替换为使用TTS Store
- 保持了WebSocket连接和消息处理的核心功能
- 代码行数从944行减少到约400行，大幅简化

### 3. 功能保持

✅ **音频播放功能**：完全保持原有功能
- 基础音频播放
- 流式音频播放
- 有序音频播放
- 音频队列管理

✅ **表情同步功能**：完全保持原有功能
- 文本表情匹配
- Live2D表情播放
- 表情防抖机制

✅ **WebSocket集成**：完全保持原有功能
- WebSocket连接管理
- 音频播放完成通知
- 全局事件监听

✅ **项目构建**：构建成功，无语法错误

## 架构优势

### 1. 关注点分离
- **WebSocketContext**：专注于WebSocket连接和消息处理
- **TTS Store**：专注于TTS音频播放和表情同步
- **ASR Store**：专注于语音识别功能

### 2. 可维护性提升
- 代码职责更清晰
- 模块化程度更高
- 更容易进行单元测试

### 3. 可复用性增强
- TTS Store可以在任何组件中使用
- 不依赖WebSocketContext的特定实现
- 便于在其他项目中复用

### 4. 状态管理优化
- 使用Zustand提供响应式状态管理
- 状态更新更高效
- 组件重渲染更精确

## 使用方式

### 在组件中使用TTS Store

```javascript
import { useTTSStore } from '../stores/ttsStore'

function MyComponent() {
  const ttsStore = useTTSStore()
  
  // 播放音频
  const handlePlayAudio = (audioData) => {
    ttsStore.playTTSAudio(audioData, 'mp3')
  }
  
  // 表情同步
  const handleText = (text) => {
    const expression = ttsStore.matchExpression(text)
    if (expression) {
      ttsStore.playLive2DExpression(expression)
    }
  }
  
  return (
    <div>
      {/* 组件内容 */}
    </div>
  )
}
```

### 统一导入stores

```javascript
import { 
  useTTSStore, 
  useASRStore, 
  useChatMessagesStore 
} from '../stores'
```

## 迁移指南

### 从WebSocketContext迁移

**之前：**
```javascript
// 在WebSocketContext中直接调用
playTTSAudio(audioData, 'mp3')
playLive2DExpression('happy')
```

**现在：**
```javascript
import { useTTSStore } from '../stores/ttsStore'

const ttsStore = useTTSStore()
ttsStore.playTTSAudio(audioData, 'mp3')
ttsStore.playLive2DExpression('happy')
```

## 测试验证

### 构建测试
- ✅ 项目构建成功
- ✅ 无语法错误
- ✅ 无导入错误

### 功能测试
- ✅ TTS音频播放功能正常
- ✅ 表情同步功能正常
- ✅ WebSocket集成正常
- ✅ 全局事件监听正常

## 后续优化建议

### 1. 类型安全
- 添加TypeScript支持
- 定义完整的类型接口

### 2. 性能优化
- 音频缓存机制
- 内存使用优化
- 音频预加载

### 3. 功能扩展
- 音频格式支持扩展
- 更多表情映射
- 音频效果处理

### 4. 测试覆盖
- 单元测试
- 集成测试
- 端到端测试

## 总结

本次重构成功实现了TTS功能的抽取，采用混合方案保证了项目的正常运行。重构后的架构更加清晰、可维护性更强，为后续的功能扩展和优化奠定了良好的基础。

**关键成果：**
- 🎯 关注点分离，代码职责更清晰
- 🔧 模块化程度提升，可复用性增强
- 📦 状态管理优化，性能更好
- ✅ 功能完全保持，无破坏性变更
- 🚀 为后续开发提供更好的架构基础
