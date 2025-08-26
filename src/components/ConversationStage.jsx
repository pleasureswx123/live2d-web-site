import { useEffect, useRef } from 'react'
import { useVoiceStore } from '../stores/voiceStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const ConversationStage = () => {
  const {
    conversationStage,
    stageNames,
    changeStage,
    getCurrentStageName,
    isManualStageControl
  } = useVoiceStore()

  // 处理阶段切换
  const handleStageChange = (selectedStage) => {
    changeStage(selectedStage)
  }

  return (
    <div className="conversation-stage-sidebar  p-4 shadow-lg rounded-xl">
      {/* 标题 */}
      <div className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        💬 对话阶段
      </div>

      {/* 阶段信息 */}
      <div className="stage-info mb-6 space-y-2">
        <div className="text-sm font-medium text-gray-700">
          {getCurrentStageName()}
        </div>
        <div className="text-xs text-gray-500">
          第 {conversationStage.turn_count} 轮对话
        </div>
        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded-lg">
          {conversationStage.description}
        </div>
      </div>

      {/* 阶段手动调节 */}
      <div className="stage-control">
        <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          🎛️ 手动调节
        </div>

        {/* 选择框 */}
        <Select value={conversationStage.stage} onValueChange={handleStageChange}>
          <SelectTrigger className="w-full mb-3">
            <SelectValue placeholder="选择对话阶段" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(stageNames).map(([stageId, stageName]) => (
              <SelectItem key={stageId} value={stageId}>
                {stageName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 控制状态显示 */}
        <div className={`text-xs p-2 rounded-lg ${
          isManualStageControl 
            ? 'text-amber-700 bg-amber-50' 
            : 'text-green-700 bg-green-50'
        }`}>
          {isManualStageControl ? '手动模式' : '自动模式'}
        </div>
      </div>
    </div>
  )
}

export default ConversationStage
