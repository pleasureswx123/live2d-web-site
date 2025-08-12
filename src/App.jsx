import {useState, useEffect, useRef} from 'react'
import {VoiceProvider, useVoice} from './contexts/VoiceContext'
import {ToastProvider, useToast} from './components/ui/toast'
import Live2DViewer from './components/Live2DViewer'
import SettingsDrawer from './components/SettingsDrawer'
import SidebarDrawer from './components/SidebarDrawer'
import RightDrawer from './components/RightDrawer'
import VoiceSelector from './components/VoiceSelector'
import SpeedControl from './components/SpeedControl'
import ASRSelector from './components/ASRSelector'
import ConversationStage from './components/ConversationStage'
import ConversationStageInfo from './components/ConversationStageInfo'
import ConversionActivity from './components/ConversionActivity'
import TTSChat from './components/TTSChat'
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
// 内部组件用于注册Toast函数
const AppContent = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentModel, setCurrentModel] = useState(null)
  const [pixiApp, setPixiApp] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  const {width, height} = useViewport()
  const {registerToast, changeStage} = useVoice()
  const {addToast} = useToast()
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (hasInitialized.current) {
      console.log('💬 对话阶段组件初始化已跳过（已执行过）')
      return
    }
    changeStage('initial_meeting')
    hasInitialized.current = true
    console.log('💬 对话阶段组件已初始化，设置为初识阶段')
  }, [])
  // 注册Toast函数到VoiceContext
  useEffect(() => {
    registerToast(addToast)
  }, [registerToast, addToast])
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

      {currentModel && pixiApp && (
        <TTSChat model={currentModel} app={pixiApp} wsUrl={"ws://localhost:8000/tts"}/>
      )}

      <SettingsDrawer
        model={currentModel}
        app={pixiApp}         // ← 需要就把 app 也给到
        info={modelInfo}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />

      <SidebarDrawer>
        <VoiceSelector/>
        <div className="mt-6">
          <SpeedControl/>
        </div>
        <div className="mt-6">
          <ASRSelector/>
        </div>
        <div className="mt-6">
          <ConversationStage/>
        </div>
      </SidebarDrawer>

      {/* 右侧抽屉组件 */}
      <RightDrawer>
        <ConversationStageInfo />
        <div className="mt-6">
          <ConversionActivity />
        </div>
      </RightDrawer>

    </div>
  )
}
// 主App组件
function App() {
  return (
    <VoiceProvider>
      <ToastProvider>
        <AppContent/>
      </ToastProvider>
    </VoiceProvider>
  )
}
export default App
