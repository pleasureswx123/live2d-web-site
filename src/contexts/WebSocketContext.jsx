import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useVoice } from './VoiceContext'
import { useUserAuthStore } from '../stores/userAuthStore'

// 创建 WebSocket Context
const WebSocketContext = createContext()

// WebSocket Provider 组件
export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // 'connected', 'disconnected', 'connecting'
  const [currentBotMessage, setCurrentBotMessage] = useState(null)

  // 获取用户信息和其他 context
  const { currentUser } = useUserAuthStore()
  const { setWebSocketRef, showNotification, updateConversationStage, currentVoice, currentSpeed } = useVoice()

  // 连接 WebSocket
  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState <= 1) {
      console.log('WebSocket 已连接或正在连接中')
      return
    }

    console.log('🔌 开始连接 WebSocket...')
    setConnectionStatus('connecting')

    const ws = new WebSocket('ws://localhost:8000/ws')

    ws.onopen = () => {
      console.log('✅ WebSocket连接已建立')
      setConnectionStatus('connected')
      wsRef.current = ws
      setWebSocketRef(ws)

      // 发送用户初始化消息
      if (currentUser?.id) {
        ws.send(JSON.stringify({
          type: 'init',
          user_id: currentUser.id
        }))
        console.log('📤 用户初始化消息已发送:', currentUser.id)
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
      setWebSocketRef(null)

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
  }

  // 断开 WebSocket 连接
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setWebSocketRef(null)
      setConnectionStatus('disconnected')
      console.log('🔌 WebSocket连接已手动断开')
    }
  }

  // 发送消息
  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      console.log('📤 WebSocket消息已发送:', message)
      return true
    } else {
      console.warn('⚠️ WebSocket未连接，无法发送消息')
      return false
    }
  }

  // 处理 WebSocket 消息
  const handleWebSocketMessage = (data) => {
    console.log('📥 收到WebSocket消息:', data.type, data)

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
        showSearchIndicator(data.query)
        break

      case 'search_complete':
        hideSearchIndicator()
        break

      case 'search_error':
        hideSearchIndicator()
        console.error('❌ 搜索错误:', data.error)
        break

      case 'generation_start':
        // 开始生成时创建新的机器人消息框
        createNewBotMessage()
        showTypingIndicator()
        break

      case 'generation_chunk':
        if (data.content) {
          // 记录LLM首字响应时间
          recordLLMFirstToken()
          appendToBotMessage(data.content)
        }
        break

      case 'generation_end':
        hideTypingIndicator()
        setCurrentBotMessage(null) // 清空当前消息引用
        break

      case 'tts_audio':
        // 处理TTS音频数据（回退模式）
        console.log('🎵 收到TTS音频消息（回退模式）:', {
          type: data.type,
          format: data.format,
          audioDataLength: data.audio_data ? data.audio_data.length : 0,
          text: data.text
        })
        if (data.audio_data) {
          playTTSAudio(data.audio_data, data.format || 'mp3')
        }
        break

      case 'tts_audio_chunk':
        // 记录TTS首包回复时间
        recordTTSFirstPacket()
        // 处理流式TTS音频片段
        console.log('🎵 收到流式TTS音频片段:', {
          type: data.type,
          format: data.format,
          order: data.order,
          audioDataLength: data.audio_data ? data.audio_data.length : 0,
          text: data.text ? data.text.substring(0, 30) + '...' : 'null',
          isProactive: data.is_proactive || false
        })
        if (data.audio_data && data.order) {
          playTTSAudioChunkWithOrder(data.audio_data, data.format || 'mp3', data.order)
        } else if (data.audio_data) {
          // 兼容没有顺序号的情况
          playTTSAudioChunk(data.audio_data, data.format || 'mp3')
        } else {
          console.error('❌ 收到的tts_audio_chunk消息没有audio_data字段')
        }
        break

      case 'tts_complete':
        // TTS完成信号
        console.log('🎵 流式TTS完成')
        onTTSComplete()
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
        updateProfileActivity(data.activity_info)
        break

      case 'profile_updated':
        // 档案转换完成通知
        console.log('⚡ 档案转换完成:', data.conversion_summary)
        updateProfileConversion(data.activity_info, data.conversion_summary)
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
        // ASR识别开始
        console.log('🎤 ASR识别已开始')
        onASRStarted()
        break

      case 'asr_result':
        // ASR识别结果
        console.log('🎤 ASR识别结果:', data.text, '(final:', data.is_final, ')')
        onASRResult(data.text, data.is_final, data.confidence)
        break

      case 'asr_stopped':
        // ASR识别停止
        console.log('🎤 ASR识别已停止')
        onASRStopped()
        break

      case 'asr_error':
        // ASR识别错误
        console.error('❌ ASR识别错误:', data.error)
        onASRError(data.error)
        break

      case 'error':
        hideTypingIndicator()
        if (currentBotMessage) {
          const content = currentBotMessage.querySelector('.message-content')
          if (content) {
            content.textContent = '抱歉，生成回复时出现了错误...'
          }
        } else {
          appendBotMessage('抱歉，生成回复时出现了错误...')
        }
        setCurrentBotMessage(null)
        break

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
    console.log('🔄 同步TTS设置到后端:', {voice: currentVoice, speed: currentSpeed});
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'sync_tts_settings',
        voice: currentVoice,
        speed: currentSpeed
      }));
      console.log('📤 TTS设置同步请求已发送');
    } else {
      console.log('⚠️ WebSocket未连接，无法同步TTS设置');
    }
  }

  const showSearchIndicator = (query) => {
    console.log('🔍 显示搜索指示器:', query)
  }

  const hideSearchIndicator = () => {
    console.log('🔍 隐藏搜索指示器')
  }

  const createNewBotMessage = () => {
    console.log('💬 创建新的机器人消息 - 待实现')
  }

  const showTypingIndicator = () => {
    console.log('⌨️ 显示打字指示器 - 待实现')
  }

  const hideTypingIndicator = () => {
    console.log('⌨️ 隐藏打字指示器 - 待实现')
  }

  const recordLLMFirstToken = () => {
    console.log('⏱️ 记录LLM首字响应时间 - 待实现')
  }

  const appendToBotMessage = (content) => {
    console.log('💬 追加到机器人消息:', content)
  }

  const playTTSAudio = (audioData, format) => {
    console.log('🎵 播放TTS音频 - 待实现')
  }

  const recordTTSFirstPacket = () => {
    console.log('⏱️ 记录TTS首包回复时间 - 待实现')
  }

  const playTTSAudioChunkWithOrder = (audioData, format, order) => {
    console.log('🎵 播放有序TTS音频片段 - 待实现')
  }

  const playTTSAudioChunk = (audioData, format) => {
    console.log('🎵 播放TTS音频片段 - 待实现')
  }

  const onTTSComplete = () => {
    console.log('🎵 TTS完成 - 待实现')
  }

  const updateProfileActivity = (activityInfo) => {
    console.log('👤 更新用户档案活动 - 待实现')
  }

  const updateProfileConversion = (activityInfo, conversionSummary) => {
    console.log('⚡ 更新档案转换 - 待实现')
  }

  const onASRStarted = () => {
    console.log('🎤 ASR开始 - 待实现')
  }

  const onASRResult = (text, isFinal, confidence) => {
    console.log('🎤 ASR结果 - 待实现')
  }

  const onASRStopped = () => {
    console.log('🎤 ASR停止 - 待实现')
  }

  const onASRError = (error) => {
    console.log('🎤 ASR错误 - 待实现')
  }

  const appendBotMessage = (message) => {
    console.log('💬 追加机器人消息 - 待实现')
  }

  // 监听用户变化，重新连接 WebSocket
  useEffect(() => {
    if (currentUser?.id) {
      connectWebSocket()
    } else {
      disconnectWebSocket()
    }
  }, [currentUser?.id])

  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      disconnectWebSocket()
    }
  }, [])

  const value = {
    connectionStatus,
    connectWebSocket,
    disconnectWebSocket,
    sendMessage,
    wsRef: wsRef.current
  }

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
