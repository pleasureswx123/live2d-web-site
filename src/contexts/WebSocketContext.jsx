import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useVoice } from './VoiceContext'
import { useUserAuthStore } from '../stores/userAuthStore'
import { useChatMessagesStore } from '../stores/chatMessagesStore'
import { playAudioFromBase64, showAudioPrompt, getAudioStatus } from '../utils/audioUtils'
import { useASRStore } from '../stores/asrStore'
import { useProfileStore } from '../stores/profileStore'
import { useConversionStore } from '../stores/conversionStore'
import { useProactiveChatStore } from '../stores/proactiveChatStore'

// 创建 WebSocket Context
const WebSocketContext = createContext()

// WebSocket Provider 组件
export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // 'connected', 'disconnected', 'connecting'

  // 获取用户信息和其他 context
  const { currentUser } = useUserAuthStore()
  const { setWebSocketRef, showNotification, updateConversationStage, currentVoice, currentSpeed } = useVoice()
  const {
    createNewBotMessageForWebSocket,
    appendToBotMessage,
    finishStreamingMessage,
    showSearchIndicator,
    hideSearchIndicator,
    switchToUser,
  } = useChatMessagesStore()

  // 获取 ASR Store 的方法（在组件顶层调用）
  const asrStore = useASRStore()
  const { updateProfileActivity } = useProfileStore();
  const { addConversionActivity } = useConversionStore();

  // 当WebSocket连接状态改变时，更新ASR Store
  useEffect(() => {
    if (asrStore.updateConnectionFromContext) {
      asrStore.updateConnectionFromContext(wsRef, connectionStatus)
    }
  }, [connectionStatus])

  // 连接 WebSocket
  const connectWebSocket = () => {
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
      setWebSocketRef(ws)

      // 设置ASR Store的WebSocket连接
      if (asrStore.setWebSocket) {
        asrStore.setWebSocket(ws)
        console.log('🎤 ASR Store WebSocket连接已设置')
      }

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

      // 清除ASR Store的WebSocket连接
      if (asrStore.setWebSocket) {
        asrStore.setWebSocket(null)
        console.log('🎤 ASR Store WebSocket连接已清除')
      }

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

      // 清除ASR Store的WebSocket连接
      if (asrStore.setWebSocket) {
        asrStore.setWebSocket(null)
        console.log('🎤 ASR Store WebSocket连接已清除')
      }

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
        createNewBotMessageForWebSocket()
        break

      case 'generation_chunk':
        if (data.content) {
          appendToBotMessage(data.content)

          // 表情同步 - 从文本内容中匹配表情
          try {
            const matchedExpression = matchExpression(data.content)
            if (matchedExpression) {
              // 异步播放表情，不阻塞文本显示
              playLive2DExpression(matchedExpression).catch(error => {
                console.warn('🎭 表情播放失败:', error)
              })
            }
          } catch (error) {
            console.error('❌ 表情匹配异常:', error)
          }
        }
        break

      case 'generation_end':
        finishStreamingMessage() // 完成流式消息
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
        // TTS生成完成（播放可能仍在继续，待 onTTSComplete 统一收尾）
        console.log('🎵 TTS生成完成')
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
        updateProfileActivity(data.activity_info)
        addConversionActivity(data.conversion_summary)
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
        if (asrStore.onASRStarted) {
          asrStore.onASRStarted()
        }
        break

      case 'asr_result':
        console.log('🎤 ASR识别结果:', data.text, '(final:', data.is_final, ', confidence:', data.confidence, ')')
        if (asrStore.onASRResult) {
          asrStore.onASRResult(data.text, data.is_final, data.confidence)
        }
        break

      case 'asr_stopped':
        console.log('🎤 服务器确认ASR已停止')
        if (asrStore.onASRStopped) {
          asrStore.onASRStopped()
        }
        break

      case 'asr_error':
        console.error('❌ ASR识别错误:', data.error)
        if (asrStore.onASRError) {
          asrStore.onASRError(data.error)
        }
        break

      case 'error':
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

      default:
        console.log('🔍 未处理的消息类型:', data.type)
        break
    }
  }

  // 音频播放相关的状态变量
  const currentAudioRef = useRef(null)
  const currentAudioElementsRef = useRef([])
  const expectedOrderRef = useRef(1)
  const orderedAudioBufferRef = useRef(new Map())
  const audioQueueRef = useRef([])
  const isPlayingQueueRef = useRef(false)
  const isTTSGenerationCompleteRef = useRef(false)

  // 表情同步相关的状态变量
  const lastExpressionTimeRef = useRef(0)
  const currentExpressionRef = useRef(null)
  const EXPRESSION_DEBOUNCE_TIME = 1000 // 1秒防抖

  // 表情关键词映射表 - 按优先级排序，强烈情感优先
  const EXPRESSION_KEYWORDS = {
    // 强烈情感表情 - 高优先级
    'shengqi': ['生气', '愤怒', '讨厌', '烦死了', '气死了', '可恶', '混蛋'],
    'weiqu': ['委屈', '难过', '伤心', '呜呜', '好难过', '心疼'],
    'yanlei': ['哭', '眼泪', '流泪', '哭泣', '泪水', '呜呜呜'],
    'hahadaxiao': ['哈哈', '大笑', '笑死', '太好笑', '哈哈哈', '笑', '开心', '高兴', '快乐'],
    'jingya': ['惊讶', '什么', '怎么会', '不会吧', '天哪', '我的天', '震惊'],
    'jingxi': ['惊喜', '太好了', '棒', '厉害', 'amazing', '太棒了', 'wonderful'],

    // 中等情感表情 - 中优先级
    'haixiu': ['害羞', '不好意思', '羞涩', '脸红红', '好害羞'],
    'lianhong': ['脸红', '羞', '红脸', '害羞'],
    'aojiao': ['傲娇', '得意', '骄傲', '哼', '才不是', '略略略'],
    'tuosai': ['思考', '想想', '让我想想', '嗯嗯', '考虑', '琢磨'],
    'mimiyan': ['满足', '舒服', '嗯', '不错', '挺好', '还行'],

    // 温和表情 - 低优先级
    'wenroudexiao': ['微笑', '温柔', '好的', '嗯好', '可以', '没问题', '谢谢']
  }

  // 表情匹配函数
  const matchExpression = (text) => {
    if (!text || typeof text !== 'string') return null

    // 按优先级顺序检查关键词
    for (const [expression, keywords] of Object.entries(EXPRESSION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          console.log(`🎭 匹配到表情: ${expression} (关键词: ${keyword})`)
          return expression
        }
      }
    }

    return null
  }

  // 播放Live2D表情
  const playLive2DExpression = async (expressionName) => {
    try {
      const model = window.live2dModel
      if (!model) {
        console.log('🎭 Live2D模型未加载，跳过表情播放')
        return false
      }

      // 防抖检查
      const now = Date.now()
      if (now - lastExpressionTimeRef.current < EXPRESSION_DEBOUNCE_TIME) {
        console.log('🎭 表情切换过于频繁，跳过')
        return false
      }

      // 如果是相同表情，跳过
      if (currentExpressionRef.current === expressionName) {
        console.log('🎭 相同表情，跳过')
        return false
      }

      console.log(`🎭 开始播放Live2D表情: ${expressionName}`)

      // 使用与SettingsDrawer相同的表情播放逻辑
      let success = false

      // 方法1: 使用模型的expression方法
      if (typeof model.expression === 'function') {
        const result = model.expression(expressionName)
        success = typeof result?.then === 'function' ? await result : result !== false
      }

      // 方法2: 使用表情管理器
      if (!success && model.internalModel?.motionManager?.expressionManager) {
        const em = model.internalModel.motionManager.expressionManager
        if (typeof em.setExpression === 'function') {
          const result = em.setExpression(expressionName)
          success = typeof result?.then === 'function' ? await result : result !== false
        }
      }

      if (success) {
        lastExpressionTimeRef.current = now
        currentExpressionRef.current = expressionName
        console.log(`✅ Live2D表情播放成功: ${expressionName}`)
        return true
      } else {
        console.warn(`⚠️ Live2D表情播放失败: ${expressionName}`)
        return false
      }
    } catch (error) {
      console.error('❌ Live2D表情播放异常:', error)
      return false
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


  const recordLLMFirstToken = () => {
    console.log('⏱️ 记录LLM首字响应时间 - 待实现')
  }



  // 显示音频状态信息
  const showAudioStatus = () => {
    const status = getAudioStatus()
    console.log('🎵 音频状态:', status)

    if (!status.isUnlocked && status.pendingCount > 0) {
      showNotification(
        '音频播放受限',
        `有 ${status.pendingCount} 个音频等待播放，请点击页面任意位置启用音频`,
        'info'
      )
    }
  }

  // 处理有序音频缓冲区
  const processOrderedAudioBuffer = () => {
    const orderedAudioBuffer = orderedAudioBufferRef.current
    const audioQueue = audioQueueRef.current
    const expectedOrder = expectedOrderRef.current

    console.log(`🎵 处理有序音频缓冲区，期望顺序: ${expectedOrder}`)

    // 检查是否有期望顺序的音频片段
    while (orderedAudioBuffer.has(expectedOrder)) {
      const audioChunk = orderedAudioBuffer.get(expectedOrder)
      orderedAudioBuffer.delete(expectedOrder)

      // 将音频片段添加到播放队列
      audioQueue.push(audioChunk)
      console.log(`🎵 音频片段 #${expectedOrder} 已加入播放队列`)

      // 更新期望顺序
      expectedOrderRef.current = expectedOrder + 1

      // 如果没有在播放，开始播放队列
      if (!isPlayingQueueRef.current) {
        console.log('🎵 开始播放音频队列...')
        playAudioQueue()
      }
    }
  }

  // 播放音频队列
  const playAudioQueue = () => {
    const audioQueue = audioQueueRef.current

    if (audioQueue.length === 0) {
      console.log('🎵 音频队列为空，停止播放')
      isPlayingQueueRef.current = false
      return
    }

    if (isPlayingQueueRef.current) {
      console.log('🎵 音频队列正在播放中，跳过重复调用')
      return
    }

    isPlayingQueueRef.current = true
    console.log('🎵 开始播放音频队列，队列长度:', audioQueue.length)

    const playNextAudio = () => {
      if (audioQueue.length === 0) {
        console.log('🎵 音频队列播放完成')
        isPlayingQueueRef.current = false
        checkAllAudioPlaybackComplete()
        return
      }

      const audioChunk = audioQueue.shift()
      console.log('🎵 播放下一个音频片段，剩余队列长度:', audioQueue.length)

      try {
        // 使用基础播放函数播放音频
        playTTSAudioBase(audioChunk.data, audioChunk.format, playNextAudio)
      } catch (error) {
        console.error('❌ 播放音频片段失败:', error)
        // 继续播放下一个
        playNextAudio()
      }
    }

    playNextAudio()
  }

  // 检查所有音频播放是否完成
  const checkAllAudioPlaybackComplete = () => {
    const audioQueue = audioQueueRef.current
    const orderedAudioBuffer = orderedAudioBufferRef.current
    const isTTSGenerationComplete = isTTSGenerationCompleteRef.current

    console.log('🎵 检查音频播放完成状态:', {
      queueLength: audioQueue.length,
      bufferSize: orderedAudioBuffer.size,
      ttsComplete: isTTSGenerationComplete,
      isPlaying: isPlayingQueueRef.current
    })

    if (audioQueue.length === 0 && orderedAudioBuffer.size === 0 &&
      isTTSGenerationComplete && !isPlayingQueueRef.current) {
      // 实时获取最新的主动对话状态
      const { isProactiveChatEnabled } = useProactiveChatStore.getState();
      console.log('✅ 所有音频播放完成', isProactiveChatEnabled)
      // 可以在这里添加完成回调
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !!isProactiveChatEnabled) {
        wsRef.current.send(JSON.stringify({
          type: 'audio_playback_complete',
          message: '音频播放完成'
        }));
        console.log('📤 已通知服务端：音频播放完成');
      } else {
        console.log('⚠️ WebSocket未连接或关闭了主动对话，无法通知服务端音频播放完成');
      }
    }
  }

  // 基础音频播放函数（使用新的音频工具）
  const playTTSAudioBase = async (audioBase64, format = 'mp3', onComplete = null) => {
    try {
      console.log('🔊 开始处理TTS音频数据:', {
        format: format,
        base64Length: audioBase64.length,
        base64Sample: audioBase64.substring(0, 50) + '...'
      })

      // 停止当前播放的音频
      if (currentAudioRef.current) {
        console.log('⏹️ 停止当前播放的音频')
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      // 使用新的音频工具播放
      const audio = await playAudioFromBase64(audioBase64, format, 0.8)

      // 设置为当前音频
      currentAudioRef.current = audio
      currentAudioElementsRef.current.push(audio)

      // 启动Live2D嘴部同步
      if (window.__startLipSyncForAudio) {
        try {
          window.__startLipSyncForAudio(audio)
        } catch (error) {
          console.warn('⚠️ 嘴部同步启动失败:', error)
        }
      }

      // 设置事件监听器
      audio.onended = () => {
        console.log('音频播放完成')

        // 停止Live2D嘴部同步
        if (window.__stopLipSync) {
          window.__stopLipSync()
        }

        // 从跟踪列表中移除
        const index = currentAudioElementsRef.current.indexOf(audio)
        if (index > -1) {
          currentAudioElementsRef.current.splice(index, 1)
        }

        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null
        }

        // 调用完成回调
        if (onComplete) {
          onComplete()
        }
      }

      audio.onerror = (e) => {
        console.error('音频播放错误:', e)

        // 停止Live2D嘴部同步
        if (window.__stopLipSync) {
          window.__stopLipSync()
        }

        // 从跟踪列表中移除
        const index = currentAudioElementsRef.current.indexOf(audio)
        if (index > -1) {
          currentAudioElementsRef.current.splice(index, 1)
        }

        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null
        }

        // 调用完成回调
        if (onComplete) {
          onComplete()
        }
      }

      console.log('✅ 音频播放成功')

    } catch (error) {
      console.error('处理TTS音频数据失败:', error)

      // 如果是自动播放被阻止，显示用户提示
      if (error.name === 'NotAllowedError') {
        console.log('🔒 显示音频权限提示')
        showAudioPrompt(
          (success) => {
            if (success) {
              console.log('✅ 用户启用了音频，重试播放')
              // 重试播放
              playTTSAudioBase(audioBase64, format, onComplete)
            }
          },
          () => {
            console.log('❌ 用户取消了音频启用')
            if (onComplete) onComplete()
          }
        )
      } else {
        if (onComplete) {
          onComplete()
        }
      }
    }
  }

  // 主要的音频播放函数（用于单独播放）
  const playTTSAudio = (audioBase64, format = 'mp3') => {
    playTTSAudioBase(audioBase64, format)
  }

  // 带顺序号的流式TTS音频播放功能
  const playTTSAudioChunkWithOrder = (audioBase64, format = 'mp3', order = 0) => {
    try {
      console.log('🎵 处理带顺序号的音频片段:', {
        order: order,
        expectedOrder: expectedOrderRef.current,
        format: format,
        base64Length: audioBase64.length,
        bufferSize: orderedAudioBufferRef.current.size
      })

      // 验证base64数据
      if (!audioBase64 || audioBase64.length === 0) {
        console.error('❌ 音频数据为空')
        return
      }

      // 存储音频片段到有序缓冲区
      orderedAudioBufferRef.current.set(order, {
        data: audioBase64,
        format: format
      })
      console.log(`🎵 音频片段 #${order} 已存储到缓冲区`)

      // 尝试播放按顺序排列的音频片段
      processOrderedAudioBuffer()
    } catch (error) {
      console.error('❌ 处理带顺序号的TTS音频片段失败:', error)
    }
  }

  // 流式TTS音频播放功能（兼容旧版本）
  const playTTSAudioChunk = (audioBase64, format = 'mp3') => {
    try {
      console.log('🎵 处理流式音频片段:', {
        format: format,
        base64Length: audioBase64.length,
        isValidBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(audioBase64),
        currentQueueLength: audioQueueRef.current.length,
        isCurrentlyPlaying: isPlayingQueueRef.current
      })

      // 验证base64数据
      if (!audioBase64 || audioBase64.length === 0) {
        console.error('❌ 音频数据为空')
        return
      }

      // 将音频片段添加到队列
      audioQueueRef.current.push({
        data: audioBase64,
        format: format
      })
      console.log('🎵 音频片段已加入队列，当前队列长度:', audioQueueRef.current.length)

      // 如果没有在播放，开始播放队列
      if (!isPlayingQueueRef.current) {
        console.log('🎵 开始播放音频队列...')
        playAudioQueue()
      } else {
        console.log('🎵 音频队列正在播放中，片段已排队')
      }
    } catch (error) {
      console.error('❌ 处理流式TTS音频片段失败:', error)
    }
  }

  // TTS完成处理
  const onTTSComplete = () => {
    console.log('🎵 TTS生成完成，队列中还有', audioQueueRef.current.length, '个音频片段，缓冲区还有', orderedAudioBufferRef.current.size, '个片段')

    // 处理剩余的缓冲区音频（防止有遗漏的片段）
    if (orderedAudioBufferRef.current.size > 0) {
      console.log('🎵 处理缓冲区中剩余的音频片段...')
      // 按顺序处理剩余的音频片段
      const remainingOrders = Array.from(orderedAudioBufferRef.current.keys()).sort((a, b) => a - b)
      for (const order of remainingOrders) {
        const audioChunk = orderedAudioBufferRef.current.get(order)
        orderedAudioBufferRef.current.delete(order)
        audioQueueRef.current.push(audioChunk)
        console.log(`🎵 将缓冲区音频片段 #${order} 加入播放队列`)
      }

      // 如果没有在播放，开始播放队列
      if (!isPlayingQueueRef.current && audioQueueRef.current.length > 0) {
        console.log('🎵 开始播放剩余音频队列...')
        playAudioQueue()
      }
    }

    // 重置顺序号，为下次对话做准备
    expectedOrderRef.current = 1
    console.log('🎵 已重置音频顺序号，准备下次对话')

    // 标记TTS生成已完成
    isTTSGenerationCompleteRef.current = true

    // 检查是否所有音频都播放完成
    checkAllAudioPlaybackComplete()
  }

  const recordTTSFirstPacket = () => {
    console.log('⏱️ 记录TTS首包回复时间 - 待实现')
  }

  const updateProfileConversion = (activityInfo, conversionSummary) => {
    console.log('⚡ 更新档案转换 - 待实现')
  }

  // ASR事件处理函数已移至上方switch语句中直接调用asrStore方法

  const appendBotMessage = (message) => {
    console.log('💬 追加机器人消息 - 待实现')
  }

  // 监听全局音频停止事件
  useEffect(() => {
    const handleStopAllTTS = () => {
      console.log('🛑 收到全局停止TTS事件')

      // 停止Live2D嘴部同步
      if (window.__stopLipSync) {
        window.__stopLipSync()
      }

      // 停止当前播放的音频
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
        currentAudioRef.current = null
      }

      // 停止所有音频元素
      currentAudioElementsRef.current.forEach((audio) => {
        if (audio && !audio.paused) {
          audio.pause()
          audio.currentTime = 0
        }
      })
      currentAudioElementsRef.current = []

      // 清空音频队列
      audioQueueRef.current = []
      orderedAudioBufferRef.current.clear()

      // 重置播放状态
      isPlayingQueueRef.current = false
      expectedOrderRef.current = 1
      isTTSGenerationCompleteRef.current = false

      // 重置表情状态
      lastExpressionTimeRef.current = 0
      currentExpressionRef.current = null

      console.log('✅ 全局TTS停止完成')
    }

    const handleClearAudioQueue = () => {
      console.log('🗑️ 收到清空音频队列事件')
      audioQueueRef.current = []
      orderedAudioBufferRef.current.clear()
      isPlayingQueueRef.current = false
    }

    // 定期检查音频状态
    const checkAudioStatus = () => {
      showAudioStatus()
    }

    // 注册事件监听器
    window.addEventListener('stopAllTTS', handleStopAllTTS)
    window.addEventListener('clearAudioQueue', handleClearAudioQueue)

    // 每30秒检查一次音频状态
    const interval = setInterval(checkAudioStatus, 30000)

    return () => {
      window.removeEventListener('stopAllTTS', handleStopAllTTS)
      window.removeEventListener('clearAudioQueue', handleClearAudioQueue)
      clearInterval(interval)
    }
  }, [])

  // 监听用户变化，重新连接 WebSocket
  useEffect(() => {
    if (currentUser?.id) {
      connectWebSocket()
      // 更新欢迎消息（集成点 - 可以被聊天系统调用）
      switchToUser(currentUser)
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
