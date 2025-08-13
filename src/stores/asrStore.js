import { create } from 'zustand'

// ASR语音识别状态管理store
export const useASRStore = create((set, get) => ({
  // 录音状态
  recording: {
    isRecording: false,
    isSpaceKeyPressed: false,
    isSpaceKeyASRActive: false,
    isContinuousMode: false,
    recordingStartTime: null,
    spaceKeyStartTime: null,
    spaceKeyTimer: null,
    continuousSilenceTimer: null
  },

  // 识别结果
  recognition: {
    currentText: '',
    bestText: '',
    lastResultTime: null,
    confidence: 0
  },

  // 音频处理
  audio: {
    stream: null,
    context: null,
    processor: null,
    volumeThreshold: 0.01,
    source: null
  },

  // WebSocket连接
  connection: {
    ws: null,
    isConnected: false
  },

  // UI状态
  ui: {
    showStatus: false,
    statusText: '正在识别语音...',
    buttonText: '🎤',
    buttonTitle: '请使用长按空格键进行语音输入'
  },

  // 配置
  config: {
    spaceKeyHoldThreshold: 400, // 0.4秒
    sampleRate: 16000,
    autoSendTimer: null,
    continuousSilenceThreshold: 2000, // 2秒静音后停止持续模式
    autoSendDelay: 1500, // 1.5秒后自动发送
    // 聊天相关配置
    enablePreview: true, // 启用消息预览
    autoSendThreshold: 10, // 超过10个字符自动发送
    enableVoiceCommands: true, // 启用语音命令
    maxRetryAttempts: 3, // 最大重试次数
    networkTimeout: 10000, // 网络超时时间
    enableOfflineMode: false, // 离线模式
    audioQuality: 'high' // 音频质量: low, medium, high
  },

  // 聊天集成状态
  chat: {
    isIntegratedWithChat: false,
    currentChatId: null,
    replyToMessageId: null,
    messagePreview: '',
    sendStrategy: 'auto', // auto, manual, preview
    voiceCommandsEnabled: true
  },

  // 性能监控
  performance: {
    sessionStartTime: null,
    totalRecordingTime: 0,
    successfulRecognitions: 0,
    failedRecognitions: 0,
    averageConfidence: 0,
    networkLatency: 0
  },

  // 错误恢复
  errorRecovery: {
    retryCount: 0,
    lastError: null,
    isRecovering: false,
    fallbackMode: false
  },

  // 设置WebSocket连接
  setWebSocket: (ws) => {
    set((state) => ({
      connection: {
        ...state.connection,
        ws,
        isConnected: ws?.readyState === WebSocket.OPEN
      }
    }))
  },

  // 更新录音状态
  updateRecordingState: (updates) => {
    set((state) => ({
      recording: {
        ...state.recording,
        ...updates
      }
    }))
  },

  // 更新识别结果
  updateRecognitionResult: (text, isFinal = false, confidence = 0) => {
    const now = Date.now()
    
    set((state) => {
      const newState = {
        recognition: {
          ...state.recognition,
          currentText: text,
          lastResultTime: now,
          confidence
        }
      }

      // 如果当前结果比之前的结果更长或更有意义，就更新最佳结果
      if (text && text.trim() && (text.length > state.recognition.bestText.length || !state.recognition.bestText)) {
        // 过滤掉纯标点符号
        if (text.trim() !== '。' && text.trim() !== '，' && text.trim() !== '？' && text.trim() !== '！') {
          newState.recognition.bestText = text
        }
      }

      return newState
    })
  },

  // 更新UI状态
  updateUIState: (updates) => {
    set((state) => ({
      ui: {
        ...state.ui,
        ...updates
      }
    }))
  },

  // 聊天集成相关方法
  // 设置聊天集成
  setChatIntegration: (chatId, options = {}) => {
    set((state) => ({
      chat: {
        ...state.chat,
        isIntegratedWithChat: true,
        currentChatId: chatId,
        sendStrategy: options.sendStrategy || 'auto',
        voiceCommandsEnabled: options.enableVoiceCommands !== false
      }
    }))
    console.log('🔗 ASR已集成到聊天:', chatId)
  },

  // 设置回复消息
  setReplyToMessage: (messageId) => {
    set((state) => ({
      chat: {
        ...state.chat,
        replyToMessageId: messageId
      }
    }))
    console.log('💬 设置回复消息:', messageId)
  },

  // 清除回复消息
  clearReplyToMessage: () => {
    set((state) => ({
      chat: {
        ...state.chat,
        replyToMessageId: null
      }
    }))
  },

  // 设置消息预览
  setMessagePreview: (text) => {
    set((state) => ({
      chat: {
        ...state.chat,
        messagePreview: text
      }
    }))
  },

  // 智能发送策略判断
  shouldAutoSend: (text) => {
    const { config, chat } = get()

    // 如果是手动模式，不自动发送
    if (chat.sendStrategy === 'manual') return false

    // 如果是预览模式，不自动发送
    if (chat.sendStrategy === 'preview') return false

    // 检查文本长度
    if (text.length < config.autoSendThreshold) return false

    // 检查是否包含语音命令
    if (config.enableVoiceCommands && get().isVoiceCommand(text)) return false

    return true
  },

  // 语音命令检测
  isVoiceCommand: (text) => {
    const commands = ['发送', '取消', '重新录制', '删除', '编辑', '回复']
    return commands.some(cmd => text.includes(cmd))
  },

  // 开始长按空格键ASR
  startSpaceKeyASR: async () => {
    const { recording, startASR, updateUIState, updateRecordingState } = get()
    
    if (recording.isSpaceKeyASRActive) return

    try {
      updateRecordingState({ isSpaceKeyASRActive: true })
      console.log('🎤 开始长按空格键ASR模式')

      // 显示ASR状态
      updateUIState({
        showStatus: true,
        statusText: '长按空格键识别中...'
      })

      // 重置识别结果
      set((state) => ({
        recognition: {
          ...state.recognition,
          currentText: '',
          bestText: ''
        }
      }))

      // 启动ASR
      await startASR()
    } catch (error) {
      console.error('启动长按空格键ASR失败:', error)
      updateRecordingState({ isSpaceKeyASRActive: false })
      updateUIState({ showStatus: false })
    }
  },

  // 停止长按空格键ASR
  stopSpaceKeyASR: async () => {
    const { recording, recognition, stopASR, updateRecordingState, updateUIState } = get()

    if (!recording.isSpaceKeyASRActive) return

    console.log('🎤 停止长按空格键ASR模式')
    updateRecordingState({ isSpaceKeyASRActive: false })

    try {
      // 停止ASR
      await stopASR()

      // 等待一小段时间让ASR处理完最后的结果
      setTimeout(() => {
        const currentState = get()
        const bestText = currentState.recognition.bestText

        // 如果有识别结果，触发回调
        if (bestText && bestText.trim()) {
          console.log('🎤 长按空格键ASR完成，结果:', bestText)

          // 这里可以触发自定义事件或回调
          const event = new CustomEvent('asrResult', {
            detail: { text: bestText.trim() }
          })
          window.dispatchEvent(event)
        } else {
          console.log('🎤 长按空格键ASR无有效结果')
        }

        updateUIState({ showStatus: false })
      }, 500)
    } catch (error) {
      console.error('停止长按空格键ASR失败:', error)
      updateUIState({ showStatus: false })
    }
  },

  // 开始持续模式ASR
  startContinuousASR: async () => {
    const { recording, startASR, updateUIState, updateRecordingState } = get()

    if (recording.isContinuousMode) return

    try {
      updateRecordingState({ isContinuousMode: true })
      console.log('🎤 开始持续模式ASR')

      // 显示ASR状态
      updateUIState({
        showStatus: true,
        statusText: '持续识别模式已启动...'
      })

      // 重置识别结果
      set((state) => ({
        recognition: {
          ...state.recognition,
          currentText: '',
          bestText: ''
        }
      }))

      // 启动ASR
      await startASR()
    } catch (error) {
      console.error('启动持续模式ASR失败:', error)
      updateRecordingState({ isContinuousMode: false })
      updateUIState({ showStatus: false })
    }
  },

  // 停止持续模式ASR
  stopContinuousASR: async () => {
    const { recording, recognition, stopASR, updateRecordingState, updateUIState } = get()

    if (!recording.isContinuousMode) return

    console.log('🎤 停止持续模式ASR')
    updateRecordingState({
      isContinuousMode: false,
      continuousSilenceTimer: null
    })

    try {
      // 清除沉默检测定时器
      if (recording.continuousSilenceTimer) {
        clearTimeout(recording.continuousSilenceTimer)
      }

      // 停止ASR
      await stopASR()

      // 如果有识别结果，触发回调
      const bestText = recognition.bestText
      if (bestText && bestText.trim()) {
        console.log('🎤 持续模式ASR完成，结果:', bestText)

        const event = new CustomEvent('asrResult', {
          detail: { text: bestText.trim() }
        })
        window.dispatchEvent(event)
      }

      updateUIState({ showStatus: false })
    } catch (error) {
      console.error('停止持续模式ASR失败:', error)
      updateUIState({ showStatus: false })
    }
  },

  // 开始ASR录音
  startASR: async () => {
    const { connection, updateRecordingState, updateUIState, onASRError } = get()

    try {
      console.log('🎤 开始ASR录音')

      // 请求麦克风权限
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      // 创建AudioContext用于音频处理
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      })
      
      const source = audioContext.createMediaStreamSource(audioStream)
      const processor = audioContext.createScriptProcessor(1024, 1, 1)

      // 音频处理
      processor.onaudioprocess = (event) => {
        const currentState = get()
        const { recording, connection, audio } = currentState

        if (recording.isRecording && connection.ws && connection.ws.readyState === WebSocket.OPEN) {
          const inputBuffer = event.inputBuffer
          const inputData = inputBuffer.getChannelData(0)

          // 计算音量（RMS值）
          let sum = 0
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i]
          }
          const rms = Math.sqrt(sum / inputData.length)
          const isSilent = rms < audio.volumeThreshold

          // 转换为16位PCM
          const pcmData = new Int16Array(inputData.length)
          for (let i = 0; i < inputData.length; i++) {
            const sample = Math.max(-1, Math.min(1, inputData[i]))
            pcmData[i] = sample * 0x7FFF
          }

          // 转换为base64并发送
          const base64String = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)))
          
          connection.ws.send(JSON.stringify({
            type: 'audio_chunk',
            audio_data: base64String
          }))

          console.log('🎤 发送PCM音频数据块:', base64String.length, 'chars, 音量:', rms.toFixed(4), isSilent ? '(静音)' : '(有声)')
        }
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      // 保存音频相关对象
      set((state) => ({
        audio: {
          ...state.audio,
          stream: audioStream,
          context: audioContext,
          processor,
          source
        }
      }))

      // 开始录音
      updateRecordingState({
        isRecording: true,
        recordingStartTime: Date.now()
      })

      updateUIState({
        buttonText: '🔴',
        buttonTitle: '点击停止录音'
      })

      // 通知服务器开始ASR
      if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({
          type: 'start_asr'
        }))
      }

    } catch (error) {
      console.error('❌ 启动ASR失败:', error)
      onASRError(`启动录音失败: ${error.message}`)
    }
  },

  // 停止ASR录音
  stopASR: async () => {
    const { audio, config, updateRecordingState, updateUIState, connection } = get()

    try {
      console.log('🎤 停止ASR录音')

      // 清除自动发送定时器
      if (config.autoSendTimer) {
        clearTimeout(config.autoSendTimer)
        set((state) => ({
          config: {
            ...state.config,
            autoSendTimer: null
          }
        }))
      }

      // 清理AudioContext资源
      if (audio.processor) {
        audio.processor.disconnect()
      }
      if (audio.context) {
        audio.context.close()
      }
      if (audio.stream) {
        audio.stream.getTracks().forEach(track => track.stop())
      }

      // 重置音频状态
      set((state) => ({
        audio: {
          ...state.audio,
          stream: null,
          context: null,
          processor: null,
          source: null
        }
      }))

      updateRecordingState({
        isRecording: false,
        recordingStartTime: null
      })

      // 重置识别结果
      set((state) => ({
        recognition: {
          ...state.recognition,
          currentText: '',
          lastResultTime: null
        }
      }))

      updateUIState({
        buttonText: '🎤',
        buttonTitle: '请使用长按空格键进行语音输入'
      })

      // 通知服务器停止ASR
      if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({
          type: 'stop_asr'
        }))
      }

    } catch (error) {
      console.error('❌ 停止ASR失败:', error)
      get().onASRError(`停止录音失败: ${error.message}`)
    }
  },

  // ASR启动处理
  onASRStarted: () => {
    console.log('🎤 ASR识别已启动')

    const { updateUIState } = get()

    // 更新UI状态
    updateUIState({
      showStatus: true,
      statusText: '正在识别语音...'
    })

    // 触发DOM更新事件
    const event = new CustomEvent('asrUIUpdate', {
      detail: {
        type: 'started',
        text: '正在识别语音...'
      }
    })
    window.dispatchEvent(event)
  },

  // ASR结果处理 - 增强版本
  onASRResult: (text, isFinal = false, confidence = 0) => {
    const { recording, recognition, config, updateRecognitionResult, updateUIState, startAutoSendDetection } = get()

    console.log('🎤 ASR结果:', text, '(final:', isFinal, ', confidence:', confidence, ')')

    // 更新当前识别文本和时间
    const now = Date.now()
    set((state) => ({
      recognition: {
        ...state.recognition,
        currentText: text,
        lastResultTime: now,
        confidence
      }
    }))

    // 如果当前结果比之前的结果更长或更有意义，就更新最佳结果
    if (text && text.trim() && (text.length > recognition.bestText.length || !recognition.bestText)) {
      // 过滤掉纯标点符号
      if (text.trim() !== '。' && text.trim() !== '，' && text.trim() !== '？' && text.trim() !== '！') {
        set((state) => ({
          recognition: {
            ...state.recognition,
            bestText: text
          }
        }))
      }
    }

    // 长按空格键ASR模式处理
    if (recording.isSpaceKeyASRActive) {
      if (text && text.trim()) {
        // 实时更新显示，但不发送消息
        updateUIState({
          statusText: `长按识别: ${text}`
        })

        console.log('🎤 长按空格键识别结果:', text, '(final:', isFinal, ')')

        // 触发输入框更新事件
        const event = new CustomEvent('asrInputUpdate', {
          detail: { text, mode: 'spaceKey' }
        })
        window.dispatchEvent(event)

        // 触发实时结果事件
        const realtimeEvent = new CustomEvent('asrRealtimeResult', {
          detail: { text, isFinal, confidence }
        })
        window.dispatchEvent(realtimeEvent)

        // 更新最佳结果
        if (text.trim() !== '。' && text.trim() !== '，' && text.trim() !== '？' && text.trim() !== '！') {
          set((state) => ({
            recognition: {
              ...state.recognition,
              bestText: text
            }
          }))
        }
      }
      // 长按模式不自动发送，等待用户松开空格键
      return
    }

    // 持续模式处理
    if (recording.isContinuousMode) {
      if (text && text.trim()) {
        // 实时更新显示
        updateUIState({
          statusText: `持续识别: ${text}`
        })

        console.log('🎤 持续模式识别结果:', text, '(final:', isFinal, ')')

        // 触发输入框更新事件
        const event = new CustomEvent('asrInputUpdate', {
          detail: { text, mode: 'continuous' }
        })
        window.dispatchEvent(event)

        // 更新最佳结果
        if (text.trim() !== '。' && text.trim() !== '，' && text.trim() !== '？' && text.trim() !== '！') {
          set((state) => ({
            recognition: {
              ...state.recognition,
              bestText: text
            }
          }))
        }
      }
      // 持续模式不需要手动发送，由沉默检测自动处理
      return
    }

    // 非持续模式的原有逻辑
    if (isFinal) {
      // 最终结果 - 但不依赖最终结果来发送消息
      console.log('🎤 ASR最终结果:', text)

      let finalText = text
      // 如果最终结果不是纯标点符号，使用它
      if (text && text.trim() && text.trim() !== '。' && text.trim() !== '，' && text.trim() !== '？' && text.trim() !== '！') {
        finalText = text
        updateUIState({
          statusText: `识别完成: ${text}`
        })
      } else {
        // 最终结果是标点符号，使用最佳结果
        finalText = recognition.bestText
        updateUIState({
          statusText: `识别完成: ${recognition.bestText}`
        })
        console.log('🎤 最终结果为标点，使用最佳结果:', recognition.bestText)
      }

      // 触发输入框更新事件
      const event = new CustomEvent('asrInputUpdate', {
        detail: { text: finalText, mode: 'final' }
      })
      window.dispatchEvent(event)

      // 清除自动发送定时器
      if (config.autoSendTimer) {
        clearTimeout(config.autoSendTimer)
        set((state) => ({
          config: {
            ...state.config,
            autoSendTimer: null
          }
        }))
      }
    } else {
      // 中间结果，实时更新输入框和显示
      updateUIState({
        statusText: `识别中: ${text}`
      })

      console.log('🎤 ASR中间结果:', text)

      // 触发输入框更新事件
      const event = new CustomEvent('asrInputUpdate', {
        detail: { text, mode: 'intermediate' }
      })
      window.dispatchEvent(event)

      // 重置自动发送定时器
      if (config.autoSendTimer) {
        clearTimeout(config.autoSendTimer)
        set((state) => ({
          config: {
            ...state.config,
            autoSendTimer: null
          }
        }))
      }
    }
  },

  // ASR停止处理
  onASRStopped: () => {
    console.log('🎤 ASR识别已停止')

    const { recording, updateRecordingState, updateUIState, updateContinuousASRUI, updateASRUI } = get()

    updateRecordingState({ isRecording: false })

    if (recording.isContinuousMode) {
      updateContinuousASRUI()
    } else {
      updateASRUI()
    }

    // 触发DOM更新事件
    const event = new CustomEvent('asrUIUpdate', {
      detail: {
        type: 'stopped',
        mode: recording.isContinuousMode ? 'continuous' : 'normal'
      }
    })
    window.dispatchEvent(event)
  },

  // ASR错误处理 - 增强版本
  onASRError: (error) => {
    console.error('❌ ASR错误:', error)

    const { recording, updateRecordingState, updateUIState, audio, config, showVoiceChangeNotification } = get()

    updateRecordingState({
      isRecording: false,
      isSpaceKeyASRActive: false,
      isContinuousMode: false,
      continuousSilenceTimer: null
    })

    updateUIState({
      showStatus: false,
      buttonText: '🎤',
      buttonTitle: '请使用长按空格键进行语音输入'
    })

    // 清除定时器
    if (config.autoSendTimer) {
      clearTimeout(config.autoSendTimer)
      set((state) => ({
        config: {
          ...state.config,
          autoSendTimer: null
        }
      }))
    }

    // 清除持续模式沉默检测定时器
    if (recording.continuousSilenceTimer) {
      clearTimeout(recording.continuousSilenceTimer)
    }

    // 根据错误类型显示不同的提示
    let errorMessage = error
    if (error.includes('coroutine')) {
      errorMessage = '语音识别服务内部错误，请重试'
    } else if (error.includes('会话未激活')) {
      errorMessage = '语音识别会话已断开，请重新开始录音'
    } else if (error.includes('音频')) {
      errorMessage = '音频处理出现问题，请检查麦克风'
    } else if (error.includes('连接')) {
      errorMessage = '网络连接问题，请检查网络'
    }

    // 显示错误提示
    showVoiceChangeNotification(`语音识别: ${errorMessage}`, 'error')

    // 清理资源
    if (audio.processor) {
      audio.processor.disconnect()
    }
    if (audio.context) {
      audio.context.close()
    }
    if (audio.stream) {
      audio.stream.getTracks().forEach(track => track.stop())
    }

    // 重置音频状态
    set((state) => ({
      audio: {
        ...state.audio,
        stream: null,
        context: null,
        processor: null,
        source: null
      }
    }))

    // 触发错误事件
    const event = new CustomEvent('asrError', {
      detail: { error: errorMessage }
    })
    window.dispatchEvent(event)
  },

  // 辅助函数：自动发送检测
  startAutoSendDetection: () => {
    const { config, recognition } = get()

    // 清除现有定时器
    if (config.autoSendTimer) {
      clearTimeout(config.autoSendTimer)
    }

    // 设置新的自动发送定时器
    const timer = setTimeout(() => {
      const currentState = get()
      const bestText = currentState.recognition.bestText

      if (bestText && bestText.trim()) {
        console.log('🎤 自动发送检测触发:', bestText)

        // 触发自动发送事件
        const event = new CustomEvent('asrAutoSend', {
          detail: { text: bestText.trim() }
        })
        window.dispatchEvent(event)
      }
    }, config.autoSendDelay)

    set((state) => ({
      config: {
        ...state.config,
        autoSendTimer: timer
      }
    }))
  },

  // 辅助函数：更新持续模式UI
  updateContinuousASRUI: () => {
    const { updateUIState } = get()

    updateUIState({
      buttonText: '🎤',
      buttonTitle: '持续模式已停止',
      showStatus: false
    })

    // 触发UI更新事件
    const event = new CustomEvent('asrUIUpdate', {
      detail: {
        type: 'continuousStop'
      }
    })
    window.dispatchEvent(event)
  },

  // 辅助函数：更新普通模式UI
  updateASRUI: () => {
    const { updateUIState } = get()

    updateUIState({
      buttonText: '🎤',
      buttonTitle: '请使用长按空格键进行语音输入',
      showStatus: false
    })

    // 触发UI更新事件
    const event = new CustomEvent('asrUIUpdate', {
      detail: {
        type: 'normalStop'
      }
    })
    window.dispatchEvent(event)
  },

  // 辅助函数：显示语音变更通知
  showVoiceChangeNotification: (message, type = 'info') => {
    console.log(`🔔 通知: ${message} (${type})`)

    // 触发通知事件
    const event = new CustomEvent('asrNotification', {
      detail: {
        message,
        type
      }
    })
    window.dispatchEvent(event)
  },

  // 性能监控方法
  // 开始性能监控会话
  startPerformanceSession: () => {
    set((state) => ({
      performance: {
        ...state.performance,
        sessionStartTime: Date.now(),
        totalRecordingTime: 0,
        successfulRecognitions: 0,
        failedRecognitions: 0
      }
    }))
  },

  // 记录识别成功
  recordRecognitionSuccess: (confidence) => {
    set((state) => {
      const newSuccessCount = state.performance.successfulRecognitions + 1
      const newAvgConfidence = (
        (state.performance.averageConfidence * state.performance.successfulRecognitions + confidence) /
        newSuccessCount
      )

      return {
        performance: {
          ...state.performance,
          successfulRecognitions: newSuccessCount,
          averageConfidence: newAvgConfidence
        }
      }
    })
  },

  // 记录识别失败
  recordRecognitionFailure: () => {
    set((state) => ({
      performance: {
        ...state.performance,
        failedRecognitions: state.performance.failedRecognitions + 1
      }
    }))
  },

  // 获取性能统计
  getPerformanceStats: () => {
    const { performance } = get()
    const sessionDuration = performance.sessionStartTime ?
      Date.now() - performance.sessionStartTime : 0

    return {
      ...performance,
      sessionDuration,
      successRate: performance.successfulRecognitions /
        (performance.successfulRecognitions + performance.failedRecognitions) || 0
    }
  },

  // 错误恢复方法
  // 开始错误恢复
  startErrorRecovery: (error) => {
    const { errorRecovery, config } = get()

    set((state) => ({
      errorRecovery: {
        ...state.errorRecovery,
        retryCount: state.errorRecovery.retryCount + 1,
        lastError: error,
        isRecovering: true
      }
    }))

    // 如果重试次数超过限制，启用降级模式
    if (errorRecovery.retryCount >= config.maxRetryAttempts) {
      set((state) => ({
        errorRecovery: {
          ...state.errorRecovery,
          fallbackMode: true
        }
      }))
      console.log('🔄 启用ASR降级模式')
    }
  },

  // 完成错误恢复
  completeErrorRecovery: () => {
    set((state) => ({
      errorRecovery: {
        ...state.errorRecovery,
        isRecovering: false,
        retryCount: 0
      }
    }))
  },

  // 重置错误状态
  resetErrorState: () => {
    set((state) => ({
      errorRecovery: {
        retryCount: 0,
        lastError: null,
        isRecovering: false,
        fallbackMode: false
      }
    }))
  },

  // 语音命令处理
  processVoiceCommand: (text) => {
    const { chat, config } = get()

    if (!config.enableVoiceCommands) return false

    const lowerText = text.toLowerCase()

    // 发送命令
    if (lowerText.includes('发送')) {
      const event = new CustomEvent('asrVoiceCommand', {
        detail: { command: 'send', text: chat.messagePreview }
      })
      window.dispatchEvent(event)
      return true
    }

    // 取消命令
    if (lowerText.includes('取消')) {
      const event = new CustomEvent('asrVoiceCommand', {
        detail: { command: 'cancel' }
      })
      window.dispatchEvent(event)
      return true
    }

    // 重新录制命令
    if (lowerText.includes('重新录制') || lowerText.includes('重录')) {
      const event = new CustomEvent('asrVoiceCommand', {
        detail: { command: 'retry' }
      })
      window.dispatchEvent(event)
      return true
    }

    // 删除命令
    if (lowerText.includes('删除')) {
      const event = new CustomEvent('asrVoiceCommand', {
        detail: { command: 'delete' }
      })
      window.dispatchEvent(event)
      return true
    }

    return false
  },

  // 网络状态检测
  checkNetworkStatus: async () => {
    const startTime = Date.now()

    try {
      // 简单的网络延迟检测
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache'
      })

      const latency = Date.now() - startTime

      set((state) => ({
        performance: {
          ...state.performance,
          networkLatency: latency
        }
      }))

      return {
        online: response.ok,
        latency
      }
    } catch (error) {
      console.warn('网络状态检测失败:', error)
      return {
        online: false,
        latency: -1
      }
    }
  },

  // 重置所有状态
  reset: () => {
    const { audio, config, recording } = get()

    // 清理资源
    if (audio.processor) {
      audio.processor.disconnect()
    }
    if (audio.context) {
      audio.context.close()
    }
    if (audio.stream) {
      audio.stream.getTracks().forEach(track => track.stop())
    }
    if (config.autoSendTimer) {
      clearTimeout(config.autoSendTimer)
    }
    if (recording.continuousSilenceTimer) {
      clearTimeout(recording.continuousSilenceTimer)
    }

    set({
      recording: {
        isRecording: false,
        isSpaceKeyPressed: false,
        isSpaceKeyASRActive: false,
        isContinuousMode: false,
        recordingStartTime: null,
        spaceKeyStartTime: null,
        spaceKeyTimer: null,
        continuousSilenceTimer: null
      },
      recognition: {
        currentText: '',
        bestText: '',
        lastResultTime: null,
        confidence: 0
      },
      audio: {
        stream: null,
        context: null,
        processor: null,
        volumeThreshold: 0.01,
        source: null
      },
      ui: {
        showStatus: false,
        statusText: '正在识别语音...',
        buttonText: '🎤',
        buttonTitle: '请使用长按空格键进行语音输入'
      },
      config: {
        ...get().config,
        autoSendTimer: null
      }
    })
  }
}))

export default useASRStore
