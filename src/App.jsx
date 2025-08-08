import { useState, useEffect, useRef } from 'react'
import { Stage, useApp } from '@pixi/react'
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch/cubism4'
import * as PIXI from 'pixi.js'
import SettingsDrawer from './components/SettingsDrawer'

// 确保 PIXI 在全局可用 (官方要求)
if (typeof window !== 'undefined') {
  window.PIXI = PIXI

  // 注册 Ticker 用于自动更新 Live2D 模型 (官方推荐)
  Live2DModel.registerTicker(PIXI.Ticker)

  // 抑制特定的 PixiJS 弃用警告
  const originalGroupCollapsed = console.groupCollapsed
  const originalWarn = console.warn
  const originalGroupEnd = console.groupEnd

  console.groupCollapsed = function(...args) {
    const message = args.join(' ')
    if (message.includes('PixiJS Deprecation Warning') && message.includes('utils.url.resolve')) {
      // 忽略 utils.url.resolve 弃用警告组
      return
    }
    originalGroupCollapsed.apply(console, args)
  }

  console.warn = function(...args) {
    const message = args.join(' ')
    if (message.includes('utils.url.resolve is deprecated') ||
        message.includes('Deprecated since v7.3.0') ||
        message.includes('_Cubism4ModelSettings.resolveURL')) {
      // 忽略 utils.url.resolve 相关的弃用警告
      return
    }
    originalWarn.apply(console, args)
  }

  console.groupEnd = function(...args) {
    // 抑制与弃用警告相关的 groupEnd
    // 这样可以避免孤立的 [ENDGROUP] 消息
    const stack = new Error().stack
    if (stack && stack.includes('resolveURL')) {
      return
    }
    originalGroupEnd.apply(console, args)
  }
}

// Live2D 组件
function Live2DComponent({ onModelLoad }) {
  const app = useApp()
  const [model, setModel] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function loadModel() {
      try {
        setIsLoading(true)
        setError(null)

        console.log('🖼️ PIXI App 获取成功')
        console.log('📥 开始加载 Live2D 模型')

        // 加载 Live2D 模型
        const model = await Live2DModel.from('/models/youyou/youyou.model3.json')

        if (!mounted) return

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
          console.log('🎯 模型被点击:', hitAreas)
          if (hitAreas.includes('body')) {
            model.motion('tap_body')
          }
        })

        setModel(model)
        console.log('✅ Live2D 模型加载成功')

        // 通知父组件模型已加载
        if (onModelLoad) {
          onModelLoad(model)
        }

      } catch (err) {
        console.error('❌ Live2D 模型加载失败:', err)
        setError(err.message)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadModel()

    return () => {
      mounted = false
      if (model) {
        app.stage.removeChild(model)
        model.destroy()
      }
    }
  }, [app])

  return null // 这个组件不渲染任何 React 元素
}



function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentModel, setCurrentModel] = useState(null)

  // 检查 Live2D Core 是否加载
  useEffect(() => {
    if (typeof window.Live2DCubismCore === 'undefined') {
      console.error('Live2D Cubism Core 未加载，请确保在 HTML 中引入了 live2dcubismcore.min.js')
    }
  }, [])

  // 处理模型加载
  const handleModelLoad = (model) => {
    setCurrentModel(model)
    console.log('📦 模型实例已传递给 App 组件')
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900">
      {/* 使用 @pixi/react 的 Stage 组件 */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        options={{
          backgroundColor: 0x1a1a1a,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        }}
      >
        <Live2DComponent onModelLoad={handleModelLoad} />
      </Stage>

      {/* 设置抽屉 */}
      <SettingsDrawer
        model={currentModel}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  )
}

export default App
