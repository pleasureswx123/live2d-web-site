import { useState } from 'react'
import { Drawer } from 'vaul'
import {
  Settings,
  Smile,
  Play,
  Sliders,
  X,
  ChevronRight,
  RotateCcw,
  Volume2
} from 'lucide-react'
import LipSyncPanel from './LipSyncPanel'

// 尝试导入 MotionPriority，如果失败则使用数字常量
let MotionPriority
try {
  MotionPriority = require('pixi-live2d-display-lipsyncpatch').MotionPriority
} catch (error) {
  // 如果导入失败，使用数字常量
  MotionPriority = {
    NONE: 0,
    IDLE: 1,
    NORMAL: 2,
    FORCE: 3
  }
}

// 智能冲突检测系统
const CONFLICT_RULES = {
  // 表情和动作的冲突规则
  expressions: {
    // 涉及手臂/手部的表情
    'baoxiong': ['arm', 'hand'], // 抱胸 - 影响手臂
    'chayao': ['arm', 'hand'],   // 叉腰 - 影响手臂和手部
  },
  motions: {
    // 涉及手臂/手部的动作
    'huishou': ['arm', 'hand'],     // 挥手 - 影响手臂和手部
    'diantou': ['head'],            // 点头 - 只影响头部
    'yaotou': ['head'],             // 摇头 - 只影响头部
    'yanzhuzi': ['eye'],            // 眼珠子 - 只影响眼部
    'shuijiao': ['eye', 'body'],    // 睡觉 - 影响眼部和身体
    'sleep': ['eye', 'body'],       // 睡眠 - 影响眼部和身体
    'jichudonghua': ['body']        // 基础动画 - 影响身体
  }
}

// 检查表情和动作是否冲突
const checkConflict = (expressionId, motionId) => {
  if (!expressionId || !motionId) return false

  const expressionParts = CONFLICT_RULES.expressions[expressionId] || []
  const motionParts = CONFLICT_RULES.motions[motionId] || []

  // 检查是否有共同的身体部位
  const hasConflict = expressionParts.some(part => motionParts.includes(part))

  if (hasConflict) {
    console.log(`⚠️ 检测到冲突: 表情 "${expressionId}" 和动作 "${motionId}" 都影响: ${expressionParts.filter(part => motionParts.includes(part)).join(', ')}`)
  }

  return hasConflict
}

// 表情列表 - 基于 youyou.model3.json
const EXPRESSIONS = [
  { id: 'aojiao', name: '傲娇', emoji: '😤' },
  { id: 'chayao', name: '叉腰', emoji: '🙄' },
  { id: 'hahadaxiao', name: '哈哈大笑', emoji: '😂' },
  { id: 'weiqu', name: '委屈', emoji: '🥺' },
  { id: 'haixiu', name: '害羞', emoji: '😊' },
  { id: 'jingxi', name: '惊喜', emoji: '😮' },
  { id: 'jingya', name: '惊讶', emoji: '😲' },
  { id: 'tuosai', name: '托腮', emoji: '🤔' },
  { id: 'baoxiong', name: '抱胸', emoji: '😏' },
  { id: 'huishou', name: '挥手', emoji: '👋' },
  { id: 'wenroudexiao', name: '温柔的笑', emoji: '😌' },
  { id: 'shengqi', name: '生气', emoji: '😠' },
  { id: 'diannao', name: '电脑', emoji: '💻' },
  { id: 'diannaofaguang', name: '电脑发光', emoji: '✨' },
  { id: 'mimiyan', name: '眯眯眼', emoji: '😊' },
  { id: 'yanlei', name: '眼泪', emoji: '😢' },
  { id: 'lianhong', name: '脸红', emoji: '😳' },
  { id: 'luolei', name: '落泪', emoji: '😭' },
  { id: 'jianpantaiqi', name: '键盘抬起', emoji: '⌨️' },
  { id: 'guilian', name: '鬼脸', emoji: '😜' }
]

