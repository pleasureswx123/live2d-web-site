# 🎭🎬 表情和动作功能使用指南

## 📚 目录

- [功能概述](#功能概述)
- [快速开始](#快速开始)
- [在项目中使用](#在项目中使用)
- [API 参考](#api-参考)
- [测试和调试](#测试和调试)
- [最佳实践](#最佳实践)

---

## 🎯 功能概述

本项目已经集成了完整的 Live2D 表情和动作系统，支持：

- **智能匹配**：根据文本内容自动匹配最合适的表情和动作
- **冲突处理**：自动检测和处理表情与动作之间的冲突
- **口型同步**：智能管理表情与口型同步的兼容性
- **优先级控制**：支持表情优先或动作优先的播放策略

### 🎭 表情系统

支持 22 种表情，按优先级分类：

- **强烈情感**（6种）：生气、委屈、眼泪、大笑、惊讶、惊喜
- **中等情感**（7种）：害羞、脸红、傲娇、思考、眯眯眼、鬼脸、落泪
- **动作相关**（3种）：抱胸、叉腰、键盘手抬起
- **电脑相关**（2种）：电脑、电脑发光
- **温和表情**（2种）：中性、温柔的笑

### 🎬 动作系统

支持 8 种动作：

- **基础动作**：待机、睡觉
- **互动动作**：点头、挥手、摇头、摸头

---

## 🚀 快速开始

### 1. 启动项目

```bash
pnpm dev
```

### 2. 访问测试页面

在浏览器中打开项目，点击导航栏中的 **"🎭🎬 表情动作测试"** 按钮。

### 3. 测试功能

在测试页面中：
- 输入包含情感词汇的文本（如"我好生气啊！"）
- 点击"匹配测试"查看匹配结果
- 点击"播放测试"观看 Live2D 模型的表情和动作

---

## 💻 在项目中使用

### 基础使用

```javascript
import { useTTSStore } from '../stores/ttsStore'

const ttsStore = useTTSStore()

// 匹配表情和动作
const result = ttsStore.matchExpressionAndMotion('我好生气啊！')
// 返回: { expression: 'shengqi', motion: null, hasMatch: true }

// 播放表情和动作组合
await ttsStore.playExpressionAndMotion(
  result.expression, 
  result.motion, 
  { prioritizeExpression: true }
)
```

### 在 WebSocket 消息处理中使用

```javascript
// 在 WebSocketContext.jsx 中已经集成
const handleMessage = async (data) => {
  if (data.type === 'generation_chunk' && data.content) {
    // 自动匹配表情和动作
    const matchResult = ttsStore.matchExpressionAndMotion(data.content)
    if (matchResult.hasMatch) {
      await ttsStore.playExpressionAndMotion(
        matchResult.expression, 
        matchResult.motion, 
        { prioritizeExpression: true }
      )
    }
  }
}
```

### 自定义关键词映射

```javascript
// 在 ttsStore.js 中扩展关键词
EXPRESSION_KEYWORDS: {
  'shengqi': ['生气', '愤怒', '讨厌', '烦死了', '气死了', '可恶', '混蛋', '气死我了', '太生气了'],
  // 添加更多关键词...
}
```

---

## 📖 API 参考

### TTSStore 方法

#### `matchExpression(text)`
匹配文本中的表情关键词。

**参数：**
- `text` (string): 要匹配的文本

**返回：**
- `string | null`: 匹配到的表情名称，如果没有匹配则返回 null

**示例：**
```javascript
const expression = ttsStore.matchExpression('我好生气啊！')
// 返回: 'shengqi'
```

#### `matchMotion(text)`
匹配文本中的动作关键词。

**参数：**
- `text` (string): 要匹配的文本

**返回：**
- `string | null`: 匹配到的动作名称，如果没有匹配则返回 null

**示例：**
```javascript
const motion = ttsStore.matchMotion('再见，拜拜！')
// 返回: 'huishou'
```

#### `matchExpressionAndMotion(text)`
同时匹配文本中的表情和动作。

**参数：**
- `text` (string): 要匹配的文本

**返回：**
- `object`: 包含 expression、motion 和 hasMatch 的对象

**示例：**
```javascript
const result = ttsStore.matchExpressionAndMotion('我生气了，再见！')
// 返回: { expression: 'shengqi', motion: 'huishou', hasMatch: true }
```

#### `playLive2DExpression(expressionName)`
播放指定的表情。

**参数：**
- `expressionName` (string): 表情名称

**返回：**
- `Promise<boolean>`: 播放是否成功

**示例：**
```javascript
await ttsStore.playLive2DExpression('shengqi')
```

#### `playLive2DMotion(motionName, options)`
播放指定的动作。

**参数：**
- `motionName` (string): 动作名称
- `options` (object): 播放选项

**返回：**
- `Promise<boolean>`: 播放是否成功

**示例：**
```javascript
await ttsStore.playLive2DMotion('huishou')
```

#### `playExpressionAndMotion(expressionName, motionName, options)`
播放表情和动作组合，自动处理冲突。

**参数：**
- `expressionName` (string): 表情名称
- `motionName` (string): 动作名称
- `options` (object): 播放选项
  - `prioritizeExpression` (boolean): 是否优先表情
  - `prioritizeMotion` (boolean): 是否优先动作

**返回：**
- `Promise<object>`: 播放结果对象

**示例：**
```javascript
const result = await ttsStore.playExpressionAndMotion('shengqi', 'huishou', {
  prioritizeExpression: true
})
// 返回: { expression: true, motion: false, reason: 'conflict_prioritize_expression' }
```

### 配置对象

#### `EXPRESSION_KEYWORDS`
表情关键词映射表。

```javascript
{
  'shengqi': ['生气', '愤怒', '讨厌', '烦死了', '气死了', '可恶', '混蛋'],
  'weiqu': ['委屈', '难过', '伤心', '呜呜', '好难过', '心疼'],
  // ... 更多表情
}
```

#### `MOTION_KEYWORDS`
动作关键词映射表。

```javascript
{
  'huishou': ['挥手', '再见', '拜拜', '打招呼', '你好', '挥手告别'],
  'diantou': ['点头', '点头同意', '嗯嗯', '好的', '同意', '赞成'],
  // ... 更多动作
}
```

#### `EXPRESSION_LIP_SYNC_COMPATIBLE`
表情与口型同步的兼容性配置。

```javascript
{
  'compatible': ['neutral', 'wenroudexiao', 'mimiyan', 'tuosai', 'haixiu', 'lianhong'],
  'partial': ['jingya', 'jingxi', 'aojiao', 'guilian', 'luolei'],
  'incompatible': ['shengqi', 'weiqu', 'yanlei', 'hahadaxiao', 'baoxiong', 'chayao']
}
```

---

## 🧪 测试和调试

### 使用测试面板

1. 访问表情动作测试页面
2. 输入测试文本
3. 点击"匹配测试"查看匹配结果
4. 点击"播放测试"观看效果
5. 使用"测试所有表情"和"测试所有动作"进行批量测试

### 控制台调试

```javascript
// 查看匹配结果
console.log('匹配结果:', ttsStore.matchExpressionAndMotion('测试文本'))

// 查看所有表情
console.log('所有表情:', Object.keys(ttsStore.EXPRESSION_KEYWORDS))

// 查看所有动作
console.log('所有动作:', Object.keys(ttsStore.MOTION_KEYWORDS))

// 查看兼容性配置
console.log('兼容性配置:', ttsStore.EXPRESSION_LIP_SYNC_COMPATIBLE)
```

### 常见问题排查

1. **表情不播放**
   - 检查 Live2D 模型是否已加载
   - 检查控制台是否有错误信息
   - 确认表情名称是否正确

2. **动作冲突**
   - 查看兼容性配置
   - 使用 `playExpressionAndMotion` 自动处理冲突
   - 设置合适的优先级策略

3. **口型同步问题**
   - 检查表情的兼容性级别
   - 使用 `neutral` 表情确保口型同步
   - 查看音频连接状态

---

## 🎯 最佳实践

### 1. 关键词设计

- **具体明确**：使用具体的情感词汇，避免模糊表达
- **覆盖全面**：为每种表情提供多个同义词
- **优先级合理**：强烈情感优先于温和情感

### 2. 冲突处理

- **自动检测**：使用 `playExpressionAndMotion` 自动处理冲突
- **优先级策略**：根据场景选择合适的优先级
- **用户体验**：避免频繁的表情切换

### 3. 性能优化

- **防抖机制**：避免过于频繁的表情切换
- **异步播放**：使用异步方法避免阻塞主线程
- **资源管理**：及时清理不需要的资源

### 4. 扩展性

- **模块化设计**：表情和动作系统独立管理
- **配置驱动**：通过配置文件管理关键词映射
- **插件化**：支持自定义表情和动作

### 5. 用户体验

- **自然过渡**：表情切换要自然流畅
- **情感表达**：表情要与文本内容匹配
- **交互反馈**：提供即时的视觉反馈

---

## 📝 示例代码

### 完整的消息处理示例

```javascript
const handleChatMessage = async (message) => {
  try {
    // 1. 匹配表情和动作
    const matchResult = ttsStore.matchExpressionAndMotion(message.content)
    
    if (matchResult.hasMatch) {
      console.log('🎭🎬 匹配到表情和动作:', matchResult)
      
      // 2. 播放表情和动作组合
      const playResult = await ttsStore.playExpressionAndMotion(
        matchResult.expression,
        matchResult.motion,
        {
          prioritizeExpression: true,
          // 可以根据消息类型调整优先级
          // prioritizeMotion: message.type === 'action'
        }
      )
      
      console.log('🎭🎬 播放结果:', playResult)
    }
    
    // 3. 处理其他逻辑...
    
  } catch (error) {
    console.error('❌ 处理消息失败:', error)
  }
}
```

### 自定义表情映射示例

```javascript
// 扩展表情关键词
const customExpressions = {
  'excited': ['兴奋', '激动', '太棒了', '好激动', '兴奋不已'],
  'confused': ['困惑', '疑惑', '不明白', '搞不懂', '困惑'],
  'proud': ['骄傲', '自豪', '得意', '很自豪', '骄傲的']
}

// 合并到现有配置
Object.assign(ttsStore.EXPRESSION_KEYWORDS, customExpressions)
```

---

*最后更新: 2024年12月*
