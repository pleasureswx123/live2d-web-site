# Live2D API 完整参考文档

## 📚 目录

- [核心概念](#核心概念)
- [表情 (Expression) API](#表情-expression-api)
- [动作 (Motion) API](#动作-motion-api)
- [参数管理 API](#参数管理-api)
- [冲突管理解决方案](#冲突管理解决方案)
- [实用工具类](#实用工具类)
- [最佳实践](#最佳实践)
- [常见问题解决](#常见问题解决)

## 🎯 核心概念

### 模型结构层次
```
Live2DModel
├── internalModel
│   ├── coreModel (参数控制)
│   └── motionManager
│       ├── expressionManager (表情管理)
│       └── motionManager (动作管理)
└── 继承自 Pixi.js DisplayObject
```

### 主要组件
- **Live2DModel**: 主要的模型实例
- **InternalModel**: 内部模型实现
- **CoreModel**: 核心参数控制
- **MotionManager**: 动作管理器
- **ExpressionManager**: 表情管理器

---

## 🎭 表情 (Expression) API

### 基础操作

#### 播放表情
```javascript
// 方法1：使用模型的 expression 方法
await model.expression('happy')
await model.expression('sad')
await model.expression('neutral')

// 方法2：使用表情管理器
const em = model.internalModel.motionManager.expressionManager
await em.setExpression('happy')

// 方法3：带回调的表情播放
model.expression('happy').then(() => {
  console.log('表情播放完成')
})
```

#### 获取表情信息
```javascript
const em = model.internalModel.motionManager.expressionManager

// 获取当前表情名称
const currentExpression = em.currentExpression

// 获取所有可用表情
const expressions = em.expressions
console.log('可用表情:', expressions.map(exp => exp.name))

// 获取表情参数
const expressionParams = em.expressions
```

#### 重置表情
```javascript
// 方法1：设置为中性表情
await model.expression('neutral')

// 方法2：重置所有表情参数
const em = model.internalModel.motionManager.expressionManager
em.setExpression('') // 空字符串重置

// 方法3：手动重置表情参数
const core = model.internalModel.coreModel
core.setParameterValueById('Param21', 0) // 委屈
core.setParameterValueById('Param22', 0) // 生气
core.setParameterValueById('Param23', 0) // 害羞
core.setParameterValueById('Param24', 0) // 傲娇
core.setParameterValueById('Param25', 0) // 惊讶
core.setParameterValueById('Param26', 0) // 惊喜
core.setParameterValueById('Param27', 0) // 眯眯眼
core.setParameterValueById('Param28', 0) // 哈哈大笑
core.setParameterValueById('Param29', 0) // 温柔的笑
core.setParameterValueById('Param30', 0) // 落泪
```

#### 取消表情播放
```javascript
// 表情管理器没有直接的停止方法，但可以：
// 1. 切换到其他表情
await model.expression('neutral')

// 2. 重置表情参数
const em = model.internalModel.motionManager.expressionManager
em.setExpression('')
```

---

## 🎬 动作 (Motion) API

### 基础操作

#### 播放动作
```javascript
// 方法1：播放单次动作
await model.motion('idle')
await model.motion('tap')
await model.motion('wave')

// 方法2：播放循环动作
await model.motion('idle', { loop: true })

// 方法3：播放指定动作组中的动作
await model.motion('Idle', 0) // 播放 Idle 组的第一个动作

// 方法4：使用动作管理器
const mm = model.internalModel.motionManager
await mm.startMotion('idle')
```

#### 获取动作信息
```javascript
const mm = model.internalModel.motionManager

// 获取当前动作信息
const currentMotion = mm.currentMotion

// 获取所有可用动作
const motions = mm.definitions
console.log('可用动作:', motions)

// 检查动作是否正在播放
const isPlaying = mm.isPlaying('motionName')
```

#### 停止动作
```javascript
const mm = model.internalModel.motionManager

// 停止所有动作
mm.stopAllMotions()

// 停止特定动作
mm.stopMotion('idle')

// 停止所有动作并重置
mm.stopAllMotions()
mm.currentMotion = null
```

#### 重置动作
```javascript
// 停止所有动作
model.internalModel.motionManager.stopAllMotions()

// 重置动作状态
const mm = model.internalModel.motionManager
mm.currentMotion = null
```

---

## ⚙️ 参数管理 API

### 核心参数操作

#### 获取模型核心
```javascript
const core = model.internalModel.coreModel
```

#### 参数操作
```javascript
// 获取所有参数
const parameters = core.parameters

// 设置参数值
core.setParameterValueById('ParamId', value)

// 获取参数值
const value = core.getParameterValueById('ParamId')

// 重置参数到默认值
core.setParameterValueById('ParamId', 0)
```

#### 常用参数列表
```javascript
// 嘴部参数
const mouthParams = [
  'ParamMouthForm',    // 嘴变形
  'ParamMouthOpenY',   // 嘴张开和闭合
  'MouthX',           // 嘴部X轴位置
  'MouthPuckerWiden'  // 嘴部形状
]

// 表情参数
const expressionParams = [
  'Param21', // 委屈
  'Param22', // 生气
  'Param23', // 害羞
  'Param24', // 傲娇
  'Param25', // 惊讶
  'Param26', // 惊喜
  'Param27', // 眯眯眼
  'Param28', // 哈哈大笑
  'Param29', // 温柔的笑
  'Param30'  // 落泪
]

// 动作参数（手臂相关）
const motionParams = [
  'Param31', 'Param32', 'Param33', 'Param34', 'Param35',
  'Param36', 'Param37', 'Param38', 'Param39', 'Param40'
]
```

#### 参数批量操作
```javascript
// 批量设置参数
function setMultipleParameters(core, params) {
  Object.entries(params).forEach(([paramId, value]) => {
    core.setParameterValueById(paramId, value)
  })
}

// 批量重置参数
function resetMultipleParameters(core, paramIds) {
  paramIds.forEach(paramId => {
    core.setParameterValueById(paramId, 0)
  })
}

// 保存参数状态
function saveParameterState(core, paramIds) {
  const state = {}
  paramIds.forEach(paramId => {
    state[paramId] = core.getParameterValueById(paramId)
  })
  return state
}

// 恢复参数状态
function restoreParameterState(core, state) {
  Object.entries(state).forEach(([paramId, value]) => {
    core.setParameterValueById(paramId, value)
  })
}
```

---

## 🚫 冲突管理解决方案

### 问题描述
动作与表情重叠时可能导致严重的渲染问题，如：
- 三只手出现
- 模型变形
- 参数冲突

### 冲突检测

#### 已知冲突组合
```javascript
const conflicts = {
  // 叉腰表情与挥手动作冲突
  'baoxiong': ['huishou', 'wave', 'hand_wave'],
  // 托腮表情与挥手动作冲突
  'tuosai': ['huishou', 'wave'],
  // 委屈表情与挥手动作冲突
  'weiqu': ['huishou', 'wave'],
  // 生气表情与挥手动作冲突
  'shengqi': ['huishou', 'wave']
}
```

#### 冲突检测函数
```javascript
function checkConflict(expressionName, motionName, conflicts) {
  const conflictingMotions = conflicts[expressionName] || []
  return conflictingMotions.includes(motionName)
}
```

### 解决方案

#### 方案1：互斥播放
```javascript
async function playExclusive(expressionName, motionName, model) {
  const hasConflict = checkConflict(expressionName, motionName, conflicts)
  
  if (hasConflict) {
    console.warn(`⚠️ 检测到冲突: ${expressionName} + ${motionName}`)
    // 只播放表情，停止动作
    model.internalModel.motionManager.stopAllMotions()
    await model.expression(expressionName)
    return { expression: true, motion: false }
  } else {
    // 无冲突，正常播放
    await Promise.all([
      model.expression(expressionName),
      model.motion(motionName)
    ])
    return { expression: true, motion: true }
  }
}
```

#### 方案2：时序控制
```javascript
async function playSequentially(expressionName, motionName, model, delay = 1000) {
  // 先播放表情
  await model.expression(expressionName)
  
  // 等待表情稳定
  await new Promise(resolve => setTimeout(resolve, delay))
  
  // 再播放动作
  await model.motion(motionName)
}
```

#### 方案3：参数隔离
```javascript
function isolateParameters(core, expressionParams, motionParams) {
  // 保存当前状态
  const state = saveParameterState(core, [...expressionParams, ...motionParams])
  
  // 重置冲突参数
  resetMultipleParameters(core, motionParams)
  
  return state // 返回状态以便后续恢复
}
```

---

## 🛠️ 实用工具类

### 表情管理工具
```javascript
class ExpressionManager {
  constructor(model) {
    this.model = model
    this.em = model.internalModel.motionManager.expressionManager
  }

  // 播放表情
  async play(expressionName) {
    try {
      await this.model.expression(expressionName)
      console.log(`🎭 表情播放成功: ${expressionName}`)
      return true
    } catch (error) {
      console.error(`❌ 表情播放失败: ${expressionName}`, error)
      return false
    }
  }

  // 获取当前表情
  getCurrent() {
    return this.em.currentExpression
  }

  // 获取所有表情
  getAll() {
    return this.em.expressions.map(exp => exp.name)
  }

  // 重置表情
  async reset() {
    return await this.play('neutral')
  }
}
```

### 动作管理工具
```javascript
class MotionManager {
  constructor(model) {
    this.model = model
    this.mm = model.internalModel.motionManager
  }

  // 播放动作
  async play(motionName, options = {}) {
    try {
      await this.model.motion(motionName, options)
      console.log(`🎬 动作播放成功: ${motionName}`)
      return true
    } catch (error) {
      console.error(`❌ 动作播放失败: ${motionName}`, error)
      return false
    }
  }

  // 停止所有动作
  stopAll() {
    this.mm.stopAllMotions()
    console.log('⏹️ 所有动作已停止')
  }

  // 获取当前动作
  getCurrent() {
    return this.mm.currentMotion
  }

  // 获取所有动作
  getAll() {
    return this.mm.definitions
  }
}
```

### 冲突管理工具
```javascript
class Live2DConflictManager {
  constructor(model) {
    this.model = model
    this.core = model.internalModel.coreModel
    this.mm = model.internalModel.motionManager
    this.em = model.internalModel.motionManager.expressionManager
    
    // 定义冲突组合
    this.conflicts = {
      'baoxiong': ['huishou', 'wave', 'hand_wave'],
      'tuosai': ['huishou', 'wave'],
      'weiqu': ['huishou', 'wave'],
      'shengqi': ['huishou', 'wave']
    }
    
    // 定义手臂相关参数
    this.armParams = [
      'Param31', 'Param32', 'Param33', 'Param34', 'Param35',
      'Param36', 'Param37', 'Param38', 'Param39', 'Param40'
    ]
  }

  // 检查冲突
  checkConflict(expressionName, motionName) {
    const conflictingMotions = this.conflicts[expressionName] || []
    return conflictingMotions.includes(motionName)
  }

  // 安全播放
  async safePlay(expressionName, motionName, options = {}) {
    const hasConflict = this.checkConflict(expressionName, motionName)
    
    if (hasConflict) {
      console.warn(`⚠️ 检测到冲突: ${expressionName} + ${motionName}`)
      
      if (options.prioritizeExpression) {
        await this.playExpression(expressionName)
        return { expression: true, motion: false }
      } else if (options.prioritizeMotion) {
        await this.playMotion(motionName, options)
        return { expression: false, motion: true }
      } else {
        this.mm.stopAllMotions()
        await this.playExpression(expressionName)
        return { expression: true, motion: false }
      }
    } else {
      await Promise.all([
        this.playExpression(expressionName),
        this.playMotion(motionName, options)
      ])
      return { expression: true, motion: true }
    }
  }

  // 重置手臂参数
  resetArmParameters() {
    this.armParams.forEach(paramId => {
      this.core.setParameterValueById(paramId, 0)
    })
    console.log('🔄 手臂参数已重置')
  }

  // 播放表情
  async playExpression(expressionName) {
    try {
      await this.model.expression(expressionName)
      return true
    } catch (error) {
      console.error(`表情播放失败: ${expressionName}`, error)
      return false
    }
  }

  // 播放动作
  async playMotion(motionName, options = {}) {
    try {
      await this.model.motion(motionName, options)
      return true
    } catch (error) {
      console.error(`动作播放失败: ${motionName}`, error)
      return false
    }
  }
}
```

### 完整状态管理
```javascript
class Live2DStateManager {
  constructor(model) {
    this.model = model
    this.expressionManager = new ExpressionManager(model)
    this.motionManager = new MotionManager(model)
    this.conflictManager = new Live2DConflictManager(model)
  }

  // 播放表情和动作
  async playExpressionAndMotion(expression, motion, options = {}) {
    return await this.conflictManager.safePlay(expression, motion, options)
  }

  // 停止所有
  async stopAll() {
    this.motionManager.stopAll()
    await this.expressionManager.reset()
  }

  // 重置到默认状态
  async resetToDefault() {
    await this.stopAll()
    
    // 重置嘴部参数
    const core = this.model.internalModel.coreModel
    core.setParameterValueById('ParamMouthOpenY', 0)
    core.setParameterValueById('ParamMouthForm', 0)
  }

  // 获取当前状态
  getCurrentState() {
    return {
      expression: this.expressionManager.getCurrent(),
      motion: this.motionManager.getCurrent()
    }
  }
}
```

---

## 🎯 最佳实践

### 1. 初始化
```javascript
// 等待模型加载完成
const model = await Live2DModel.from('model.model3.json')

// 初始化状态管理器
const stateManager = new Live2DStateManager(model)
const conflictManager = new Live2DConflictManager(model)
```

### 2. 安全播放
```javascript
// 使用冲突管理器安全播放
const result = await conflictManager.safePlay('happy', 'wave', {
  prioritizeExpression: true
})

if (result.expression && !result.motion) {
  console.log('由于冲突，只播放了表情')
}
```

### 3. 状态监控
```javascript
// 定期检查模型状态
setInterval(() => {
  const state = stateManager.getCurrentState()
  console.log('当前状态:', state)
}, 5000)
```

### 4. 错误处理
```javascript
try {
  await model.expression('happy')
} catch (error) {
  console.error('表情播放失败:', error)
  // 重置到安全状态
  await stateManager.resetToDefault()
}
```

---

## ❓ 常见问题解决

### Q1: 三只手问题
**A**: 使用冲突管理器检测和避免冲突的动作表情组合

### Q2: 表情不生效
**A**: 检查表情名称是否正确，使用 `getAll()` 获取可用表情列表

### Q3: 动作播放失败
**A**: 检查动作名称，确保模型文件包含该动作

### Q4: 参数设置无效
**A**: 确认参数ID正确，使用 `parameters` 获取所有可用参数

### Q5: 性能问题
**A**: 避免频繁的参数设置，使用批量操作和状态缓存

---

## 📝 使用示例

### 基础使用
```javascript
// 加载模型
const model = await Live2DModel.from('model.model3.json')

// 播放表情
await model.expression('happy')

// 播放动作
await model.motion('wave')

// 停止动作
model.internalModel.motionManager.stopAllMotions()
```

### 高级使用
```javascript
// 初始化管理器
const stateManager = new Live2DStateManager(model)

// 安全播放
await stateManager.playExpressionAndMotion('happy', 'wave')

// 获取状态
const state = stateManager.getCurrentState()

// 重置
await stateManager.resetToDefault()
```

---

## 🔗 相关链接

- [pixi-live2d-display API](https://guansss.github.io/pixi-live2d-display/api/)
- [Cubism SDK 文档](https://www.live2d.com/download/cubism-sdk/download-web/)
- [Pixi.js 文档](https://pixijs.io/docs/)

---

*最后更新: 2024年12月*
