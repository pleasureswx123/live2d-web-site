import { useState, useEffect, useRef } from 'react'
import Live2DViewer from './components/Live2DViewer'
import SettingsDrawer from './components/SettingsDrawer'

// 自适应窗口尺寸（含 dpr 改变时的刷新）
function useViewport() {
  const getSize = () => ({
    width: Math.max(1, window.innerWidth),
    height: Math.max(1, window.innerHeight),
  })
  const [size, setSize] = useState(getSize)

  useEffect(() => {
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setSize(getSize()))
    }
    window.addEventListener('resize', onResize)
    // 有些设备 dpr 变化不会触发 resize，这里也监听一下
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    mq.addEventListener?.('change', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      mq.removeEventListener?.('change', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return size
}

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentModel, setCurrentModel] = useState(null)
  const [pixiApp, setPixiApp] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  const { width, height } = useViewport()

  // 处理模型加载
  const handleModelLoad = (model, app, info) => {
    setCurrentModel(model)
    setPixiApp(app)
    setModelInfo(info)
    console.log('📦 模型实例已传递给 App 组件:', info)
  }

  // 处理模型加载错误
  const handleModelError = (error) => {
    console.error('❌ 模型加载失败:', error)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900">
      <Live2DViewer
        modelPath="/models/youyou/youyou.model3.json"
        width={width}
        height={height}
        onModelLoad={handleModelLoad}
        onError={handleModelError}
        className="absolute inset-0"
      />

      <SettingsDrawer
        model={currentModel}
        app={pixiApp}         // ← 需要就把 app 也给到
        info={modelInfo}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />

      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed top-4 right-4 z-50 p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow-lg transition-colors"
        title="打开设置"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
        </svg>
      </button>
    </div>
  )
}

export default App
