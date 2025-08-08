import { useState } from 'react'
import { Drawer } from 'vaul'
import { 
  Settings, 
  Smile, 
  Play, 
  Sliders, 
  X,
  ChevronRight,
  RotateCcw
} from 'lucide-react'

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

// 动作列表 - 基于 youyou.model3.json
const MOTIONS = {
  'Idle': [
    { id: 'sleep', name: '睡觉', icon: '😴' },
    { id: 'jichudonghua', name: '基础动画', icon: '🌟' }
  ],
  'TapBody': [
    { id: 'huishou', name: '挥手', icon: '👋' },
    { id: 'diantou', name: '点头', icon: '👍' },
    { id: 'yaotou', name: '摇头', icon: '👎' }
  ],
  'TapHead': [
    { id: 'yanzhuzi', name: '眼珠子', icon: '👀' },
    { id: 'shuijiao', name: '睡觉', icon: '😴' }
  ]
}

function SettingsDrawer({ model, isOpen, onOpenChange }) {
  const [activeTab, setActiveTab] = useState('expressions')
  const [currentExpression, setCurrentExpression] = useState(null)

  // 播放表情
  const playExpression = (expressionId) => {
    if (model && model.expression) {
      try {
        model.expression(expressionId)
        setCurrentExpression(expressionId)
        console.log('🎭 播放表情:', expressionId)
      } catch (error) {
        console.error('❌ 表情播放失败:', error)
      }
    }
  }

  // 播放动作
  const playMotion = (group, motionId) => {
    if (model && model.motion) {
      try {
        model.motion(group, motionId, 3) // 优先级为3
        console.log('🎬 播放动作:', group, motionId)
      } catch (error) {
        console.error('❌ 动作播放失败:', error)
      }
    }
  }

  // 重置表情
  const resetExpression = () => {
    if (model && model.expression) {
      try {
        model.expression(null)
        setCurrentExpression(null)
        console.log('🔄 重置表情')
      } catch (error) {
        console.error('❌ 重置表情失败:', error)
      }
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
                    <div key={group} className="space-y-2">
                      <h4 className="text-md font-medium text-blue-300 flex items-center gap-2">
                        <ChevronRight size={16} />
                        {group} 组
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
