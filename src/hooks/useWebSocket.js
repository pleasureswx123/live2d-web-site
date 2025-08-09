import { useEffect, useRef, useCallback } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useUserProfileStore } from '../stores/userProfileStore'
import { useVoiceStore } from '../stores/voiceStore'
import { useSystemStore } from '../stores/systemStore'
import { useTTSPlayer } from './useTTSPlayer'

// WebSocket消息类型常量 (基于test.html分析)
export const MESSAGE_TYPES = {
  // 客户端发送消息类型
  INIT: 'init',
  MESSAGE: 'message',
  AUDIO_PLAYBACK_COMPLETE: 'audio_playback_complete',
  CHANGE_VOICE: 'change_voice',
  SYNC_TTS_SETTINGS: 'sync_tts_settings',
  CHANGE_ASR: 'change_asr',
  CHANGE_SPEED: 'change_speed',
  MANUAL_STAGE_CHANGE: 'manual_stage_change',
  RESET_STAGE_AUTO: 'reset_stage_auto',
  START_ASR: 'start_asr',
  STOP_ASR: 'stop_asr',
  AUDIO_CHUNK: 'audio_chunk',

  // 服务端接收消息类型
  INIT_SUCCESS: 'init_success',
  REQUEST_TTS_SETTINGS: 'request_tts_settings',
  SEARCH_START: 'search_start',
  SEARCH_COMPLETE: 'search_complete',
  SEARCH_ERROR: 'search_error',
  GENERATION_START: 'generation_start',
  GENERATION_CHUNK: 'generation_chunk',
  GENERATION_END: 'generation_end',
  TTS_AUDIO_CHUNK: 'tts_audio_chunk',
  TTS_COMPLETE: 'tts_complete',
  VOICE_CHANGE_SUCCESS: 'voice_change_success',
  VOICE_CHANGE_ERROR: 'voice_change_error',
  SPEED_CHANGE_SUCCESS: 'speed_change_success',
  SPEED_CHANGE_ERROR: 'speed_change_error',
  ASR_STARTED: 'asr_started',
  ASR_RESULT: 'asr_result',
  ASR_STOPPED: 'asr_stopped',
  ASR_ERROR: 'asr_error',
  ASR_CHANGE_SUCCESS: 'asr_change_success',
  ASR_CHANGE_ERROR: 'asr_change_error',
  CONVERSATION_STAGE: 'conversation_stage',
  PROFILE_ACTIVITY: 'profile_activity',
  PROFILE_UPDATED: 'profile_updated',
  MANUAL_STAGE_SUCCESS: 'manual_stage_success',
  MANUAL_STAGE_ERROR: 'manual_stage_error',
  ERROR: 'error'
}

