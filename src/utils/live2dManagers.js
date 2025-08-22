/**
 * Live2D 管理工具类集合
 * 包含表情管理、动作管理、冲突管理等实用功能
 */

// ==================== 表情管理工具 ====================

export class ExpressionManager {
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

  // 检查表情是否存在
  exists(expressionName) {
    return this.getAll().includes(expressionName)
  }
}

// ==================== 动作管理工具 ====================

export class MotionManager {
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

  // 停止特定动作
  stopMotion(motionName) {
    try {
      this.mm.stopMotion(motionName)
      console.log(`⏹️ 动作已停止: ${motionName}`)
    } catch (error) {
      console.warn(`⚠️ 停止动作失败: ${motionName}`, error)
    }
  }

  // 获取当前动作
  getCurrent() {
    return this.mm.currentMotion
  }

  // 获取所有动作
  getAll() {
    return this.mm.definitions
  }

  // 检查动作是否正在播放
  isPlaying(motionName) {
    const current = this.getCurrent()
    return current && current.name === motionName
  }

  // 检查动作是否存在
  exists(motionName) {
    return this.getAll().some(motion => motion.name === motionName)
  }
}

// ==================== 参数管理工具 ====================

export class ParameterManager {
  constructor(model) {
    this.model = model
    this.core = model.internalModel.coreModel
  }

  // 设置参数值
  setParameter(paramId, value) {
    try {
      this.core.setParameterValueById(paramId, value)
      return true
    } catch (error) {
      console.error(`❌ 参数设置失败: ${paramId} = ${value}`, error)
      return false
    }
  }

  // 获取参数值
  getParameter(paramId) {
    try {
      return this.core.getParameterValueById(paramId)
    } catch (error) {
      console.error(`❌ 参数获取失败: ${paramId}`, error)
      return null
    }
  }

  // 批量设置参数
  setMultipleParameters(params) {
    const results = {}
    Object.entries(params).forEach(([paramId, value]) => {
      results[paramId] = this.setParameter(paramId, value)
    })
    return results
  }

  // 批量重置参数
  resetMultipleParameters(paramIds) {
    const results = {}
    paramIds.forEach(paramId => {
      results[paramId] = this.setParameter(paramId, 0)
    })
    return results
  }

  // 保存参数状态
  saveParameterState(paramIds) {
    const state = {}
    paramIds.forEach(paramId => {
      const value = this.getParameter(paramId)
      if (value !== null) {
        state[paramId] = value
      }
    })
    return state
  }

  // 恢复参数状态
  restoreParameterState(state) {
    return this.setMultipleParameters(state)
  }

  // 获取所有参数
  getAllParameters() {
    return this.core.parameters
  }

  // 重置嘴部参数
  resetMouthParameters() {
    const mouthParams = [
      'ParamMouthForm',
      'ParamMouthOpenY',
      'MouthX',
      'MouthPuckerWiden'
    ]
    return this.resetMultipleParameters(mouthParams)
  }

  // 重置表情参数
  resetExpressionParameters() {
    const expressionParams = [
      'Param21', 'Param22', 'Param23', 'Param24', 'Param25',
      'Param26', 'Param27', 'Param28', 'Param29', 'Param30'
    ]
    return this.resetMultipleParameters(expressionParams)
  }

  // 重置动作参数
  resetMotionParameters() {
    const motionParams = [
      'Param31', 'Param32', 'Param33', 'Param34', 'Param35',
      'Param36', 'Param37', 'Param38', 'Param39', 'Param40'
    ]
    return this.resetMultipleParameters(motionParams)
  }
}

// ==================== 冲突管理工具 ====================

export class Live2DConflictManager {
  constructor(model) {
    this.model = model
    this.core = model.internalModel.coreModel
    this.mm = model.internalModel.motionManager
    this.em = model.internalModel.motionManager.expressionManager
    
    // 定义已知的冲突组合
    this.conflicts = {
      // 叉腰表情与挥手动作冲突
      'baoxiong': ['huishou', 'wave', 'hand_wave'],
      // 托腮表情与挥手动作冲突
      'tuosai': ['huishou', 'wave'],
      // 委屈表情与挥手动作冲突
      'weiqu': ['huishou', 'wave'],
      // 生气表情与挥手动作冲突
      'shengqi': ['huishou', 'wave'],
      // 其他可能的冲突组合
      'aojiao': ['huishou', 'wave'],
      'jingya': ['huishou', 'wave']
    }
    
    // 定义手臂相关参数
    this.armParams = [
      'Param31', 'Param32', 'Param33', 'Param34', 'Param35',
      'Param36', 'Param37', 'Param38', 'Param39', 'Param40'
    ]

    // 定义表情参数
    this.expressionParams = [
      'Param21', 'Param22', 'Param23', 'Param24', 'Param25',
      'Param26', 'Param27', 'Param28', 'Param29', 'Param30'
    ]
  }

  // 检查冲突
  checkConflict(expressionName, motionName) {
    const conflictingMotions = this.conflicts[expressionName] || []
    return conflictingMotions.includes(motionName)
  }

  // 获取冲突的动作列表
  getConflictingMotions(expressionName) {
    return this.conflicts[expressionName] || []
  }

  // 获取冲突的表情列表
  getConflictingExpressions(motionName) {
    const conflictingExpressions = []
    Object.entries(this.conflicts).forEach(([expression, motions]) => {
      if (motions.includes(motionName)) {
        conflictingExpressions.push(expression)
      }
    })
    return conflictingExpressions
  }

