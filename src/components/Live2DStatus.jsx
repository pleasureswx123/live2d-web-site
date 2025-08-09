import React from 'react'
import { useChatStore } from '../stores/chatStore'
import { useVoiceStore } from '../stores/voiceStore'
import { useUserProfileStore } from '../stores/userProfileStore'

// Live2D状态显示组件
export const Live2DStatus = ({ currentEmotion, currentMotion, model }) => {
  const { isTyping, currentBotMessage } = useChatStore()
  const { tts, asr } = useVoiceStore()
  const { conversationStage } = useUserProfileStore()
  
  // 获取状态描述
  const getStatusDescription = () => {
    if (isTyping) return '🤔 正在思考...'
    if (tts.isSpeaking) return '🗣️ 正在说话...'
    if (asr.isRecording) return '👂 正在倾听...'
    return '😌 等待中...'
  }
  
  // 获取情感描述
  const getEmotionDescription = (emotion) => {
    const emotions = {
      happy: '😊 开心',
      sad: '😢 难过',
      angry: '😠 生气',
      surprised: '😲 惊讶',
      neutral: '😐 平静',
      love: '😍 爱意',
      shy: '😳 害羞',
      excited: '🤩 兴奋'
    }
    return emotions[emotion] || '😐 平静'
  }
  
  // 获取动作描述
  const getMotionDescription = (motion) => {
    const motions = {
      greeting: '👋 问候',
      talking: '💬 说话',
      listening: '👂 倾听',
      thinking: '🤔 思考',
      goodbye: '👋 告别',
      idle: '😌 待机'
    }
    return motions[motion] || '😌 待机'
  }
  
  // 获取阶段描述
  const getStageDescription = (stage) => {
    const stages = {
      1: '👋 初识',
      2: '🤝 了解',
      3: '😊 新朋友',
      4: '😄 普通朋友',
      5: '😍 暧昧',
      6: '💕 恋爱'
    }
    return stages[stage] || '👋 初识'
  }
  
  if (!model) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-red-500/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
        ❌ Live2D模型未加载
      </div>
    )
  }
  
  return (
    <div className="fixed bottom-20 left-4 z-40 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm shadow-lg max-w-xs">
      <div className="space-y-2">
        {/* 模型状态 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">状态:</span>
          <span className="font-medium">{getStatusDescription()}</span>
        </div>
        
        {/* 当前表情 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">表情:</span>
          <span className="font-medium">{getEmotionDescription(currentEmotion)}</span>
        </div>
        
        {/* 当前动作 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">动作:</span>
          <span className="font-medium">{getMotionDescription(currentMotion)}</span>
        </div>
        
        {/* 对话阶段 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">阶段:</span>
          <span className="font-medium">{getStageDescription(conversationStage.current)}</span>
        </div>
        
        {/* 当前消息预览 */}
        {currentBotMessage && (
          <div className="border-t border-gray-200 pt-2">
            <div className="text-gray-600 text-xs mb-1">正在说:</div>
            <div className="text-gray-800 text-xs bg-gray-50 p-2 rounded max-h-16 overflow-y-auto">
              {currentBotMessage.length > 50 
                ? currentBotMessage.substring(0, 50) + '...' 
                : currentBotMessage
              }
            </div>
          </div>
        )}
        
        {/* 语音状态 */}
        {(tts.isSpeaking || asr.isRecording) && (
          <div className="border-t border-gray-200 pt-2">
            <div className="flex items-center space-x-2">
              {tts.isSpeaking && (
                <span className="text-green-600 text-xs">🔊 TTS播放中</span>
              )}
              {asr.isRecording && (
                <span className="text-red-600 text-xs">🎤 录音中</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Live2DStatus
