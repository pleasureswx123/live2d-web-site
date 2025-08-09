import React from 'react'
import { useUserProfileStore } from '../../stores/userProfileStore'
import { useWebSocket, MESSAGE_TYPES } from '../../hooks/useWebSocket'

const ConversationStageDrawer = () => {
  const {
    conversationStage,
    setConversationStage,
    setManualStageControl,
    getCurrentStageDescription
  } = useUserProfileStore()

  const { sendMessage } = useWebSocket()

  // 处理手动阶段切换
  const handleStageChange = (stageId) => {
    setConversationStage(stageId, true)
    sendMessage({
      type: MESSAGE_TYPES.MANUAL_STAGE_CHANGE,
      stage: stageId
    })
  }

  // 处理重置为自动模式
  const handleResetToAuto = () => {
    setManualStageControl(false)
    sendMessage({
      type: MESSAGE_TYPES.RESET_STAGE_AUTO
    })
  }

  const stages = [
    { id: 1, name: '初识', icon: '👋', color: 'gray' },
    { id: 2, name: '了解', icon: '🤝', color: 'blue' },
    { id: 3, name: '新朋友', icon: '😊', color: 'green' },
    { id: 4, name: '普通朋友', icon: '😄', color: 'yellow' },
    { id: 5, name: '暧昧', icon: '😍', color: 'pink' },
    { id: 6, name: '恋爱', icon: '💕', color: 'red' }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">🎭</div>
        <div className="text-lg font-medium">对话阶段</div>
        <div className="text-gray-600 text-sm">管理对话关系阶段</div>
      </div>

      {/* 当前阶段 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-center">
          <div className="text-3xl mb-2">
            {stages.find(s => s.id === conversationStage.current)?.icon}
          </div>
          <div className="font-medium text-blue-700">
            阶段 {conversationStage.current}: {stages.find(s => s.id === conversationStage.current)?.name}
          </div>
          <div className="text-blue-600 text-sm mt-2">
            {getCurrentStageDescription()}
          </div>
        </div>
      </div>

      {/* 阶段选择 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">选择阶段</h3>
        <div className="grid grid-cols-2 gap-2">
          {stages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => handleStageChange(stage.id)}
              className={`
                p-3 rounded-lg border transition-all
                ${conversationStage.current === stage.id
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                }
              `}
            >
              <div className="text-lg">{stage.icon}</div>
              <div className="text-sm font-medium">{stage.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">统计信息</h3>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between text-sm">
            <span>对话轮数:</span>
            <span className="font-medium">{conversationStage.conversationCount}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span>控制模式:</span>
            <span className="font-medium">
              {conversationStage.isManual ? '手动' : '自动'}
            </span>
          </div>
        </div>
      </div>

      {/* 控制选项 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">控制选项</h3>
        <button
          onClick={conversationStage.isManual ? handleResetToAuto : () => setManualStageControl(true)}
          className={`
            w-full p-3 rounded-lg transition-colors
            ${conversationStage.isManual
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700'
            }
          `}
        >
          {conversationStage.isManual ? '切换到自动模式' : '切换到手动模式'}
        </button>
      </div>
    </div>
  )
}

export default ConversationStageDrawer