  // 安全播放
  async safePlay(expressionName, motionName, options = {}) {
    const hasConflict = this.checkConflict(expressionName, motionName)
    
    if (hasConflict) {
      console.warn(`⚠️ 检测到冲突: ${expressionName} + ${motionName}`)
      
      if (options.prioritizeExpression) {
        await this.playExpression(expressionName)
        return { expression: true, motion: false, reason: 'conflict_prioritize_expression' }
      } else if (options.prioritizeMotion) {
        await this.playMotion(motionName, options)
        return { expression: false, motion: true, reason: 'conflict_prioritize_motion' }
      } else {
        // 默认只播放表情，停止动作
        this.mm.stopAllMotions()
        await this.playExpression(expressionName)
        return { expression: true, motion: false, reason: 'conflict_default' }
      }
    } else {
      // 无冲突，正常播放
      await Promise.all([
        this.playExpression(expressionName),
        this.playMotion(motionName, options)
      ])
      return { expression: true, motion: true, reason: 'success' }
    }
  }

  // 重置手臂参数
  resetArmParameters() {
    this.armParams.forEach(paramId => {
      this.core.setParameterValueById(paramId, 0)
    })
    console.log('🔄 手臂参数已重置')
  }

  // 重置表情参数
  resetExpressionParameters() {
    this.expressionParams.forEach(paramId => {
      this.core.setParameterValueById(paramId, 0)
    })
    console.log('🔄 表情参数已重置')
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

  // 添加新的冲突规则
  addConflict(expressionName, motionNames) {
    if (!this.conflicts[expressionName]) {
      this.conflicts[expressionName] = []
    }
    this.conflicts[expressionName].push(...motionNames)
    console.log(`📝 添加冲突规则: ${expressionName} -> ${motionNames.join(', ')}`)
  }

  // 移除冲突规则
  removeConflict(expressionName, motionName) {
    if (this.conflicts[expressionName]) {
      const index = this.conflicts[expressionName].indexOf(motionName)
      if (index > -1) {
        this.conflicts[expressionName].splice(index, 1)
        console.log(`🗑️ 移除冲突规则: ${expressionName} -> ${motionName}`)
      }
    }
  }
}

// ==================== 完整状态管理 ====================

export class Live2DStateManager {
  constructor(model) {
    this.model = model
    this.expressionManager = new ExpressionManager(model)
    this.motionManager = new MotionManager(model)
    this.parameterManager = new ParameterManager(model)
    this.conflictManager = new Live2DConflictManager(model)
  }

  // 播放表情和动作
  async playExpressionAndMotion(expression, motion, options = {}) {
    return await this.conflictManager.safePlay(expression, motion, options)
  }

  // 只播放表情
  async playExpression(expressionName) {
    return await this.expressionManager.play(expressionName)
  }

  // 只播放动作
  async playMotion(motionName, options = {}) {
    return await this.motionManager.play(motionName, options)
  }

  // 停止所有
  async stopAll() {
    this.motionManager.stopAll()
    await this.expressionManager.reset()
  }

  // 重置到默认状态
  async resetToDefault() {
    await this.stopAll()
    this.parameterManager.resetMouthParameters()
    console.log('🔄 模型已重置到默认状态')
  }

  // 获取当前状态
  getCurrentState() {
    return {
      expression: this.expressionManager.getCurrent(),
      motion: this.motionManager.getCurrent(),
      parameters: this.parameterManager.getAllParameters()
    }
  }

  // 检查模型是否处于默认状态
  isInDefaultState() {
    const state = this.getCurrentState()
    return state.expression === 'neutral' && !state.motion
  }

  // 保存当前状态
  saveCurrentState() {
    const state = this.getCurrentState()
    const parameterState = this.parameterManager.saveParameterState([
      ...this.conflictManager.expressionParams,
      ...this.conflictManager.armParams
    ])
    return { ...state, parameterState }
  }

  // 恢复状态
  async restoreState(state) {
    if (state.expression) {
      await this.playExpression(state.expression)
    }
    if (state.motion) {
      await this.playMotion(state.motion.name)
    }
    if (state.parameterState) {
      this.parameterManager.restoreParameterState(state.parameterState)
    }
  }
}

// ==================== 工具函数 ====================

// 检查模型是否已加载
export function isModelLoaded(model) {
  return model && model.internalModel && model.internalModel.coreModel
}

// 等待模型加载
export function waitForModel(model, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (isModelLoaded(model)) {
      resolve(model)
      return
    }

    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      if (isModelLoaded(model)) {
        clearInterval(checkInterval)
        resolve(model)
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval)
        reject(new Error('模型加载超时'))
      }
    }, 100)
  })
}

// 创建模型管理器
export function createModelManagers(model) {
  if (!isModelLoaded(model)) {
    throw new Error('模型未加载完成')
  }

  return {
    expressionManager: new ExpressionManager(model),
    motionManager: new MotionManager(model),
    parameterManager: new ParameterManager(model),
    conflictManager: new Live2DConflictManager(model),
    stateManager: new Live2DStateManager(model)
  }
}

// 默认导出
export default {
  ExpressionManager,
  MotionManager,
  ParameterManager,
  Live2DConflictManager,
  Live2DStateManager,
  isModelLoaded,
  waitForModel,
  createModelManagers
}
