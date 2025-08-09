import React from 'react'
import { useSystemStore } from '../stores/systemStore'

// 抽屉基础组件
export const DrawerBase = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'left',
  width = 400
}) => {
  if (!isOpen) return null

  const isLeft = position === 'left'

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* 抽屉内容 */}
      <div className={`
        fixed top-0 ${isLeft ? 'left-0' : 'right-0'} h-full z-50
        bg-white/95 backdrop-blur-md shadow-2xl
        transform transition-transform duration-300 ease-out
        border-r border-white/20
      `}
      style={{ width: `${width}px` }}>

        {/* 抽屉头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100/50 transition-colors"
          >
            <span className="text-gray-500">✕</span>
          </button>
        </div>

        {/* 抽屉内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 h-[calc(100vh-80px)]">
          {children}
        </div>
      </div>
    </>
  )
}

// 抽屉容器管理器
export const DrawerContainer = () => {
  const { ui, closeAllDrawers } = useSystemStore()

  // 动态导入抽屉组件
  const getDrawerComponent = (drawerType) => {
    switch (drawerType) {
      case 'chat':
        return React.lazy(() => import('./drawers/ChatDrawer'))
      case 'profile':
        return React.lazy(() => import('./drawers/UserProfileDrawer'))
      case 'voice':
        return React.lazy(() => import('./drawers/VoiceSettingsDrawer'))
      case 'system':
        return React.lazy(() => import('./drawers/SystemSettingsDrawer'))
      case 'control':
        return React.lazy(() => import('./ControlPanel'))
      case 'activity':
        return React.lazy(() => import('./ActivityPanel'))
      case 'stage':
        return React.lazy(() => import('./drawers/ConversationStageDrawer'))
      case 'sync':
        return React.lazy(() => import('./drawers/SyncStatusDrawer'))
      default:
        return null
    }
  }

  // 获取抽屉配置
  const getDrawerConfig = (drawerType) => {
    const configs = {
      chat: { title: '💬 对话记录', position: 'left' },
      profile: { title: '👤 用户档案', position: 'left' },
      voice: { title: '🎤 语音设置', position: 'left' },
      system: { title: '⚙️ 系统设置', position: 'left' },
      control: { title: '🎛️ 控制面板', position: 'left', width: 400 },
      activity: { title: '📊 活动面板', position: 'right', width: 450 },
      stage: { title: '🎭 对话阶段', position: 'right' },
      sync: { title: '🔄 同步状态', position: 'right' }
    }
    return configs[drawerType] || { title: '未知', position: 'left' }
  }

  if (!ui.activeDrawer) return null

  const DrawerComponent = getDrawerComponent(ui.activeDrawer)
  const config = getDrawerConfig(ui.activeDrawer)

  if (!DrawerComponent) return null

  // 控制面板和活动面板使用全屏模式
  if (ui.activeDrawer === 'control' || ui.activeDrawer === 'activity') {
    return (
      <React.Suspense fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      }>
        <DrawerComponent
          isOpen={ui.isAnyDrawerOpen}
          onClose={closeAllDrawers}
        />
      </React.Suspense>
    )
  }

  // 其他抽屉使用标准抽屉模式
  return (
    <DrawerBase
      isOpen={ui.isAnyDrawerOpen}
      onClose={closeAllDrawers}
      title={config.title}
      position={config.position}
      width={config.width || ui.drawerWidth}
    >
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      }>
        <DrawerComponent />
      </React.Suspense>
    </DrawerBase>
  )
}

export default DrawerContainer
