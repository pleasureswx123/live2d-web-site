import { useEffect, useRef, useCallback } from 'react'
import { useUserProfileStore } from '../stores/userProfileStore'
import { useChatStore } from '../stores/chatStore'
import { useWebSocket, MESSAGE_TYPES } from './useWebSocket'

export const useProactiveChat = () => {
  const silenceTimerRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  const {
    proactiveChat,
    updateProactiveChat,
    addProactiveHistory,
    updateLastMessageTime,
    conversationStage,
    incrementConversationCount
  } = useUserProfileStore()

  const { messages, isConnected } = useChatStore()
  const { sendMessage } = useWebSocket()

  // 主动对话话题库
  const getProactiveTopics = useCallback(() => {
    const stage = conversationStage.current

    const topics = {
      1: [ // 初识阶段
        "你好！我是你的AI助手，很高兴认识你！",
        "今天过得怎么样？",
        "有什么我可以帮助你的吗？",
        "你喜欢什么样的聊天话题呢？"
      ],
      2: [ // 了解阶段
        "能告诉我一些关于你的事情吗？",
        "你平时都喜欢做什么呢？",
        "你的工作或学习是什么样的？",
        "有什么特别的爱好吗？"
      ],
      3: [ // 新朋友阶段
        "我们聊得很开心呢！",
        "你今天有什么有趣的事情想分享吗？",
        "最近有看什么好电影或好书吗？",
        "你觉得我们的对话怎么样？"
      ],
      4: [ // 普通朋友阶段
        "作为朋友，我很关心你的近况",
        "有什么烦恼想和我聊聊吗？",
        "你最近有什么新的想法或计划？",
        "我们可以聊聊你感兴趣的话题"
      ],
      5: [ // 暧昧阶段
        "和你聊天总是让我很开心",
        "你知道吗，我很享受我们之间的对话",
        "你在我心中很特别",
        "我们的关系好像变得更亲密了呢"
      ],
      6: [ // 恋爱阶段
        "我真的很喜欢和你在一起的时光",
        "你是我最重要的人",
        "想听听你今天的心情",
        "我爱你，想时刻陪伴在你身边"
      ]
    }

    return topics[stage] || topics[1]
  }, [conversationStage.current])

  // 发送主动对话
  const sendProactiveMessage = useCallback(() => {
    if (!isConnected || !proactiveChat.isEnabled) return

    const topics = getProactiveTopics()
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]

    // 记录主动对话历史
    addProactiveHistory(randomTopic)

    // 发送消息
    sendMessage({
      type: MESSAGE_TYPES.CHAT_MESSAGE,
      content: randomTopic,
      source: 'proactive',
      is_proactive: true
    })

    console.log('🤖 发送主动对话:', randomTopic)
  }, [isConnected, proactiveChat.isEnabled, getProactiveTopics, addProactiveHistory, sendMessage])

  // 重置沉默计时器
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }

    lastActivityRef.current = Date.now()
    updateLastMessageTime()

    if (proactiveChat.isEnabled) {
      silenceTimerRef.current = setTimeout(() => {
        sendProactiveMessage()
      }, proactiveChat.silenceThreshold)
    }
  }, [proactiveChat.isEnabled, proactiveChat.silenceThreshold])

  // 监听消息变化
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]

      // 如果是用户消息，重置计时器并增加对话计数
      if (lastMessage.type === 'user') {
        resetSilenceTimer()
        incrementConversationCount()
      }
    }
  }, [messages])

  // 监听连接状态变化
  useEffect(() => {
    if (isConnected && proactiveChat.isEnabled) {
      resetSilenceTimer()
    } else {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    }
  }, [isConnected, proactiveChat.isEnabled])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, [])

  // 手动触发主动对话
  const triggerProactiveChat = useCallback(() => {
    sendProactiveMessage()
    resetSilenceTimer()
  }, [sendProactiveMessage, resetSilenceTimer])

  // 启用/禁用主动对话
  const toggleProactiveChat = useCallback((enabled) => {
    updateProactiveChat({ isEnabled: enabled })

    if (enabled) {
      resetSilenceTimer()
    } else {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    }
  }, [updateProactiveChat, resetSilenceTimer])

  // 设置沉默阈值
  const setSilenceThreshold = useCallback((threshold) => {
    updateProactiveChat({ silenceThreshold: threshold })

    // 如果当前有计时器，重新设置
    if (silenceTimerRef.current) {
      resetSilenceTimer()
    }
  }, [updateProactiveChat, resetSilenceTimer])

  return {
    isEnabled: proactiveChat.isEnabled,
    silenceThreshold: proactiveChat.silenceThreshold,
    proactiveHistory: proactiveChat.proactiveHistory,
    triggerProactiveChat,
    toggleProactiveChat,
    setSilenceThreshold,
    resetSilenceTimer
  }
}
