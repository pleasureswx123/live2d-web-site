import { useEffect, useRef, useCallback } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useVoiceStore } from '../stores/voiceStore'
import { useUserProfileStore } from '../stores/userProfileStore'

// Live2D表情映射
const EMOTION_MAPPING = {
  happy: 'happy',
  sad: 'sad',
  angry: 'angry',
  surprised: 'surprised',
  neutral: 'neutral',
  love: 'love',
  shy: 'shy',
  excited: 'excited'
}

// Live2D动作映射
const MOTION_MAPPING = {
  greeting: 'greeting',
  talking: 'talking',
  listening: 'listening',
  thinking: 'thinking',
  goodbye: 'goodbye',
  idle: 'idle'
}

export const useLive2DChat = (model, app) => {
  const currentEmotionRef = useRef('neutral')
  const currentMotionRef = useRef('idle')
  const lipSyncIntervalRef = useRef(null)
  const emotionTimeoutRef = useRef(null)

  const { messages, currentBotMessage, isTyping } = useChatStore()
  const { tts, asr } = useVoiceStore()
  const { conversationStage } = useUserProfileStore()

  // 分析文本情感
  const analyzeEmotion = useCallback((text) => {
    if (!text) return 'neutral'

    const lowerText = text.toLowerCase()

    // 简单的情感分析规则
    if (lowerText.includes('开心') || lowerText.includes('高兴') || lowerText.includes('哈哈') || lowerText.includes('😊') || lowerText.includes('😄')) {
      return 'happy'
    }
    if (lowerText.includes('难过') || lowerText.includes('伤心') || lowerText.includes('😢') || lowerText.includes('😭')) {
      return 'sad'
    }
    if (lowerText.includes('生气') || lowerText.includes('愤怒') || lowerText.includes('😠') || lowerText.includes('😡')) {
      return 'angry'
    }
    if (lowerText.includes('惊讶') || lowerText.includes('震惊') || lowerText.includes('😲') || lowerText.includes('😮')) {
      return 'surprised'
    }
    if (lowerText.includes('爱') || lowerText.includes('喜欢') || lowerText.includes('💕') || lowerText.includes('❤️')) {
      return 'love'
    }
    if (lowerText.includes('害羞') || lowerText.includes('脸红') || lowerText.includes('😳') || lowerText.includes('😊')) {
      return 'shy'
    }
    if (lowerText.includes('兴奋') || lowerText.includes('激动') || lowerText.includes('🎉') || lowerText.includes('✨')) {
      return 'excited'
    }

    // 根据对话阶段调整默认情感
    if (conversationStage.current >= 5) {
      return 'love'
    } else if (conversationStage.current >= 3) {
      return 'happy'
    }

    return 'neutral'
  }, [conversationStage.current])

  // 设置Live2D表情
  const setEmotion = useCallback((emotion) => {
    if (!model || !model.internalModel) return

    try {
      const mappedEmotion = EMOTION_MAPPING[emotion] || 'neutral'

      if (currentEmotionRef.current !== mappedEmotion) {
        // 设置表情参数
        const parameterIds = model.internalModel.coreModel.getParameterIds()

        // 重置所有表情参数
        Object.values(EMOTION_MAPPING).forEach(emotionParam => {
          const paramId = `Param${emotionParam.charAt(0).toUpperCase() + emotionParam.slice(1)}`
          if (parameterIds.includes(paramId)) {
            model.internalModel.coreModel.setParameterValueById(paramId, 0)
          }
        })

        // 设置目标表情
        const targetParamId = `Param${mappedEmotion.charAt(0).toUpperCase() + mappedEmotion.slice(1)}`
        if (parameterIds.includes(targetParamId)) {
          model.internalModel.coreModel.setParameterValueById(targetParamId, 1)
        }

        currentEmotionRef.current = mappedEmotion
        console.log(`🎭 设置表情: ${mappedEmotion}`)
      }
    } catch (error) {
      console.error('设置表情失败:', error)
    }
  }, [model])

  // 播放Live2D动作
  const playMotion = useCallback((motion, priority = 2) => {
    if (!model || !model.internalModel) return

    try {
      const mappedMotion = MOTION_MAPPING[motion] || 'idle'

      // 播放动作
      model.motion(mappedMotion, priority)
      currentMotionRef.current = mappedMotion
      console.log(`🎬 播放动作: ${mappedMotion}`)
    } catch (error) {
      console.error('播放动作失败:', error)
    }
  }, [model])

  // 口型同步
  const startLipSync = useCallback(() => {
    if (!model || !model.internalModel || lipSyncIntervalRef.current) return

    try {
      lipSyncIntervalRef.current = setInterval(() => {
        if (tts.isSpeaking) {
          // 模拟口型同步
          const openness = Math.random() * 0.8 + 0.2 // 0.2-1.0
          const parameterIds = model.internalModel.coreModel.getParameterIds()

          if (parameterIds.includes('ParamMouthOpenY')) {
            model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', openness)
          }
        } else {
          // 关闭嘴巴
          const parameterIds = model.internalModel.coreModel.getParameterIds()
          if (parameterIds.includes('ParamMouthOpenY')) {
            model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', 0)
          }
        }
      }, 100) // 每100ms更新一次

      console.log('🗣️ 开始口型同步')
    } catch (error) {
      console.error('口型同步失败:', error)
    }
  }, [model, tts.isSpeaking])

  // 停止口型同步
  const stopLipSync = useCallback(() => {
    if (lipSyncIntervalRef.current) {
      clearInterval(lipSyncIntervalRef.current)
      lipSyncIntervalRef.current = null
      console.log('🗣️ 停止口型同步')
    }
  }, [])

  // 根据聊天状态更新Live2D
  useEffect(() => {
    if (!model) return

    if (isTyping) {
      // AI正在思考
      setEmotion('neutral')
      playMotion('thinking')
    } else if (tts.isSpeaking) {
      // AI正在说话
      playMotion('talking')
      startLipSync()
    } else if (asr.isRecording) {
      // 用户正在说话，AI在听
      setEmotion('neutral')
      playMotion('listening')
    } else {
      // 空闲状态
      playMotion('idle')
      stopLipSync()
    }
  }, [model, isTyping, tts.isSpeaking, asr.isRecording])

  // 根据消息内容更新表情
  useEffect(() => {
    if (!model || !currentBotMessage) return

    const emotion = analyzeEmotion(currentBotMessage)
    setEmotion(emotion)

    // 设置表情持续时间
    if (emotionTimeoutRef.current) {
      clearTimeout(emotionTimeoutRef.current)
    }

    emotionTimeoutRef.current = setTimeout(() => {
      setEmotion('neutral')
    }, 5000) // 5秒后回到中性表情

  }, [model, currentBotMessage])

  // 根据对话阶段调整行为
  useEffect(() => {
    if (!model) return

    // 根据对话阶段设置不同的默认表情和行为
    switch (conversationStage.current) {
      case 1: // 初识
        setEmotion('neutral')
        break
      case 2: // 了解
        setEmotion('neutral')
        break
      case 3: // 新朋友
        setEmotion('happy')
        break
      case 4: // 普通朋友
        setEmotion('happy')
        break
      case 5: // 暧昧
        setEmotion('shy')
        break
      case 6: // 恋爱
        setEmotion('love')
        break
      default:
        setEmotion('neutral')
    }
  }, [model, conversationStage.current])

  // 用户开始对话时的反应
  useEffect(() => {
    if (!model || messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.type === 'user') {
      // 用户发送消息时，显示问候或倾听的动作
      playMotion('greeting', 3)

      // 分析用户消息的情感并做出相应反应
      const userEmotion = analyzeEmotion(lastMessage.content)
      setTimeout(() => {
        setEmotion(userEmotion)
      }, 1000)
    }
  }, [model, messages])

  // 清理函数
  useEffect(() => {
    return () => {
      stopLipSync()
      if (emotionTimeoutRef.current) {
        clearTimeout(emotionTimeoutRef.current)
      }
    }
  }, [])

  return {
    setEmotion,
    playMotion,
    startLipSync,
    stopLipSync,
    currentEmotion: currentEmotionRef.current,
    currentMotion: currentMotionRef.current
  }
}