// 动作列表 - 按照 Cubism 4 标准分组结构组织
const MOTIONS = {
  'Idle': [
    { id: 0, name: '基础动画', icon: '🌟', file: 'jichudonghua.motion3.json', key: 'jichudonghua' },
    { id: 1, name: '睡觉', icon: '😴', file: 'shuijiao.motion3.json', key: 'shuijiao' },
    { id: 2, name: '睡眠', icon: '💤', file: 'sleep.motion3.json', key: 'sleep' }
  ],
  'TapBody': [
    { id: 0, name: '点头', icon: '👍', file: 'diantou.motion3.json', key: 'diantou' },
    { id: 1, name: '挥手', icon: '👋', file: 'huishou.motion3.json', key: 'huishou' },
    { id: 2, name: '摇头', icon: '🙅', file: 'yaotou.motion3.json', key: 'yaotou' }
  ],
  'TapHead': [
    { id: 0, name: '眼珠子', icon: '👀', file: 'yanzhuzi.motion3.json', key: 'yanzhuzi' }
  ]
}

// 动作分组名称映射 (Cubism 4 标准)
const getGroupDisplayName = (group) => {
  const groupNames = {
    'Idle': '待机动作',
    'TapBody': '身体交互',
    'TapHead': '头部交互'
  }
  return groupNames[group] || group || '默认动作'
}

// 根据动作索引获取动作键名
const getMotionKey = (motionId) => {
  const allMotions = Object.values(MOTIONS).flat()
  const motion = allMotions.find(m => m.id === motionId)
  return motion ? motion.key : null
}

