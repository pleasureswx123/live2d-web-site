import React from 'react'
import { useSystemStore } from '../stores/systemStore'
import { useChatStore } from '../stores/chatStore'
import { useUserProfileStore } from '../stores/userProfileStore'
import { useVoiceStore } from '../stores/voiceStore'

// 图标组件 - 参考test.html控制面板风格
const IconButton = ({ icon, label, isActive, onClick, position = 'left', hasNotification = false }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative group p-4 rounded-xl transition-all duration-300
        ${isActive
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl scale-105 ring-2 ring-blue-300'
          : 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-lg hover:scale-105 hover:ring-2 hover:ring-blue-200'
        }
        backdrop-blur-md border border-white/30 shadow-lg
        min-w-[56px] min-h-[56px] flex items-center justify-center
      `}
      title={label}
    >
      <span className="text-2xl">{icon}</span>
      {hasNotification && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white">
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
        </div>
      )}

      {/* 悬浮提示 */}
      <div className={`
        absolute ${position === 'left' ? 'left-full ml-3' : 'right-full mr-3'} top-1/2 -translate-y-1/2
        bg-gray-900 text-white text-sm px-3 py-2 rounded-lg
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
        pointer-events-none whitespace-nowrap z-50
        before:absolute before:top-1/2 before:-translate-y-1/2
        ${position === 'left'
          ? 'before:-left-1 before:border-r-gray-900 before:border-r-4 before:border-y-transparent before:border-y-4 before:border-l-0'
          : 'before:-right-1 before:border-l-gray-900 before:border-l-4 before:border-y-transparent before:border-y-4 before:border-r-0'
        }
      `}>
        {label}
      </div>
    </button>
  )
}

// 主导航组件
export const IconNavigation = () => {
  const { ui, toggleDrawer, settings } = useSystemStore()
  const { isConnected, messages } = useChatStore()
  const { profile, conversationStage } = useUserProfileStore()
  const { asr, tts } = useVoiceStore()

  // 左侧图标配置
  const leftIcons = [
    {
      id: 'chat',
      icon: '💬',
      label: '对话记录',
      hasNotification: messages.length > 0 && !isConnected
    },
    {
      id: 'profile',
      icon: '👤',
      label: '用户档案',
      hasNotification: profile.completionPercentage < 100
    },
    {
      id: 'voice',
      icon: '🎤',
      label: '语音设置',
      hasNotification: asr.isRecording || tts.isSpeaking
    },
    {
      id: 'system',
      icon: '⚙️',
      label: '系统设置',
      hasNotification: false
    }
  ]

  // 右侧图标配置
  const rightIcons = [
    {
      id: 'control',
      icon: '🎛️',
      label: '控制面板',
      hasNotification: !isConnected || !settings.deepThinking
    },
    {
      id: 'activity',
      icon: '📊',
      label: '活动面板',
      hasNotification: profile.completionPercentage < 100
    },
    {
      id: 'stage',
      icon: '🎭',
      label: '对话阶段',
      hasNotification: conversationStage.current > 1
    },
    {
      id: 'sync',
      icon: '🔄',
      label: '同步状态',
      hasNotification: !isConnected
    }
  ]

  return (
    <>
      {/* 左侧图标组 - 参考test.html侧边栏布局 */}
      <div className="fixed top-6 left-6 z-50 flex flex-col gap-4">
        {leftIcons.map((iconConfig) => (
          <IconButton
            key={iconConfig.id}
            icon={iconConfig.icon}
            label={iconConfig.label}
            isActive={ui.activeDrawer === iconConfig.id}
            onClick={() => toggleDrawer(iconConfig.id)}
            position="left"
            hasNotification={iconConfig.hasNotification}
          />
        ))}
      </div>

      {/* 右侧图标组 - 避免与Live2D设置按钮重叠 */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-4">
        {rightIcons.map((iconConfig) => (
          <IconButton
            key={iconConfig.id}
            icon={iconConfig.icon}
            label={iconConfig.label}
            isActive={ui.activeDrawer === iconConfig.id}
            onClick={() => toggleDrawer(iconConfig.id)}
            position="right"
            hasNotification={iconConfig.hasNotification}
          />
        ))}
      </div>

      {/* 连接状态指示器 - 参考test.html样式 */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40">
        <div className={`
          px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
          ${isConnected
            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
            : 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse shadow-lg'
          }
          backdrop-blur-md border border-white/20
        `}>
          {isConnected ? '🟢 已连接' : '🔴 未连接'}
        </div>
      </div>
    </>
  )
}

export default IconNavigation
