import { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useUserAuthStore } from '../stores/userAuthStore'
import { useVoiceStore } from '../stores/voiceStore'
import { useASRStore } from '../stores/asrStore'
import { useTTSStore } from '../stores/ttsStore'
import { useProactiveChatStore } from '../stores/proactiveChatStore'
import { useChatMessagesStore } from '../stores/chatMessagesStore'
import { useProfileStore } from '../stores/profileStore'
import { useConversionStore } from '../stores/conversionStore'

// 创建 WebSocket Context
const WebSocketContext = createContext()

// WebSocket Provider 组件
export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // 'connected', 'disconnected', 'connecting'

  // 获取用户信息和其他 context
  const { currentUser } = useUserAuthStore()
  const { showNotification, updateConversationStage } = useVoiceStore()
  // 连接 WebSocket
  const connectWebSocket = useCallback(() => {
    const { currentUser: curUser } = useUserAuthStore.getState();
    if (!curUser?.id) {
      return
    }

    if (wsRef.current && wsRef.current.readyState <= 1) {
      console.log('WebSocket 已连接或正在连接中')
      return
    }

    console.log('🔌 开始连接 WebSocket...')
    setConnectionStatus('connecting')

    const ws = new WebSocket(`ws://localhost:8000/ws?t=${Date.now()}`)

    ws.onopen = () => {
      console.log('✅ WebSocket连接已建立')
      setConnectionStatus('connected')
      wsRef.current = ws
      useVoiceStore.getState().setWebSocketRef(ws)
      useTTSStore.getState().setWebSocketRef(ws)
      useASRStore.getState().setWebSocketRef(ws)
      // 发送用户初始化消息
      if (curUser?.id) {
        ws.send(JSON.stringify({
          type: 'init',
          user_id: curUser.id
        }))
        console.log('📤 用户初始化消息已发送:', curUser.id)
      }
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error('❌ 解析WebSocket消息失败:', error)
      }
    }

    ws.onclose = () => {
      console.log('🔌 WebSocket连接已关闭')
      setConnectionStatus('disconnected')
      wsRef.current = null
      useVoiceStore.getState().setWebSocketRef(null)
      useTTSStore.getState().setWebSocketRef(null)
      useASRStore.getState().setWebSocketRef(null)
      // 5秒后重连
      setTimeout(() => {
        console.log('🔄 准备重新连接 WebSocket...')
        connectWebSocket()
      }, 5000)
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket错误:', error)
      setConnectionStatus('disconnected')
    }
  }, [])

  // 断开 WebSocket 连接
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      useVoiceStore.getState().setWebSocketRef(null)
      useTTSStore.getState().setWebSocketRef(null)
      useASRStore.getState().setWebSocketRef(null)
      setConnectionStatus('disconnected')
      console.log('🔌 WebSocket连接已手动断开')
    }
  }, [])

  // 发送消息
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      console.log('📤 WebSocket消息已发送:', message)
      return true
    } else {
      console.warn('⚠️ WebSocket未连接，无法发送消息')
      return false
    }
  }, [])

  // 处理 WebSocket 消息
  const handleWebSocketMessage = (data) => {
    // console.log('📥 收到WebSocket消息:', data.type, data)

    switch (data.type) {
      case 'init_success':
        console.log('✅ 用户初始化成功:', data.user_id)
        showNotification('连接成功', '已成功连接到服务器')
        // 停止前端的主动对话定时器，因为现在由后端控制
        stopProactiveChatTimer()
        console.log('✅ 已停用前端主动对话定时器，现在由后端智能触发')
        break

      case 'request_tts_settings':
        console.log('🔄 收到TTS设置同步请求，发送当前设置')
        syncCurrentTTSSettings()
        break

      case 'asr_change_success':
        console.log('✅ ASR切换成功:', data.asr_type)
        showNotification('ASR切换成功', data.message, 'success')
        break

      case 'asr_change_error':
        console.error('❌ ASR切换失败:', data.error)
        showNotification('ASR切换失败', data.error, 'destructive')
        break

      case 'search_start':
        useChatMessagesStore.getState().showSearchIndicator(data.query)
        break

      case 'search_complete':
        useChatMessagesStore.getState().hideSearchIndicator()
        break

      case 'search_error':
        useChatMessagesStore.getState().hideSearchIndicator()
        console.error('❌ 搜索错误:', data.error)
        break

      case 'generation_start':
        // 开始生成时创建新的机器人消息框
        useChatMessagesStore.getState().createNewBotMessageForWebSocket()
        break

      case 'generation_chunk':
        if (data.content) {
          useChatMessagesStore.getState().appendToBotMessage(data.content)
          // 表情同步 - 从文本内容中匹配表情
          try {
            const matchedExpression = useTTSStore.getState().matchExpression(data.content)
            if (matchedExpression) {
              // 异步播放表情，不阻塞文本显示
              useTTSStore.getState().playLive2DExpression(matchedExpression).catch(error => {
                console.warn('🎭 表情播放失败:', error)
              })
            }
          } catch (error) {
            console.error('❌ 表情匹配异常:', error)
          }
        }
        break

      case 'generation_end':
        useChatMessagesStore.getState().finishStreamingMessage() // 完成流式消息
        break

      case 'tts_audio':
        // 处理TTS音频数据（回退模式）
        console.log('🎵 TTS: 收到TTS音频消息（回退模式）:', {
          type: data.type,
          format: data.format,
          audioDataLength: data.audio_data ? data.audio_data.length : 0,
          text: data.text
        })
        if (data.audio_data) {
          useTTSStore.getState().playTTSAudio(data.audio_data, data.format || 'mp3')
        }
        break

      case 'tts_audio_chunk':
        // 处理流式TTS音频片段
        console.log('🎵 TTS: 收到流式TTS音频片段:', {
          type: data.type,
          format: data.format,
          order: data.order,
          audioDataLength: data.audio_data ? data.audio_data.length : 0,
          audioData: data.audio_data,
          text: data.text ? data.text.substring(0, 30) + '...' : 'null',
          isProactive: data.is_proactive || false
        })
        if (data.audio_data && data.order) {
          useTTSStore.getState().playTTSAudioChunkWithOrder(data.audio_data, data.format || 'mp3', data.order)
        } else if (data.audio_data) {
          // 兼容没有顺序号的情况
          useTTSStore.getState().playTTSAudioChunk(data.audio_data, data.format || 'mp3')
        } else {
          console.error('❌ 收到的tts_audio_chunk消息没有audio_data字段')
        }
        break

      case 'tts_complete':
        // TTS生成完成（播放可能仍在继续，待 onTTSComplete 统一收尾）
        console.log('🎵 TTS: TTS生成完成', data)
        useTTSStore.getState().onTTSComplete()
        break

      case 'voice_change_success':
        // 音色切换成功
        console.log('🎵 音色切换成功:', data.voice)
        showNotification('音色切换成功', `音色已切换为: ${data.voice}`, 'success')
        break

      case 'voice_change_error':
        // 音色切换失败
        console.error('❌ 音色切换失败:', data.error)
        showNotification('音色切换失败', data.error, 'destructive')
        break

      case 'speed_change_success':
        // 语速调节成功
        console.log('🎚️ 语速调节成功:', data.speed)
        showNotification('语速调节成功', `语速已调节为: ${parseFloat(data.speed).toFixed(1)}x`, 'success')
        break

      case 'speed_change_error':
        // 语速调节失败
        console.error('❌ 语速调节失败:', data.error)
        showNotification('语速调节失败', data.error, 'destructive')
        break

      case 'conversation_stage':
        // 对话阶段信息更新
        console.log('💬 对话阶段更新:', data.stage_info)
        console.log('🔍 详细阶段信息:', JSON.stringify(data.stage_info, null, 2))
        updateConversationStage(data.stage_info)
        break

      case 'profile_activity':
        // 用户档案活动信息更新
        console.log('👤 用户档案活动更新:', data.activity_info)
        console.log('📊 调试信息 - 完成度:', data.activity_info.completion_rate)
        console.log('📊 调试信息 - 关键信息状态:', data.activity_info.key_info_status)
        console.log('🔍 详细活动信息:', JSON.stringify(data.activity_info, null, 2))
        useProfileStore.getState().updateProfileActivity(data.activity_info)
        break

      case 'profile_updated':
        // 档案转换完成通知
        console.log('⚡ 档案转换完成:', data.conversion_summary)
        useProfileStore.getState().updateProfileActivity(data.activity_info)
        useConversionStore.getState().addConversionActivity(data.conversion_summary)
        break

      case 'manual_stage_success':
        // 手动阶段调节成功
        console.log('🎛️ 手动阶段调节成功:', data.stage)
        break

      case 'manual_stage_error':
        // 手动阶段调节失败
        console.error('❌ 手动阶段调节失败:', data.error)
        showNotification('阶段调节失败', data.error, 'destructive')
        break

      case 'asr_started':
        console.log('🎤 服务器确认ASR已启动')
        useASRStore.getState().onASRStarted()
        break

      case 'asr_result':
        console.log('🎤 ASR识别结果:', data.text, '(final:', data.is_final, ', confidence:', data.confidence, ')')
        useASRStore.getState().onASRResult(data.text, data.is_final, data.confidence)
        break

      case 'asr_stopped':
        console.log('🎤 服务器确认ASR已停止')
        useASRStore.getState().onASRStopped()
        break

      case 'asr_error':
        console.error('❌ ASR识别错误:', data.error)
        useASRStore.getState().onASRError(data.error)
        break

      case 'error': {
        // 如果有正在进行的流式消息，更新其内容为错误信息
        const chatStore = useChatMessagesStore.getState()
        if (chatStore.currentStreamingMessageId) {
          chatStore.updateMessageContent(chatStore.currentStreamingMessageId, '抱歉，生成回复时出现了错误...')
          chatStore.finishStreamingMessage()
        } else {
          // 否则添加一个新的错误消息
          chatStore.addBotMessage('抱歉，生成回复时出现了错误...')
        }
        break
      }

      default:
        console.log('🔍 未处理的消息类型:', data.type)
        break
    }
  }

  // 占位函数 - 这些函数需要根据实际的聊天组件来实现
  const stopProactiveChatTimer = () => {
    console.log('🔄 停止主动对话定时器 - 待实现')
  }

  const syncCurrentTTSSettings = () => {
    const  {currentVoice, currentSpeed } = useVoiceStore.getState()
    console.log('🔄 同步TTS设置到后端:', {voice: currentVoice, speed: currentSpeed});
    const success = sendMessage({
      type: 'sync_tts_settings',
      voice: currentVoice,
      speed: currentSpeed
    });
    if (success) {
      console.log('📤 TTS设置同步请求已发送');
    } else {
      console.log('⚠️ WebSocket未连接，无法同步TTS设置');
    }
  }

  const recordLLMFirstToken = () => {
    console.log('⏱️ 记录LLM首字响应时间 - 待实现')
  }



  // 监听全局音频停止事件
  useEffect(() => {
    const handleStopAllTTS = () => {
      console.log('🛑 收到全局停止TTS事件')
      useTTSStore.getState().stopAllAudio()
    }

    const handleClearAudioQueue = () => {
      console.log('🗑️ 收到清空音频队列事件')
      useTTSStore.getState().clearAudioQueue()
    }

    // 注册事件监听器
    window.addEventListener('stopAllTTS', handleStopAllTTS)
    window.addEventListener('clearAudioQueue', handleClearAudioQueue)

    return () => {
      window.removeEventListener('stopAllTTS', handleStopAllTTS)
      window.removeEventListener('clearAudioQueue', handleClearAudioQueue)
    }
  }, [])

  // 监听用户变化，重新连接 WebSocket
  useEffect(() => {
    disconnectWebSocket();
    if (currentUser?.id) {
      console.log('🔄 初始化用户系统  已登录，准备连接 WebSocket...')
      useProactiveChatStore.getState().loadSilenceTimeout(currentUser?.id)
      connectWebSocket()
      // 更新欢迎消息（集成点 - 可以被聊天系统调用）
      useChatMessagesStore.getState().switchToUser(currentUser);
    }
  }, [currentUser?.id])

  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      disconnectWebSocket()
    }
  }, [])

  const value = useMemo(() => ({
    connectionStatus,
    connectWebSocket,
    disconnectWebSocket,
    sendMessage,
    wsRef: wsRef.current
  }), [connectionStatus, connectWebSocket, disconnectWebSocket, sendMessage])

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

// 自定义 Hook
export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export default WebSocketContext
