# Live2D表情同步功能

## 功能概述

实现了从WebSocket `generation_chunk`消息中的文本内容自动匹配并播放相应的Live2D表情，让悠悠能够根据对话内容实时展现相应的情感表达。

## 实现原理

### 1. 表情关键词映射
在`WebSocketContext.jsx`中定义了表情关键词映射表，按优先级分为三个层次：

**强烈情感表情（高优先级）**
- `shengqi` (生气): 生气、愤怒、讨厌、烦死了、气死了、可恶、混蛋
- `weiqu` (委屈): 委屈、难过、伤心、呜呜、好难过、心疼
- `yanlei` (眼泪): 哭、眼泪、流泪、哭泣、泪水、呜呜呜
- `hahadaxiao` (哈哈大笑): 哈哈、大笑、笑死、太好笑、哈哈哈、笑、开心、高兴、快乐
- `jingya` (惊讶): 惊讶、什么、怎么会、不会吧、天哪、我的天、震惊
- `jingxi` (惊喜): 惊喜、太好了、棒、厉害、amazing、太棒了、wonderful

**中等情感表情（中优先级）**
- `haixiu` (害羞): 害羞、不好意思、羞涩、脸红红、好害羞
- `lianhong` (脸红): 脸红、羞、红脸、害羞
- `aojiao` (傲娇): 傲娇、得意、骄傲、哼、才不是、略略略
- `tuosai` (托腮): 思考、想想、让我想想、嗯嗯、考虑、琢磨
- `mimiyan` (眯眯眼): 满足、舒服、嗯、不错、挺好、还行

**温和表情（低优先级）**
- `wenroudexiao` (温柔的笑): 微笑、温柔、好的、嗯好、可以、没问题、谢谢

### 2. 表情匹配逻辑
- 按优先级顺序检查关键词，强烈情感优先匹配
- 使用字符串包含匹配（`text.includes(keyword)`）
- 返回第一个匹配到的表情名称

### 3. 表情播放机制
- 通过`window.live2dModel`访问Live2D模型实例
- 使用与`SettingsDrawer`相同的表情播放逻辑
- 支持两种播放方式：
  1. `model.expression(expressionName)` 
  2. `model.internalModel.motionManager.expressionManager.setExpression(expressionName)`

### 4. 防抖机制
- 1秒内不重复切换表情（`EXPRESSION_DEBOUNCE_TIME = 1000ms`）
- 相同表情不重复播放
- 异步播放，不阻塞文本显示

## 代码修改

### WebSocketContext.jsx 主要修改

1. **添加表情相关状态变量**
```javascript
const lastExpressionTimeRef = useRef(0)
const currentExpressionRef = useRef(null)
const EXPRESSION_DEBOUNCE_TIME = 1000
```

2. **修改generation_chunk处理逻辑**
```javascript
case 'generation_chunk':
  if (data.content) {
    appendToBotMessage(data.content)
    
    // 表情同步 - 从文本内容中匹配表情
    try {
      const matchedExpression = matchExpression(data.content)
      if (matchedExpression) {
        playLive2DExpression(matchedExpression).catch(error => {
          console.warn('🎭 表情播放失败:', error)
        })
      }
    } catch (error) {
      console.error('❌ 表情匹配异常:', error)
    }
  }
  break
```

3. **添加表情匹配和播放函数**
- `matchExpression(text)`: 匹配表情关键词
- `playLive2DExpression(expressionName)`: 播放Live2D表情

## 测试工具

### expressionTest.js
提供表情匹配测试功能，包含：
- 表情关键词映射表
- 表情匹配函数
- 测试用例和运行函数

### ExpressionTestPanel.jsx
可视化测试面板，提供：
- 文本输入测试
- 示例文本快速测试
- 控制台完整测试
- 可用表情列表展示

## 使用方法

1. **自动同步**: 当WebSocket接收到`generation_chunk`消息时，自动匹配文本中的表情关键词并播放相应表情

2. **手动测试**: 使用`ExpressionTestPanel`组件进行表情匹配和播放测试

3. **控制台测试**: 调用`runExpressionTest()`函数查看所有测试用例的匹配结果

## 注意事项

1. **模型依赖**: 需要Live2D模型已加载并通过`window.live2dModel`可访问
2. **表情名称**: 表情名称必须与模型配置文件中的表情名称完全一致
3. **性能优化**: 使用防抖机制避免频繁切换表情
4. **错误处理**: 表情播放失败不会影响文本显示功能
5. **优先级**: 按表情强度优先级匹配，强烈情感表情优先

## 扩展建议

1. **动态配置**: 可以将表情关键词映射表移到配置文件中，支持动态修改
2. **情感强度**: 可以根据关键词的情感强度调整表情播放的优先级
3. **上下文分析**: 可以结合上下文进行更智能的表情匹配
4. **表情组合**: 支持多个表情的组合播放
5. **用户自定义**: 允许用户自定义表情关键词映射