export const useWebSocket = (url = 'ws://localhost:8000/ws') => {
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const heartbeatIntervalRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  // Store hooks
  const chatStore = useChatStore()
  const profileStore = useUserProfileStore()
  const voiceStore = useVoiceStore()
  const systemStore = useSystemStore()

  // TTS播放器
  const { addAudioToQueue } = useTTSPlayer()

  // 消息处理器 (基于test.html实现)
  const messageHandlers = {
    // 初始化成功
    [MESSAGE_TYPES.INIT_SUCCESS]: (data) => {
      console.log('用户初始化成功:', data.user_id)
      systemStore.addNotification({
        message: '连接初始化成功',
        type: 'success'
      })
    },

    // TTS设置请求
    [MESSAGE_TYPES.REQUEST_TTS_SETTINGS]: (data) => {
      console.log('收到TTS设置同步请求')
      // 发送当前TTS设置
      sendMessage({
        type: MESSAGE_TYPES.SYNC_TTS_SETTINGS,
        voice: voiceStore.tts.currentVoice,
        speed: voiceStore.tts.currentSpeed
      })
    },

    // 搜索状态
    [MESSAGE_TYPES.SEARCH_START]: (data) => {
      console.log('开始搜索:', data.query)
      systemStore.addNotification({
        message: `正在搜索: ${data.query}`,
        type: 'info'
      })
    },

    [MESSAGE_TYPES.SEARCH_COMPLETE]: (data) => {
      console.log('搜索完成')
    },

    [MESSAGE_TYPES.SEARCH_ERROR]: (data) => {
      console.error('搜索错误:', data.error)
      systemStore.addError({
        message: `搜索失败: ${data.error}`,
        type: 'search'
      })
    },

    // 生成状态
    [MESSAGE_TYPES.GENERATION_START]: (data) => {
      chatStore.setTyping(true)
      chatStore.updatePerformanceMetrics({
        messageStartTime: Date.now(),
        isLLMFirstToken: false,
        isTTSFirstPacket: false
      })
    },

    [MESSAGE_TYPES.GENERATION_CHUNK]: (data) => {
      if (data.content) {
        if (!chatStore.performanceMetrics.isLLMFirstToken) {
          chatStore.updatePerformanceMetrics({
            llmFirstTokenTime: Date.now(),
            isLLMFirstToken: true
          })
        }

        const currentMessage = chatStore.currentBotMessage || ''
        chatStore.updateCurrentBotMessage(currentMessage + data.content)
      }
    },

    [MESSAGE_TYPES.GENERATION_END]: (data) => {
      chatStore.setTyping(false)
      if (chatStore.currentBotMessage) {
        chatStore.addMessage({
          type: 'bot',
          content: chatStore.currentBotMessage,
          metadata: data.metadata
        })
        chatStore.clearCurrentBotMessage()
      }

      // 更新性能指标
      const endTime = Date.now()
      const startTime = chatStore.performanceMetrics.messageStartTime
      if (startTime) {
        chatStore.updatePerformanceMetrics({
          endToEndTime: endTime - startTime
        })
      }
    },

    // TTS音频
    [MESSAGE_TYPES.TTS_AUDIO_CHUNK]: (data) => {
      if (!chatStore.performanceMetrics.isTTSFirstPacket) {
        chatStore.updatePerformanceMetrics({
          ttsFirstPacketTime: Date.now(),
          isTTSFirstPacket: true
        })
      }

      if (data.audio_data && !voiceStore.tts.isMuted) {
        addAudioToQueue(data.audio_data)
      }
    },

    [MESSAGE_TYPES.TTS_COMPLETE]: (data) => {
      console.log('TTS完成')
      voiceStore.setTTSSpeaking(false)
    },

    // 语音设置响应
    [MESSAGE_TYPES.VOICE_CHANGE_SUCCESS]: (data) => {
      console.log('音色切换成功:', data.voice)
      voiceStore.setTTSVoice(data.voice)
      systemStore.addNotification({
        message: `音色已切换`,
        type: 'success'
      })
    },

    [MESSAGE_TYPES.VOICE_CHANGE_ERROR]: (data) => {
      console.error('音色切换失败:', data.error)
      systemStore.addError({
        message: `音色切换失败: ${data.error}`,
        type: 'voice'
      })
    },

    [MESSAGE_TYPES.SPEED_CHANGE_SUCCESS]: (data) => {
      console.log('语速调节成功:', data.speed)
      voiceStore.setTTSSpeed(data.speed)
    },

    [MESSAGE_TYPES.SPEED_CHANGE_ERROR]: (data) => {
      console.error('语速调节失败:', data.error)
      systemStore.addError({
        message: `语速调节失败: ${data.error}`,
        type: 'voice'
      })
    },

    // ASR响应
    [MESSAGE_TYPES.ASR_STARTED]: (data) => {
      console.log('ASR识别已开始')
      voiceStore.setASRRecording(true)
    },

    [MESSAGE_TYPES.ASR_RESULT]: (data) => {
      console.log('ASR识别结果:', data.text, 'final:', data.is_final)
      if (data.is_final) {
        voiceStore.setASRText('', data.text)
        if (data.text) {
          sendMessage({
            type: MESSAGE_TYPES.MESSAGE,
            content: data.text,
            user_id: chatStore.currentUserId
          })
        }
      } else {
        voiceStore.setASRText(data.text, voiceStore.asr.bestText)
      }
    },

    [MESSAGE_TYPES.ASR_STOPPED]: (data) => {
      console.log('ASR识别已停止')
      voiceStore.setASRRecording(false)
    },

    [MESSAGE_TYPES.ASR_ERROR]: (data) => {
      console.error('ASR识别错误:', data.error)
      voiceStore.setASRRecording(false)
      systemStore.addError({
        message: `语音识别失败: ${data.error}`,
        type: 'asr'
      })
    },

    [MESSAGE_TYPES.ASR_CHANGE_SUCCESS]: (data) => {
      console.log('ASR切换成功:', data.asr_type)
      voiceStore.setASREngine(data.asr_type)
      systemStore.addNotification({
        message: 'ASR引擎切换成功',
        type: 'success'
      })
    },

    [MESSAGE_TYPES.ASR_CHANGE_ERROR]: (data) => {
      console.error('ASR切换失败:', data.error)
      systemStore.addError({
        message: `ASR切换失败: ${data.error}`,
        type: 'asr'
      })
    },

    // 对话阶段更新
    [MESSAGE_TYPES.CONVERSATION_STAGE]: (data) => {
      console.log('对话阶段更新:', data.stage_info)
      if (data.stage_info) {
        profileStore.setConversationStage(
          data.stage_info.current_stage,
          data.stage_info.is_manual
        )
      }
    },

    // 用户档案活动
    [MESSAGE_TYPES.PROFILE_ACTIVITY]: (data) => {
      console.log('用户档案活动更新:', data.activity_info)
      if (data.activity_info) {
        // 更新关键信息状态
        if (data.activity_info.key_info_status) {
          profileStore.updateKeyInfoBatch(data.activity_info.key_info_status)
        }

        // 添加活动记录
        if (data.activity_info.recent_activities) {
          data.activity_info.recent_activities.forEach(activity => {
            profileStore.addConversionActivity(activity)
          })
        }
      }
    },

    [MESSAGE_TYPES.PROFILE_UPDATED]: (data) => {
      console.log('档案转换完成:', data.conversion_summary)
      if (data.activity_info) {
        profileStore.addConversionActivity({
          type: 'profile_conversion',
          description: '档案信息已更新',
          details: data.conversion_summary
        })
      }
    },

    // 手动阶段响应
    [MESSAGE_TYPES.MANUAL_STAGE_SUCCESS]: (data) => {
      console.log('手动阶段调节成功:', data.stage)
      systemStore.addNotification({
        message: `对话阶段已调整`,
        type: 'success'
      })
    },

    [MESSAGE_TYPES.MANUAL_STAGE_ERROR]: (data) => {
      console.error('手动阶段调节失败:', data.error)
      systemStore.addError({
        message: `阶段调节失败: ${data.error}`,
        type: 'stage'
      })
    },

    // 错误处理
    [MESSAGE_TYPES.ERROR]: (data) => {
      console.error('WebSocket错误:', data)
      systemStore.addError({
        message: data.message || '未知错误',
        type: 'websocket',
        details: data.details
      })
    }
  }



  // 发送消息
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date().toISOString(),
        user_id: chatStore.currentUserId
      }

      wsRef.current.send(JSON.stringify(messageWithTimestamp))

      // 如果是用户消息，添加到聊天记录
      if (message.type === MESSAGE_TYPES.CHAT_MESSAGE) {
        chatStore.addMessage({
          type: 'user',
          content: message.content,
          source: message.source || 'text'
        })

        // 重置性能指标
        chatStore.resetPerformanceMetrics()

        // 更新最后消息时间
        profileStore.updateLastMessageTime()
      }

      return true
    } else {
      systemStore.addError({
        message: 'WebSocket未连接，消息发送失败',
        type: 'connection'
      })
      return false
    }
  }, [chatStore, profileStore, systemStore])

  // 连接WebSocket
  const connect = useCallback(() => {
    // 防止重复连接
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      return
    }

    try {
      chatStore.setConnectionStatus('connecting')

      wsRef.current = new WebSocket(url)

      wsRef.current.onopen = () => {
        console.log('WebSocket连接成功')
        chatStore.setConnectionStatus('connected')
        chatStore.setWebSocket(wsRef.current)
        reconnectAttempts.current = 0

        // 发送初始化消息 (基于test.html实现)
        if (chatStore.currentUserId) {
          sendMessage({
            type: MESSAGE_TYPES.INIT,
            user_id: chatStore.currentUserId
          })
        }
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const handler = messageHandlers[data.type]

          if (handler) {
            handler(data)
          } else {
            console.warn('未知消息类型:', data.type)
          }
        } catch (error) {
          console.error('消息解析失败:', error)
          systemStore.addError({
            message: '消息解析失败',
            type: 'parse',
            details: error.message
          })
        }
      }

      wsRef.current.onclose = (event) => {
        console.log('WebSocket连接关闭:', event.code, event.reason)
        chatStore.setConnectionStatus('disconnected')
        chatStore.setWebSocket(null)

        // 清除心跳
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }

        // 自动重连（只有在非手动关闭的情况下）
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay * reconnectAttempts.current)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          systemStore.addError({
            message: 'WebSocket连接失败，已达到最大重连次数',
            type: 'connection'
          })
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket错误:', error)
        chatStore.setConnectionStatus('error')
        systemStore.addError({
          message: 'WebSocket连接错误',
          type: 'connection',
          details: error.message
        })
      }

    } catch (error) {
      console.error('WebSocket连接失败:', error)
      chatStore.setConnectionStatus('error')
      systemStore.addError({
        message: 'WebSocket连接失败',
        type: 'connection',
        details: error.message
      })
    }
  }, [url, chatStore, systemStore, sendMessage])

  // 断开连接
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    chatStore.setConnectionStatus('disconnected')
    chatStore.setWebSocket(null)
  }, [chatStore])

  // 组件挂载时连接
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, []) // 移除依赖，避免无限循环

  return {
    isConnected: chatStore.isConnected,
    connectionStatus: chatStore.connectionStatus,
    sendMessage,
    connect,
    disconnect
  }
}
