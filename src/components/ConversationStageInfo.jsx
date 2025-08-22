import { useVoice } from '../contexts/VoiceContext'

const ConversationStageInfo = () => {
  const { conversationStage } = useVoice()

  return (
    <div className="activity-section  p-4 shadow-lg rounded-xl">
      <h4 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
        <div
          className="activity-section-icon w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm"
          style={{ background: '#dcfce7', color: '#166534' }}
        >
          💬
        </div>
        对话阶段
      </h4>

      <div className="space-y-3">
        <div className="info-item flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="info-label text-sm font-medium text-gray-600">当前阶段</span>
          <span className="info-value text-sm font-semibold text-gray-900">
            {conversationStage.stage_name}
          </span>
        </div>

        <div className="info-item flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="info-label text-sm font-medium text-gray-600">对话轮数</span>
          <span className="info-value text-sm font-semibold text-gray-900">
            {conversationStage.turn_count}
          </span>
        </div>

        <div className="info-item flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="info-label text-sm font-medium text-gray-600">信息完成度</span>
          <span className="info-value text-sm font-semibold text-gray-900">
            {conversationStage.info_completion.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default ConversationStageInfo
