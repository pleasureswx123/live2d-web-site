# Live2D API 使用示例

## 📚 目录

- [基础使用](#基础使用)
- [表情管理](#表情管理)
- [动作管理](#动作管理)
- [参数管理](#参数管理)
- [冲突管理](#冲突管理)
- [状态管理](#状态管理)
- [实际项目集成](#实际项目集成)

---

## 🚀 基础使用

### 导入工具类
```javascript
import {
  ExpressionManager,
  MotionManager,
  ParameterManager,
  Live2DConflictManager,
  Live2DStateManager,
  createModelManagers
} from '../utils/live2dManagers'
```

### 初始化管理器
```javascript
// 等待模型加载完成
const model = await Live2DModel.from('model.model3.json')

// 创建所有管理器
const managers = createModelManagers(model)

// 或者单独创建
const expressionManager = new ExpressionManager(model)
const motionManager = new MotionManager(model)
const parameterManager = new ParameterManager(model)
const conflictManager = new Live2DConflictManager(model)
const stateManager = new Live2DStateManager(model)
```

---

## 🎭 表情管理

### 基础表情操作
```javascript
// 播放表情
await expressionManager.play('happy')
await expressionManager.play('sad')
await expressionManager.play('neutral')

// 获取当前表情
const currentExpression = expressionManager.getCurrent()
console.log('当前表情:', currentExpression)

// 获取所有可用表情
const allExpressions = expressionManager.getAll()
console.log('可用表情:', allExpressions)

// 检查表情是否存在
if (expressionManager.exists('happy')) {
  await expressionManager.play('happy')
}

// 重置表情
await expressionManager.reset() // 重置为 neutral
```

### 表情播放示例
```javascript
// 表情播放函数
async function playExpressionWithFeedback(expressionName) {
  console.log(`🎭 尝试播放表情: ${expressionName}`)
  
  if (!expressionManager.exists(expressionName)) {
    console.warn(`⚠️ 表情不存在: ${expressionName}`)
    return false
  }
  
  const success = await expressionManager.play(expressionName)
  
  if (success) {
    console.log(`✅ 表情播放成功: ${expressionName}`)
  } else {
    console.error(`❌ 表情播放失败: ${expressionName}`)
  }
  
  return success
}

// 使用示例
await playExpressionWithFeedback('happy')
await playExpressionWithFeedback('sad')
```

---

## 🎬 动作管理

### 基础动作操作
```javascript
// 播放动作
await motionManager.play('idle')
await motionManager.play('wave', { loop: true })
await motionManager.play('tap')

// 获取当前动作
const currentMotion = motionManager.getCurrent()
console.log('当前动作:', currentMotion)

// 获取所有可用动作
const allMotions = motionManager.getAll()
console.log('可用动作:', allMotions)

// 检查动作是否正在播放
if (motionManager.isPlaying('wave')) {
  console.log('挥手动作正在播放')
}

// 停止动作
motionManager.stopAll() // 停止所有动作
motionManager.stopMotion('wave') // 停止特定动作
```

### 动作播放示例
```javascript
// 动作播放函数
async function playMotionWithOptions(motionName, options = {}) {
  console.log(`🎬 尝试播放动作: ${motionName}`)
  
  if (!motionManager.exists(motionName)) {
    console.warn(`⚠️ 动作不存在: ${motionName}`)
    return false
  }
  
  const success = await motionManager.play(motionName, options)
  
  if (success) {
    console.log(`✅ 动作播放成功: ${motionName}`)
  } else {
    console.error(`❌ 动作播放失败: ${motionName}`)
  }
  
  return success
}

// 使用示例
await playMotionWithOptions('idle', { loop: true })
await playMotionWithOptions('wave')
await playMotionWithOptions('tap')
```

---

## ⚙️ 参数管理

### 基础参数操作
```javascript
// 设置参数
parameterManager.setParameter('ParamMouthOpenY', 0.5)
parameterManager.setParameter('ParamMouthForm', 0.3)

// 获取参数值
const mouthOpen = parameterManager.getParameter('ParamMouthOpenY')
console.log('嘴部开合度:', mouthOpen)

// 批量设置参数
const params = {
  'ParamMouthOpenY': 0.8,
  'ParamMouthForm': 0.6,
  'MouthX': 0.2
}
parameterManager.setMultipleParameters(params)

// 批量重置参数
const paramIds = ['ParamMouthOpenY', 'ParamMouthForm', 'MouthX']
parameterManager.resetMultipleParameters(paramIds)
```

### 参数状态管理
```javascript
// 保存参数状态
const paramIds = ['ParamMouthOpenY', 'ParamMouthForm', 'Param21', 'Param22']
const savedState = parameterManager.saveParameterState(paramIds)

// 恢复参数状态
parameterManager.restoreParameterState(savedState)

// 重置特定类型参数
parameterManager.resetMouthParameters()     // 重置嘴部参数
parameterManager.resetExpressionParameters() // 重置表情参数
parameterManager.resetMotionParameters()    // 重置动作参数
```

### 参数监控示例
```javascript
// 参数监控函数
function monitorParameters(paramIds, interval = 1000) {
  const intervalId = setInterval(() => {
    console.log('=== 参数监控 ===')
    paramIds.forEach(paramId => {
      const value = parameterManager.getParameter(paramId)
      console.log(`${paramId}: ${value}`)
    })
  }, interval)
  
  return () => clearInterval(intervalId) // 返回停止函数
}

// 使用示例
const stopMonitoring = monitorParameters([
  'ParamMouthOpenY',
  'ParamMouthForm',
  'Param21'
], 2000)

// 停止监控
// stopMonitoring()
```

---

## 🚫 冲突管理

### 冲突检测
```javascript
// 检查冲突
const hasConflict = conflictManager.checkConflict('baoxiong', 'huishou')
console.log('是否有冲突:', hasConflict)

// 获取冲突的动作列表
const conflictingMotions = conflictManager.getConflictingMotions('baoxiong')
console.log('与叉腰冲突的动作:', conflictingMotions)

// 获取冲突的表情列表
const conflictingExpressions = conflictManager.getConflictingExpressions('huishou')
console.log('与挥手冲突的表情:', conflictingExpressions)
```

### 安全播放
```javascript
// 安全播放表情和动作
const result = await conflictManager.safePlay('baoxiong', 'huishou', {
  prioritizeExpression: true
})

console.log('播放结果:', result)
// 输出: { expression: true, motion: false, reason: 'conflict_prioritize_expression' }

// 不同优先级的播放
const result1 = await conflictManager.safePlay('baoxiong', 'huishou', {
  prioritizeMotion: true
})
// 输出: { expression: false, motion: true, reason: 'conflict_prioritize_motion' }

const result2 = await conflictManager.safePlay('happy', 'wave')
// 输出: { expression: true, motion: true, reason: 'success' }
```

### 冲突规则管理
```javascript
// 添加新的冲突规则
conflictManager.addConflict('newExpression', ['motion1', 'motion2'])

// 移除冲突规则
conflictManager.removeConflict('baoxiong', 'huishou')

// 重置冲突参数
conflictManager.resetArmParameters()
conflictManager.resetExpressionParameters()
```

### 冲突管理示例
```javascript
// 智能播放函数
async function smartPlay(expressionName, motionName) {
  console.log(`🎭🎬 尝试播放: ${expressionName} + ${motionName}`)
  
  const result = await conflictManager.safePlay(expressionName, motionName)
  
  switch (result.reason) {
    case 'success':
      console.log('✅ 表情和动作都播放成功')
      break
    case 'conflict_prioritize_expression':
      console.log('⚠️ 检测到冲突，只播放了表情')
      break
    case 'conflict_prioritize_motion':
      console.log('⚠️ 检测到冲突，只播放了动作')
      break
    case 'conflict_default':
      console.log('⚠️ 检测到冲突，停止动作只播放表情')
      break
  }
  
  return result
}

// 使用示例
await smartPlay('baoxiong', 'huishou')  // 有冲突
await smartPlay('happy', 'wave')        // 无冲突
```

---

## 🎯 状态管理

### 基础状态操作
```javascript
// 播放表情和动作
const result = await stateManager.playExpressionAndMotion('happy', 'wave')

// 只播放表情
await stateManager.playExpression('sad')

// 只播放动作
await stateManager.playMotion('idle', { loop: true })

// 停止所有
await stateManager.stopAll()

// 重置到默认状态
await stateManager.resetToDefault()
```

### 状态监控
```javascript
// 获取当前状态
const currentState = stateManager.getCurrentState()
console.log('当前状态:', currentState)
// 输出: { expression: 'happy', motion: { name: 'wave', ... }, parameters: [...] }

// 检查是否处于默认状态
const isDefault = stateManager.isInDefaultState()
console.log('是否默认状态:', isDefault)

// 保存当前状态
const savedState = stateManager.saveCurrentState()

// 恢复状态
await stateManager.restoreState(savedState)
```

### 状态管理示例
```javascript
// 状态切换函数
async function switchToState(expressionName, motionName, options = {}) {
  console.log(`🔄 切换到状态: ${expressionName} + ${motionName}`)
  
  // 保存当前状态
  const previousState = stateManager.saveCurrentState()
  
  // 切换到新状态
  const result = await stateManager.playExpressionAndMotion(expressionName, motionName, options)
  
  if (result.expression || result.motion) {
    console.log('✅ 状态切换成功')
    return { success: true, previousState, currentState: result }
  } else {
    console.log('❌ 状态切换失败')
    return { success: false, previousState }
  }
}

// 使用示例
const result = await switchToState('happy', 'wave')
if (result.success) {
  // 可以恢复到之前的状态
  await stateManager.restoreState(result.previousState)
}
```

---

## 🔧 实际项目集成

### 在 TTS Store 中使用
```javascript
// src/stores/ttsStore.js
import { Live2DStateManager, Live2DConflictManager } from '../utils/live2dManagers'

// 初始化管理器
let stateManager = null
let conflictManager = null

// 在模型加载后初始化
if (window.live2dModel) {
  stateManager = new Live2DStateManager(window.live2dModel)
  conflictManager = new Live2DConflictManager(window.live2dModel)
}

// 修改表情播放逻辑
playLive2DExpression: async (expressionName) => {
  try {
    if (!stateManager) {
      console.log('🎭 Live2D模型未加载，跳过表情播放')
      return false
    }

    const success = await stateManager.playExpression(expressionName)
    
    if (success) {
      console.log(`✅ Live2D表情播放成功: ${expressionName}`)
      return true
    } else {
      console.warn(`⚠️ Live2D表情播放失败: ${expressionName}`)
      return false
    }
  } catch (error) {
    console.error('❌ Live2D表情播放异常:', error)
    return false
  }
}
```

### 在组件中使用
```javascript
// src/components/Live2DViewer.jsx
import { createModelManagers } from '../utils/live2dManagers'

export default function Live2DViewer() {
  const [managers, setManagers] = useState(null)
  
  useEffect(() => {
    if (window.live2dModel) {
      const modelManagers = createModelManagers(window.live2dModel)
      setManagers(modelManagers)
    }
  }, [])
  
  const handleExpressionClick = async (expressionName) => {
    if (managers) {
      await managers.expressionManager.play(expressionName)
    }
  }
  
  const handleMotionClick = async (motionName) => {
    if (managers) {
      await managers.motionManager.play(motionName)
    }
  }
  
  const handleReset = async () => {
    if (managers) {
      await managers.stateManager.resetToDefault()
    }
  }
  
  return (
    <div>
      {/* UI 组件 */}
    </div>
  )
}
```

### 在 WebSocket 消息处理中使用
```javascript
// src/contexts/WebSocketContext.jsx
import { Live2DConflictManager } from '../utils/live2dManagers'

let conflictManager = null

// 初始化
if (window.live2dModel) {
  conflictManager = new Live2DConflictManager(window.live2dModel)
}

// 处理消息
const handleMessage = async (data) => {
  if (data.type === 'expression_and_motion') {
    const result = await conflictManager.safePlay(
      data.expression, 
      data.motion, 
      { prioritizeExpression: true }
    )
    
    console.log('播放结果:', result)
  }
}
```

---

## 🧪 测试示例

### 创建测试函数
```javascript
// 测试函数
async function testLive2DManagers() {
  console.log('🧪 开始测试 Live2D 管理器...')
  
  if (!window.live2dModel) {
    console.error('❌ 模型未加载')
    return
  }
  
  const managers = createModelManagers(window.live2dModel)
  
  // 测试表情管理
  console.log('🎭 测试表情管理...')
  await managers.expressionManager.play('happy')
  await new Promise(resolve => setTimeout(resolve, 2000))
  await managers.expressionManager.play('sad')
  
  // 测试动作管理
  console.log('🎬 测试动作管理...')
  await managers.motionManager.play('wave')
  await new Promise(resolve => setTimeout(resolve, 2000))
  managers.motionManager.stopAll()
  
  // 测试冲突管理
  console.log('🚫 测试冲突管理...')
  const result = await managers.conflictManager.safePlay('baoxiong', 'huishou')
  console.log('冲突测试结果:', result)
  
  // 测试状态管理
  console.log('🎯 测试状态管理...')
  await managers.stateManager.resetToDefault()
  
  console.log('✅ 测试完成')
}

// 运行测试
// testLive2DManagers()
```

---

## 📝 最佳实践总结

1. **总是使用管理器类**：避免直接操作模型，使用封装好的管理器
2. **检查模型加载状态**：在操作前确保模型已完全加载
3. **使用冲突管理**：避免三只手等渲染问题
4. **错误处理**：所有操作都要有适当的错误处理
5. **状态监控**：定期检查模型状态，确保一致性
6. **性能优化**：避免频繁的参数设置，使用批量操作

---

*这些示例展示了如何使用 Live2D 管理工具类来处理各种场景。根据你的具体需求，可以组合使用这些功能。*