function SettingsDrawer({ model, isOpen, onOpenChange }) {
  const [activeTab, setActiveTab] = useState('expressions')
  const [currentExpression, setCurrentExpression] = useState(null)
  const [currentMotion, setCurrentMotion] = useState(null)

  // 获取当前播放的动作
  const getCurrentMotion = () => {
    return currentMotion
  }

  // 播放表情
  const playExpression = async (expressionId) => {
    if (!model) {
      console.error('❌ 模型实例不存在')
      return
    }

    try {
      console.log('🎭 尝试播放表情:', expressionId)

      // 🔍 智能冲突检测：检查当前播放的动作是否与表情冲突
      const currentMotionKey = getCurrentMotion()
      if (currentMotionKey && checkConflict(expressionId, currentMotionKey)) {
        console.log('⚠️ 检测到表情与动作冲突，强制停止当前动作')

        // 强制停止动作并等待完成
        try {
          if (model.internalModel?.motionManager) {
            const motionManager = model.internalModel.motionManager
            if (typeof motionManager.stopAllMotions === 'function') {
              motionManager.stopAllMotions()
              console.log('🛑 已停止所有动作')
            }

            // 等待动作停止生效
            await new Promise(resolve => setTimeout(resolve, 100))
            console.log('⏱️ 已等待动作停止生效')
          }

          setCurrentMotion(null)
        } catch (error) {
          console.error('❌ 动作停止失败:', error)
        }
      } else if (currentMotionKey) {
        console.log('✅ 表情与当前动作无冲突，可以同时播放')
      }

      // 尝试多种表情播放方式
      let success = false

      // 方式1: 使用标准的 expression 方法
      if (typeof model.expression === 'function') {
        console.log('🎭 使用 model.expression() 方法')
        const result = model.expression(expressionId)
        console.log('🎭 表情播放结果:', result)

        // 如果返回的是 Promise，等待它完成
        if (result && typeof result.then === 'function') {
          try {
            success = await result
            console.log('🎭 Promise 解析结果:', success)
          } catch (error) {
            console.error('🎭 Promise 解析失败:', error)
            success = false
          }
        } else {
          success = result !== false
          console.log('🎭 同步结果:', success)
        }
      }

      // 方式2: 如果标准方法失败，尝试使用内部 API
      if (!success && model.internalModel?.motionManager?.expressionManager) {
        console.log('🎭 使用内部 expressionManager')
        const expressionManager = model.internalModel.motionManager.expressionManager

        // 尝试多种内部方法
        if (typeof expressionManager.setExpression === 'function') {
          console.log('🎭 尝试 setExpression')
          const result = expressionManager.setExpression(expressionId)
          console.log('🎭 setExpression 结果:', result)
          success = result !== false
        } else if (typeof expressionManager.startMotion === 'function') {
          console.log('🎭 尝试 startMotion')
          const result = expressionManager.startMotion(expressionId, false, 2)
          console.log('🎭 startMotion 结果:', result)
          success = result !== false
        }
      }

      if (success) {
        setCurrentExpression(expressionId)
        console.log('✅ 表情播放成功:', expressionId)
      } else {
        console.warn('⚠️ 表情播放失败，可能表情不存在:', expressionId)
      }

    } catch (error) {
      console.error('❌ 表情播放失败:', error)
    }
  }

  // 播放动作
  const playMotion = async (group, motionId) => {
    if (!model) {
      console.error('❌ 模型实例不存在')
      return
    }

    try {
      console.log('🎬 尝试播放动作:', group, motionId)

      // 🔍 智能冲突检测：检查当前表情是否与动作冲突
      const motionKey = getMotionKey(motionId)
      if (currentExpression && motionKey && checkConflict(currentExpression, motionKey)) {
        console.log('⚠️ 检测到动作与表情冲突，强制重置表情')

        // 强制重置表情并等待完成
        try {
          if (model.internalModel?.motionManager?.expressionManager) {
            const expressionManager = model.internalModel.motionManager.expressionManager
            if (typeof expressionManager.setExpression === 'function') {
              const resetResult = expressionManager.setExpression(null)
              if (resetResult && typeof resetResult.then === 'function') {
                await resetResult
                console.log('🛑 已等待表情重置完成（Promise）')
              } else {
                console.log('🛑 已重置表情（同步）')
              }
            }
          } else if (typeof model.expression === 'function') {
            const resetResult = model.expression(null)
            if (resetResult && typeof resetResult.then === 'function') {
              await resetResult
              console.log('🛑 已等待标准 API 表情重置完成')
            } else {
              console.log('🛑 已使用标准 API 重置表情（同步）')
            }
          }

          // 额外等待一帧确保重置生效
          await new Promise(resolve => setTimeout(resolve, 50))
          console.log('⏱️ 已等待额外时间确保表情重置生效')

          setCurrentExpression(null)
        } catch (error) {
          console.error('❌ 表情重置失败:', error)
        }
      } else if (currentExpression) {
        console.log('✅ 动作与当前表情无冲突，可以同时播放')
      }

      // 使用标准的 pixi-live2d-display API
      if (typeof model.motion === 'function') {
        // 使用 FORCE 优先级来避免动作重叠
        // 根据官方文档：FORCE 优先级确保动作立即播放，覆盖当前动作
        const result = model.motion(group, motionId, MotionPriority.FORCE)
        console.log('🎬 动作播放结果:', result)

        // 如果返回的是 Promise，等待它完成
        if (result && typeof result.then === 'function') {
          const success = await result
          if (success !== false) {
            console.log('✅ 动作播放成功:', group, motionId)
            // 设置当前动作状态
            setCurrentMotion(motionId)
            // 只有在冲突时才清除表情状态
            if (currentExpression && motionKey && checkConflict(currentExpression, motionKey)) {
              setCurrentExpression(null)
            }
          } else {
            console.warn('⚠️ 动作播放失败，可能动作不存在:', group, motionId)
          }
        } else {
          // 同步结果
          if (result !== false) {
            console.log('✅ 动作播放成功:', group, motionId)
            // 设置当前动作状态
            setCurrentMotion(motionId)
            // 只有在冲突时才清除表情状态
            if (currentExpression && motionKey && checkConflict(currentExpression, motionKey)) {
              setCurrentExpression(null)
            }
          } else {
            console.warn('⚠️ 动作播放返回 false，可能动作不存在:', group, motionId)
          }
        }
      } else {
        console.error('❌ 模型不支持 motion 方法')
      }
    } catch (error) {
      console.error('❌ 动作播放失败:', error)
    }
  }

  // 重置表情和动作
  const resetExpression = () => {
    if (!model) {
      console.error('❌ 模型实例不存在')
      return
    }

    try {
      console.log('🔄 尝试重置表情和动作')

      // 停止所有动作
      if (model.internalModel?.motionManager) {
        const motionManager = model.internalModel.motionManager
        if (typeof motionManager.stopAllMotions === 'function') {
          motionManager.stopAllMotions()
          console.log('🛑 已停止所有动作')
        }
      }

      // 重置表情
      if (typeof model.expression === 'function') {
        const result = model.expression(null)
        console.log('🔄 表情重置结果:', result)
        setCurrentExpression(null)
        setCurrentMotion(null) // 清除动作状态
        console.log('✅ 表情和动作重置成功')
      } else {
        console.error('❌ 模型不支持 expression 方法')
      }
    } catch (error) {
      console.error('❌ 重置失败:', error)
    }
  }

  return (
    <>
      {/* 设置按钮 */}
      <button
        onClick={() => onOpenChange(true)}
        className="fixed top-4 right-4 z-50 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110"
        title="设置"
      >
        <Settings size={20} />
      </button>

      {/* 抽屉组件 */}
      <Drawer.Root
        open={isOpen}
        onOpenChange={onOpenChange}
        direction="right"
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="bg-gray-900 text-white flex flex-col rounded-l-[10px] h-full w-[400px] mt-0 fixed bottom-0 right-0 z-50">
            {/* 抽屉头部 */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={20} />
                <Drawer.Title className="text-lg font-semibold">
                  Live2D 设置
                </Drawer.Title>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 添加 Description 以解决无障碍性警告 */}
            <Drawer.Description className="sr-only">
              Live2D 模型设置面板，可以控制表情、动作和参数
            </Drawer.Description>

            {/* 标签页导航 */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab('expressions')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'expressions'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Smile size={16} className="inline mr-2" />
                表情
              </button>
              <button
                onClick={() => setActiveTab('motions')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'motions'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Play size={16} className="inline mr-2" />
                动作
              </button>
              <button
                onClick={() => setActiveTab('lipsync')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'lipsync'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Volume2 size={16} className="inline mr-2" />
                口型
              </button>
              <button
                onClick={() => setActiveTab('parameters')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'parameters'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Sliders size={16} className="inline mr-2" />
                参数
              </button>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* 表情面板 */}
              {activeTab === 'expressions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">表情控制</h3>
                    <button
                      onClick={resetExpression}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                    >
                      <RotateCcw size={14} />
                      重置
                    </button>
                  </div>

                  {currentExpression && (
                    <div className="p-3 bg-blue-600 bg-opacity-20 border border-blue-500 rounded-lg">
                      <p className="text-sm text-blue-200">
                        当前表情: {EXPRESSIONS.find(exp => exp.id === currentExpression)?.name}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {EXPRESSIONS.map((expression) => (
                      <button
                        key={expression.id}
                        onClick={() => playExpression(expression.id)}
                        className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                          currentExpression === expression.id
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-200'
                        }`}
                      >
                        <div className="text-lg mb-1">{expression.emoji}</div>
                        <div className="text-sm font-medium">{expression.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 动作面板 */}
              {activeTab === 'motions' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">动作控制</h3>

                  {Object.entries(MOTIONS).map(([group, motions]) => (
                    <div key={group || 'default'} className="space-y-2">
                      <h4 className="text-md font-medium text-blue-300 flex items-center gap-2">
                        <ChevronRight size={16} />
                        {getGroupDisplayName(group)}
                      </h4>
                      <div className="grid grid-cols-1 gap-2 ml-4">
                        {motions.map((motion) => (
                          <button
                            key={motion.id}
                            onClick={() => playMotion(group, motion.id)}
                            className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-all duration-200 hover:scale-105"
                          >
                            <span className="text-lg">{motion.icon}</span>
                            <span className="text-sm font-medium">{motion.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 口型同步面板 */}
              {activeTab === 'lipsync' && (
                <LipSyncPanel
                  model={model}
                  isModelLoaded={!!model}
                />
              )}

              {/* 参数面板 */}
              {activeTab === 'parameters' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">参数调节</h3>
                  <div className="text-center text-gray-400 py-8">
                    <Sliders size={48} className="mx-auto mb-4 opacity-50" />
                    <p>参数调节功能</p>
                    <p className="text-sm">即将推出...</p>
                  </div>
                </div>
              )}
            </div>

            {/* 抽屉底部信息 */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <div className="text-xs text-gray-400 text-center">
                Live2D 悠悠模型 • 20个表情 • 7个动作 • 103个参数
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}

export default SettingsDrawer
