import { useState, useMemo } from 'react'
import { Drawer } from 'vaul'
import { Settings, Smile, Play, Sliders, X, ChevronRight, RotateCcw, Volume2 } from 'lucide-react'
import LipSyncPanel from './LipSyncPanel'
import { MotionPriority } from 'pixi-live2d-display/cubism4'

// 认为“姿态类”的表情（会与手臂/手部动作冲突，先清再播）
const EXCLUSIVE_EXP_RE = /(chayao|baoxiong|叉腰|抱胸|pose|姿态)/i

const groupDisplayName = (g) => ({
  Idle: '待机动作',
  Sleep: '睡眠动作',
  TapBody: '身体交互',
  TapHead: '头部交互',
}[g] || g)

const baseName = (p) => {
  if (!p) return ''
  const s = String(p)
  const i = s.lastIndexOf('/')
  return i >= 0 ? s.slice(i + 1) : s
}

function SettingsDrawer({ model, isOpen, onOpenChange }) {
  const [activeTab, setActiveTab] = useState('expressions')
  const [currentExpression, setCurrentExpression] = useState(null)     // string | null (Name)
  const [currentMotion, setCurrentMotion] = useState(null)             // {group, index} | null
  const [exclusiveGuard, setExclusiveGuard] = useState(true)           // 防重叠开关（默认开）

  // 读 runtime settings（自动生成 UI）
  const runtime = useMemo(() => {
    if (!model) return null
    const s = model.internalModel?.settings
    return s ? {
      motions: s.motions || {},                // { group: [{File,...}, ...] }
      expressions: s.expressions || [],        // [{Name, File}]
      parameters: s.parameters || [],
    } : null
  }, [model])

  const totalMotionCount = useMemo(() => {
    if (!runtime) return 0
    return Object.values(runtime.motions).reduce((sum, arr) => sum + (arr?.length || 0), 0)
  }, [runtime])

  // —— 强力“重置” —— //
  const strongReset = async () => {
    if (!model) return
    try {
      const mm = model.internalModel?.motionManager
      // 1) 停掉所有动作
      if (mm?.stopAllMotions) mm.stopAllMotions()
      else if (mm?.stopAll) mm.stopAll()

      // 2) 清表情（优先 expressionManager，其次便捷 API）
      const em = mm?.expressionManager
      try {
        if (em?.setExpression) {
          const ret = em.setExpression(null)
          if (typeof ret?.then === 'function') await ret
        } else if (typeof model.expression === 'function') {
          const ret = model.expression(null)
          if (typeof ret?.then === 'function') await ret
        }
      } catch {}

      // 3) 关键参数兜底（防嘴/眼残留）
      const core = model.internalModel?.coreModel
      if (core) {
        const set = (id, val) => {
          try { core.setParameterValueById(id, val) } catch {}
        }
        set('ParamEyeLOpen', 1)
        set('ParamEyeROpen', 1)
        set('ParamMouthForm', 0)
        set('ParamMouthOpenY', 0)
        // 可按需再加：眉/脸红/身体角度等（不同模型未必都有，try-catch 即可）
      }

      // 4) 触发一次 Idle 将姿态拉回基线（若模型有 Idle 组）
      if (runtime?.motions?.Idle?.length && typeof model.motion === 'function') {
        try {
          const ret = model.motion('Idle', 0, MotionPriority.FORCE)
          if (typeof ret?.then === 'function') await ret
        } catch {}
      }

      setCurrentExpression(null)
      setCurrentMotion(null)
      console.log('✅ 强力重置完成')
    } catch (e) {
      console.error('❌ 重置异常:', e)
    }
  }

  // —— 表情 —— //
  const playExpression = async (name) => {
    if (!model || !runtime) return
    try {
      // 如果是“姿态类表情”，开启防重叠时先停动作
      if (exclusiveGuard && EXCLUSIVE_EXP_RE.test(name)) {
        const mm = model.internalModel?.motionManager
        if (mm?.stopAllMotions) mm.stopAllMotions()
        else if (mm?.stopAll) mm.stopAll()
        await new Promise(r => setTimeout(r, 50))
        setCurrentMotion(null)
      }

      let ok = false
      if (typeof model.expression === 'function') {
        const ret = model.expression(name) // 传 Name
        ok = typeof ret?.then === 'function' ? await ret : ret !== false
      }
      if (!ok && model.internalModel?.motionManager?.expressionManager) {
        const em = model.internalModel.motionManager.expressionManager
        if (typeof em.setExpression === 'function') {
          const ret = em.setExpression(name)
          ok = typeof ret?.then === 'function' ? await ret : ret !== false
        }
      }

      if (ok) {
        setCurrentExpression(name)
        console.log('✅ 表情播放:', name)
      } else {
        console.warn('⚠️ 表情未找到/未生效:', name)
      }
    } catch (e) {
      console.error('❌ 表情播放异常:', e)
    }
  }

  // —— 动作 —— //
  const playMotion = async (group, index) => {
    if (!model || !runtime) return
    try {
      // 若当前表情是“姿态类”，且开启防重叠：先清表情
      if (exclusiveGuard && currentExpression && EXCLUSIVE_EXP_RE.test(currentExpression)) {
        const mm = model.internalModel?.motionManager
        const em = mm?.expressionManager
        try {
          if (em?.setExpression) {
            const ret = em.setExpression(null)
            if (typeof ret?.then === 'function') await ret
          } else if (typeof model.expression === 'function') {
            const ret = model.expression(null)
            if (typeof ret?.then === 'function') await ret
          }
        } catch {}
        await new Promise(r => setTimeout(r, 50))
        setCurrentExpression(null)
      }

      if (typeof model.motion !== 'function') {
        console.error('❌ 当前模型不支持 model.motion')
        return
      }
      const ret = model.motion(group, index, MotionPriority.FORCE)
      const ok = typeof ret?.then === 'function' ? await ret : ret !== false
      if (ok) {
        setCurrentMotion({ group, index })
        console.log('✅ 动作播放:', group, index)
      } else {
        console.warn('⚠️ 动作播放失败:', group, index)
      }
    } catch (e) {
      console.error('❌ 动作播放异常:', e)
    }
  }

  // —— UI —— //
  const runtimeInfo = runtime
    ? `表情 ${runtime.expressions.length || 0} • 动作 ${totalMotionCount} • 参数 ${runtime.parameters.length || 0}`
    : '未加载模型'

  return (
    <>
      {/* 触发按钮（如果 App 里已有可移除） */}
      <button
        onClick={() => onOpenChange(true)}
        className="fixed top-4 right-4 z-50 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110"
        title="设置"
      >
        <Settings size={20} />
      </button>

      <Drawer.Root open={isOpen} onOpenChange={onOpenChange} direction="right">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/0 z-40" />
          <Drawer.Content className="bg-gray-900 text-white flex flex-col rounded-l-[10px] h-full w-[420px] mt-0 fixed bottom-0 right-0 z-50">
            {/* 头部 */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={20} />
                <Drawer.Title className="text-lg font-semibold">Live2D 设置</Drawer.Title>
              </div>
              <button onClick={() => onOpenChange(false)} className="p-1 hover:bg-gray-700 rounded">
                <X size={18} />
              </button>
            </div>
            <Drawer.Description className="sr-only">Live2D 模型设置面板</Drawer.Description>

            {/* 标签 */}
            <div className="flex border-b border-gray-700">
              {[
                { id: 'expressions', icon: <Smile size={16} className="inline mr-2" />, label: '表情' },
                { id: 'motions', icon: <Play size={16} className="inline mr-2" />, label: '动作' },
                { id: 'lipsync', icon: <Volume2 size={16} className="inline mr-2" />, label: '口型' },
                { id: 'parameters', icon: <Sliders size={16} className="inline mr-2" />, label: '参数' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* 内容 */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'expressions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">表情控制</h3>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-300 flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={exclusiveGuard}
                          onChange={(e) => setExclusiveGuard(e.target.checked)}
                        />
                        防重叠
                      </label>
                      <button onClick={strongReset} className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                        <RotateCcw size={14} /> 重置
                      </button>
                    </div>
                  </div>

                  {currentExpression && (
                    <div className="p-3 bg-blue-600/20 border border-blue-500 rounded-lg text-sm text-blue-200">
                      当前表情：{currentExpression}
                    </div>
                  )}

                  {!runtime?.expressions?.length && (
                    <div className="text-sm text-gray-400">当前模型没有提供 Expressions。</div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {runtime?.expressions?.map((e) => (
                      <button
                        key={e.Name || e.name}
                        onClick={() => playExpression(e.Name || e.name)}
                        className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                          currentExpression === (e.Name || e.name)
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-200'
                        }`}
                      >
                        <div className="text-sm font-medium">{e.Name || e.name}</div>
                        <div className="text-xs opacity-70 mt-1">{baseName(e.File)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'motions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">动作控制</h3>
                    <button onClick={strongReset} className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                      <RotateCcw size={14} /> 重置
                    </button>
                  </div>

                  {!runtime || !Object.keys(runtime.motions).length ? (
                    <div className="text-sm text-gray-400">当前模型没有提供 Motions。</div>
                  ) : (
                    Object.entries(runtime.motions).map(([group, arr]) => (
                      <div key={group} className="space-y-2">
                        <h4 className="text-md font-medium text-blue-300 flex items-center gap-2">
                          <ChevronRight size={16} /> {groupDisplayName(group)}
                          <span className="text-xs text-gray-400 ml-2">({arr.length})</span>
                        </h4>

                        <div className="grid grid-cols-1 gap-2 ml-4">
                          {arr.map((m, index) => {
                            const file = m?.File || m?.file
                            const disp = baseName(file) || `#${index}`
                            const active = currentMotion && currentMotion.group === group && currentMotion.index === index
                            return (
                              <button
                                key={`${group}-${index}-${file || ''}`}
                                onClick={() => playMotion(group, index)}
                                className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                                  active
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-200'
                                }`}
                              >
                                <span className="text-sm font-medium">{disp}</span>
                                <span className="text-xs opacity-70">{group} · {index}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'lipsync' && (
                <LipSyncPanel model={model} isModelLoaded={!!model} />
              )}

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

            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <div className="text-xs text-gray-400 text-center">
                {runtime ? `表情 ${runtime.expressions.length || 0} • 动作 ${totalMotionCount} • 参数 ${runtime.parameters.length || 0}` : '未加载模型'}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}

export default SettingsDrawer
