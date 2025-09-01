import {useState, useEffect} from 'react'
import {useVoiceStore} from './stores/voiceStore'
import {WebSocketProvider} from './contexts/WebSocketContext'
import {ToastProvider, useToast} from './components/ui/toast'
import {useUserAuthStore} from './stores/userAuthStore'
import {useLive2DModel} from './hooks/useLive2DModel'
import {useViewport} from './hooks/useViewport'
import Live2DViewer from './components/Live2DViewer'
// import SettingsDrawer from './components/SettingsDrawer'
import SidebarDrawer from './components/SidebarDrawer'
import RightDrawer from './components/RightDrawer'
import VoiceSelector from './components/VoiceSelector'
import SpeedControl from './components/SpeedControl'
import ASRSelector from './components/ASRSelector'
import ConversationStage from './components/ConversationStage'
import ConversationStageInfo from './components/ConversationStageInfo'
import ConversionActivity from './components/ConversionActivity'
import UserProfile from './components/UserProfile'
import ProactiveChatControl from './components/ProactiveChatControl'
import SystemControl from './components/SystemControl'
import UserInfoCard from './components/UserInfoCard'
import LoginDialog from './components/LoginDialog'
import SwitchUserDialog from './components/SwitchUserDialog'
import WebSocketStatus from './components/WebSocketStatus'
import WorkingChatInterface from './components/WorkingChatInterface'
// 内部组件用于注册Toast函数
const AppContent = () => {
  // const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // 使用 Live2D 模型管理 Hook
  const {
    currentModel,
    pixiApp,
    modelInfo,
    handleModelLoad,
    handleModelError,
    isModelLoaded,
    isAppReady
  } = useLive2DModel()

  // 获取用户认证初始化函数
  const initializeUserSystem = useUserAuthStore(state => state.initializeUserSystem)
  const {width, height} = useViewport()
  const {registerToast} = useVoiceStore()
  const {addToast} = useToast()

  // 应用启动时初始化用户认证系统
  useEffect(() => {
    console.log('🚀 App 启动，初始化用户系统 认证系统')
    initializeUserSystem()
  }, [initializeUserSystem])

  // 注册Toast函数到VoiceContext
  useEffect(() => {
    registerToast(addToast)
  }, [registerToast, addToast])
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

      {/* 主聊天界面 */}
      <div className="absolute top-4 right-4 w-96 h-[calc(100vh-2rem)] z-10">
        <WorkingChatInterface
          enableFileUpload={true}
          enableASR={true}
          className="h-full bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border"
        />
      </div>

      {/*<SettingsDrawer
        model={currentModel}
        app={pixiApp}         // ← 需要就把 app 也给到
        info={modelInfo}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />*/}

      <SidebarDrawer>
        <UserInfoCard/>
        <WebSocketStatus/>
        <SystemControl/>
        <ProactiveChatControl/>
        <VoiceSelector/>
        <SpeedControl/>
        <ASRSelector/>
        <ConversationStage/>
      </SidebarDrawer>

      {/* 右侧抽屉组件 */}
      <RightDrawer>
        <UserProfile/>
        <ConversationStageInfo />
        <ConversionActivity />
      </RightDrawer>

      {/* 用户认证对话框 */}
      <LoginDialog />
      <SwitchUserDialog />

    </div>
  )
}
// 主App组件
function App() {
  return (
    <WebSocketProvider>
      <ToastProvider>
        <AppContent/>
      </ToastProvider>
    </WebSocketProvider>
  )
}
export default App
