import { useState, useCallback, useEffect, useRef } from 'react'
import { Stage, useApp } from '@pixi/react'
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch/cubism4'
import * as PIXI from 'pixi.js'
import SettingsDrawer from './components/SettingsDrawer'

// 确保 PIXI 在全局可用
if (typeof window !== 'undefined') {
  window.PIXI = PIXI
}

// Live2D 组件，在 Stage 内部使用 useApp
function Live2DComponent({ onModelLoad, onError, onModelReady }) {
  const app = useApp()

  useEffect(() => {
    let mounted = true

    async function loadModel() {
      try {
        console.log('🖼️ PIXI App 获取成功', app)

        // 检查 Live2D Core 是否加载
        if (typeof window.Live2DCubismCore === 'undefined') {
          throw new Error('Live2D Cubism Core 未加载')
        }

        console.log('📥 开始加载 Live2D 模型')
        const model = await Live2DModel.from('/models/youyou/youyou.model3.json')

        if (!mounted) return

        // 等待模型完全初始化
        await new Promise(resolve => {
          if (model.internalModel) {
            resolve()
          } else {
            model.once('ready', resolve)
          }
        })

        // 配置模型
        const screenWidth = window.innerWidth
        const screenHeight = window.innerHeight
        const scale = Math.min(screenWidth / model.width, screenHeight / model.height) * 0.8

        model.scale.set(scale)
        model.x = screenWidth / 2
        model.y = screenHeight / 2
        model.anchor.set(0.5, 0.5)
        model.autoInteract = true

        // 添加到舞台
        app.stage.addChild(model)

        // 添加点击交互
        model.on('hit', (hitAreas) => {
          console.log('🎯 模型被点击')
          model.motion('TapBody', 0, 3)
        })

        // 获取模型信息 - 使用已知的正确数量
        // 注意: pixi-live2d-display 的内部 API 可能在模型加载时还未完全初始化
        // 表情和动作管理器，所以我们使用配置文件中的已知数量

        const parameterCount = model.internalModel?.coreModel?.getParameterCount() || 0

        // 基于 youyou.model3.json 配置文件的实际数量
        const info = {
          name: '悠悠',
          expressions: 20, // 从 aojiao 到 guilian，共20个表情
          motions: 7,      // Idle(2) + TapBody(3) + TapHead(2) = 7个动作
          parameters: parameterCount
        }

        console.log('📊 模型信息:', {
          ...info,
          expressionList: [
            'aojiao', 'chayao', 'hahadaxiao', 'weiqu', 'haixiu',
            'jingxi', 'jingya', 'tuosai', 'baoxiong', 'huishou',
            'wenroudexiao', 'shengqi', 'diannao', 'diannaofaguang',
            'mimiyan', 'yanlei', 'lianhong', 'luolei', 'jianpantaiqi', 'guilian'
          ],
          motionGroups: {
            'Idle': 2,      // sleep, jichudonghua
            'TapBody': 3,   // huishou, diantou, yaotou
            'TapHead': 2    // yanzhuzi, shuijiao
          }
        })

        onModelLoad(info)
        onModelReady(model) // 传递模型实例给父组件
        console.log('✅ Live2D 模型加载成功')

      } catch (err) {
        console.error('❌ Live2D 模型加载失败:', err)
        onError(err.message)
      }
    }

    loadModel()

    return () => {
      mounted = false
    }
  }, [app, onModelLoad, onError, onModelReady])

  return null // 这个组件不渲染任何 JSX
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [modelInfo, setModelInfo] = useState(null)
  const [error, setError] = useState(null)
  const [model, setModel] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleModelLoad = useCallback((info) => {
    setModelInfo(info)
    setIsLoading(false)
  }, [])

  const handleError = useCallback((errorMessage) => {
    setError(errorMessage)
    setIsLoading(false)
  }, [])

  const handleModelReady = useCallback((modelInstance) => {
    setModel(modelInstance)
    console.log('🎭 模型实例已准备就绪，可以进行控制')
  }, [])

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-80 z-10">
        <div className="text-center text-white max-w-md px-4">
          <div className="text-2xl mb-4">❌ 加载失败</div>
          <div className="text-sm opacity-90 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900">
      {/* PIXI Stage with Live2D */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        options={{
          backgroundColor: 0x1a1a1a,
          backgroundAlpha: 1,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        }}
        className="absolute inset-0 w-full h-full cursor-pointer"
      >
        <Live2DComponent
          onModelLoad={handleModelLoad}
          onError={handleError}
          onModelReady={handleModelReady}
        />
      </Stage>

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-10">
          <div className="text-center text-white">
            <div className="text-2xl mb-4">🎭 加载 Live2D 模型中...</div>
            <div className="text-sm opacity-70">
              正在使用 @pixi/react 初始化悠悠模型...
            </div>
          </div>
        </div>
      )}

      {/* 模型信息显示 */}
      {modelInfo && !isLoading && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white p-4 rounded-lg z-10">
          <h3 className="font-bold text-lg mb-2">{modelInfo.name}</h3>
          <div className="text-sm space-y-1">
            <div>表情: {modelInfo.expressions} 个</div>
            <div>动作: {modelInfo.motions} 个</div>
            <div>参数: {modelInfo.parameters} 个</div>
            <div>渲染: @pixi/react v7.1.2</div>
          </div>
        </div>
      )}

      {/* 操作提示 */}
      {!isLoading && !error && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white p-4 rounded-lg z-10">
          <div className="text-sm">
            <div className="font-semibold mb-2">💡 操作提示</div>
            <div>• 点击模型与悠悠互动</div>
            <div>• 使用 @pixi/react 渲染</div>
            <div>• PIXI.js v7.4.3 + Live2D</div>
          </div>
        </div>
      )}

      {/* 设置抽屉 */}
      <SettingsDrawer
        model={model}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  )
}

export default App
