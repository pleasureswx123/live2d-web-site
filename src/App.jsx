import { useState, useEffect, useRef } from 'react'
import Live2DViewer from './components/Live2DViewer'
import SettingsDrawer from './components/SettingsDrawer'
import TTSChat from './components/TTSChat'
import IconNavigation from './components/IconNavigation'
import DrawerContainer from './components/DrawerContainer'
import Live2DStatus from './components/Live2DStatus'
import { useWebSocket } from './hooks/useWebSocket'
import { useChatStore } from './stores/chatStore'
import { useLive2DChat } from './hooks/useLive2DChat'
import { useProactiveChat } from './hooks/useProactiveChat'

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

  // 初始化WebSocket连接
  const { isConnected } = useWebSocket('ws://localhost:8000/ws')
  const { currentUserName } = useChatStore()

  // 初始化Live2D聊天集成
  const { setEmotion, playMotion, currentEmotion, currentMotion } = useLive2DChat(currentModel, pixiApp)

  // 初始化主动对话
  useProactiveChat()

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

      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/video/live2d_bg.mp4" type="video/mp4"/>
      </video>

      <Live2DViewer
        modelPath="/models/youyou/youyou.model3.json"
        width={width}
        height={height}
        onModelLoad={handleModelLoad}
        onError={handleModelError}
        className="absolute inset-0"
      />

      {/* TTS聊天组件 - 已集成主WebSocket系统 */}
      {currentModel && pixiApp && (
        <TTSChat model={currentModel} app={pixiApp}/>
      )}

      {/* 新的图标导航系统 */}
      <IconNavigation />

      {/* 新的抽屉容器系统 */}
      <DrawerContainer />

      {/* 保留原有的设置抽屉 */}
      <SettingsDrawer
        model={currentModel}
        app={pixiApp}
        info={modelInfo}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />

      {/* Live2D设置按钮 - 避免与用户状态重叠 */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-xl transition-all duration-300 hover:scale-105 group"
        title="Live2D设置"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:rotate-90 transition-transform duration-300">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
        </svg>
      </button>

      {/* Live2D状态显示 */}
      <Live2DStatus
        currentEmotion={currentEmotion}
        currentMotion={currentMotion}
        model={currentModel}
      />

      {/* 用户状态指示器 - 调整位置避免重叠 */}
      {currentUserName && (
        <div className="fixed bottom-6 right-32 z-40 bg-white/90 backdrop-blur-md rounded-xl px-4 py-3 text-sm shadow-lg border border-white/20">
          <span className="text-gray-700 font-medium">👋 你好，{currentUserName}</span>
        </div>
      )}
    </div>
  )
}
export default App
