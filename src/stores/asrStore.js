import {create} from 'zustand'
// ASR语音识别状态管理store - 重构优化版本
export const useASRStore = create((set, get) => ({
  // ===================
  // 核心状态
  // ===================
  // 录音状态
  status: {
    isRecording: false,
    isSpaceKeyActive: false,
    mode: 'idle', // 'idle' | 'spacekey'
    serverConfirmed: false,
    startTime: null
  },
  // 识别结果
  recognition: {
    currentText: '',
    finalText: '',
    confidence: 0,
    lastUpdateTime: null,
    // 简化的文本机制
    lastCompleteText: '', // 最后一个完整的文本（is_final: false）
    lastFragmentTime: null // 最后收到文本的时间
  },
  // 连接状态
  connection: {
    ws: null,
    isConnected: false,
    lastError: null
  },
  // 音频资源
  audio: {
    stream: null,
    context: null,
    processor: null,
    volumeThreshold: 0.01,
    lastChunkSentTime: null, // 最后一个音频块发送时间
    pendingChunks: 0 // 待发送的音频块数量
  },
  // 配置
  config: {
    sampleRate: 16000,
    spaceKeyThreshold: 300, // 300ms长按阈值
    silenceTimeout: 2000 // 2秒静音超时
  },
  // ===================
  // 新增：textarea状态管理
  // ===================
  // textarea状态
  textarea: {
    message: '',
    isSending: false,
    maxLength: 1000,
    textareaRef: null // textarea的ref引用
  },
  // 空格键状态
  spaceKey: {
    isPressed: false,
    startTime: null,
    duration: 0
  },
  // ===================
  // textarea相关方法
  // ===================
  // 设置消息内容
  setMessage: (message) => {
    set((state) => ({
      textarea: {
        ...state.textarea,
        message
      }
    }))
  },

  // 设置发送状态
  setIsSending: (isSending) => {
    set((state) => ({
      textarea: {
        ...state.textarea,
        isSending
      }
    }))
  },
  // 清空消息
  clearMessage: () => {
    set((state) => ({
      textarea: {
        ...state.textarea,
        message: ''
      }
    }))
  },
  // 获取当前消息
  getCurrentMessage: () => {
    return get().textarea.message
  },
  // 设置textarea引用
  setTextareaRef: (ref) => {
    set((state) => ({
      textarea: {
        ...state.textarea,
        textareaRef: ref
      }
    }))
  },
  // 自动调整textarea高度
  autoResizeTextarea: () => {
    const textareaRef = get().textarea.textareaRef
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  },
  // 处理输入变化
  handleInputChange: (e) => {
    const newValue = e.target.value
    get().setMessage(newValue)
    get().autoResizeTextarea()
  },
  // ===================
  // 空格键相关方法
  // ===================
  // 开始空格键按下
  startSpaceKeyPress: () => {
    const startTime = Date.now()
    set((state) => ({
      spaceKey: {
        ...state.spaceKey,
        isPressed: true,
        startTime,
        duration: 0
      }
    }))
    console.log('🎤 空格键按下开始:', startTime)
  },
  // 结束空格键按下
  endSpaceKeyPress: () => {
    const { spaceKey } = get()
    const duration = spaceKey.startTime ? Date.now() - spaceKey.startTime : 0

    set((state) => ({
      spaceKey: {
        ...state.spaceKey,
        isPressed: false,
        duration,
        startTime: null
      }
    }))
    console.log('🎤 空格键按下结束，持续时间:', duration)
    return duration
  },
  // 检查是否可以开始ASR
  canStartASR: () => {
    const { status, textarea, spaceKey } = get()
    return !spaceKey.isPressed &&
           !status.isSpaceKeyActive &&
           !textarea.isSending
  },
  // ===================
  // 核心方法
  // ===================
  // 设置WebSocket连接
  setWebSocketRef: (ws) => {
    set((state) => ({
      connection: {
        ...state.connection,
        ws,
        isConnected: ws?.readyState === WebSocket.OPEN,
        lastError: null
      }
    }))
    console.log('🔌 ASR WebSocket连接已设置:', !!ws)
  },
  // 一个获取 connection的isConnected的 方法
  getIsConnected: () => {
    return get().connection.isConnected
  },
  // ===================
  // 长按空格键ASR
  // ===================
  // 开始长按空格键ASR
  startSpaceKeyASR: async () => {
    const {status} = get()
    if (status.isSpaceKeyActive || status.isRecording) {
      console.log('🎤 ASR已在运行中，跳过')
      return
    }
    console.log('🎤 开始长按空格键ASR')
    try {
      // 更新状态
      set((state) => ({
        status: {
          ...state.status,
          isSpaceKeyActive: true,
          mode: 'spacekey',
          startTime: Date.now()
        },
        recognition: {
          ...state.recognition,
          currentText: '',
          finalText: '',
          confidence: 0
        }
      }))
      // 启动录音
      await get().startRecording()
    } catch (error) {
      console.error('❌ 启动长按空格键ASR失败:', error)
      get().handleASRError(error.message)
    }
  },
  // 停止长按空格键ASR（极简版本）
  stopSpaceKeyASR: async () => {
    const {status} = get()
    if (!status.isSpaceKeyActive) {
      return
    }
    console.log('🎤 停止长按空格键ASR（极简策略）')
    try {
      // 1. 立即停止本地录音（停止发送新音频）
      await get().stopRecordingOnly()
      // 2. 延迟发送stop_asr，等待后端处理完剩余音频
      setTimeout(() => {
        console.log('⏰ 延迟发送stop_asr（允许后端处理完剩余音频）')
        get().sendStopASR()
      }, 2000) // 延迟发送stop_asr
    } catch (error) {
      console.error('❌ 停止长按空格键ASR失败:', error)
      get().handleASRError(error.message)
    }
  },
  // 发送stop_asr到后端
  sendStopASR: () => {
    const {connection} = get()
    if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({
        type: 'stop_asr',
        timestamp: Date.now(),
        mode: 'spacekey'
      }))
      console.log('📤 发送stop_asr到后端')
    }
  },
  // ===================
  // 录音控制
  // ===================
  // 开始录音
  startRecording: async () => {
    const {connection} = get()
    try {
      console.log('🎤 开始录音')
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })
      // 创建AudioContext
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      })
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(1024, 1, 1)
      // 音频处理
      processor.onaudioprocess = (event) => {
        const {status, connection} = get()
        if (!status.isRecording || !connection.ws || connection.ws.readyState !== WebSocket.OPEN) {
          return
        }
        const inputBuffer = event.inputBuffer
        const inputData = inputBuffer.getChannelData(0)
        // 转换为16位PCM
        const pcmData = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          const sample = Math.max(-1, Math.min(1, inputData[i]))
          pcmData[i] = sample * 0x7FFF
        }
        // 发送音频数据
        const base64String = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)))
        const now = Date.now()
        try {
          connection.ws.send(JSON.stringify({
            type: 'audio_chunk',
            audio_data: base64String,
            timestamp: now
          }))
          // 更新最后发送时间
          set((state) => ({
            audio: {
              ...state.audio,
              lastChunkSentTime: now
            }
          }))
        } catch (error) {
          console.error('❌ 发送音频数据失败:', error)
        }
      }
      source.connect(processor)
      processor.connect(audioContext.destination)
      // 保存音频资源
      set((state) => ({
        audio: {
          ...state.audio,
          stream,
          context: audioContext,
          processor
        },
        status: {
          ...state.status,
          isRecording: true
        }
      }))
      // 通知服务器开始ASR
      if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({
          type: 'start_asr',
          timestamp: Date.now(),
          mode: get().status.mode
        }))
        console.log('📤 发送start_asr消息')
      } else {
        throw new Error('WebSocket连接不可用')
      }
    } catch (error) {
      console.error('❌ 启动录音失败:', error)
      throw error
    }
  },
  // 仅停止录音，不发送stop_asr
  stopRecordingOnly: async () => {
    const {audio} = get()
    try {
      console.log('🎤 停止录音（仅本地）')
      // 清理音频资源
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
          stream: null,
          context: null,
          processor: null,
          volumeThreshold: 0.01,
          lastChunkSentTime: null,
          pendingChunks: 0
        },
        status: {
          ...state.status,
          isRecording: false
        }
      }))
    } catch (error) {
      console.error('❌ 停止录音失败:', error)
      throw error
    }
  },
  // ===================
  // WebSocket事件处理
  // ===================
  // ASR启动确认（来自服务器）
  onASRStarted: () => {
    console.log('🎤 服务器确认ASR已启动')
    set((state) => ({
      status: {
        ...state.status,
        serverConfirmed: true
      }
    }))
  },
  // ASR结果处理（来自服务器）
  onASRResult: (text, isFinal = false, confidence = 0) => {
    console.log(`🎤 ASR结果: "${text}" (final: ${isFinal}, confidence: ${confidence})`)
    if (!text || text.trim() === '') {
      console.log('🎤 忽略空文本结果')
      return
    }
    const now = Date.now()
    // 关键逻辑：保存最后一个完整的文本（is_final: false）
    if (!isFinal) {
      // 非final结果，保存为完整文本
      set((state) => ({
        recognition: {
          ...state.recognition,
          currentText: text,
          lastCompleteText: text, // 保存最后一个完整文本
          confidence,
          lastUpdateTime: now,
          lastFragmentTime: now
        }
      }))
      console.log('📝 保存完整文本:', text)

      // 直接更新textarea内容
      const trimmedText = text.trim()
      if (trimmedText) {
        get().setMessage(trimmedText)
        setTimeout(() => get().autoResizeTextarea(), 0)
      }
    } else {
      // is_final: true 时，只更新当前文本，不覆盖完整文本
      set((state) => ({
        recognition: {
          ...state.recognition,
          currentText: text,
          confidence,
          lastUpdateTime: now,
          lastFragmentTime: now
        }
      }))
      console.log('🎯 收到final结果（标点符号）:', text)
    }
    // 如果收到final结果，触发完成事件
    if (isFinal) {
      console.log('✅ 收到最终结果，触发ASR完成')
      const finalText = get().recognition.lastCompleteText || text || ''
      get().triggerASRComplete(finalText, 'final_received')
      return
    }
  },
  // ASR停止确认（来自服务器）
  onASRStopped: () => {
    console.log('🎤 服务器确认ASR已停止')
    const {recognition} = get()
    // 直接使用最后完整文本完成ASR
    const finalText = recognition.lastCompleteText || recognition.currentText || ''
    console.log('✅ 收到停止信号，使用最后完整文本完成ASR:', finalText)
    get().triggerASRComplete(finalText, 'stopped')
  },
  // ASR错误处理
  onASRError: (error) => {
    console.error('❌ ASR错误:', error)
    get().handleASRError(error)
  },
  // 触发ASR完成事件
  triggerASRComplete: (finalText = '', trigger = 'manual') => {
    const {recognition} = get()
    const textToUse = finalText || recognition.lastCompleteText || recognition.currentText || ''
    console.log(`🎤 ASR完成: "${textToUse}" (trigger: ${trigger})`)

    // 更新textarea内容
    const trimmed = textToUse.trim()
    if (trimmed) {
      get().setMessage(trimmed)
      setTimeout(() => get().autoResizeTextarea(), 0)
    }

    // 重置状态
    set((state) => ({
      status: {
        ...state.status,
        mode: 'idle',
        isSpaceKeyActive: false,
        isRecording: false
      },
      recognition: {
        ...state.recognition,
        lastCompleteText: '',
        lastFragmentTime: null
      }
    }))

    // 触发ASR自动发送事件
    if (trigger === 'final_received') {
      console.log('🎤 空格键模式自动发送:', trimmed)
      window.dispatchEvent(new CustomEvent('asrAutoSend', {
        detail: {
          finalText: trimmed,
          mode: 'spacekey_final',
          trigger,
          timestamp: Date.now(),
          confidence: recognition.confidence
        }
      }))
    }

    console.log('🎤 ASR完成，最终文本:', trimmed)
  },
  // ===================
  // 错误处理
  // ===================
  // 统一错误处理
  handleASRError: (error) => {
    const {audio, recognition} = get()
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
    // 清理智能等待定时器
    if (recognition.finalWaitTimer) {
      clearTimeout(recognition.finalWaitTimer)
    }
    // 重置状态
    set({
      status: {
        isRecording: false,
        isSpaceKeyActive: false,
        mode: 'idle',
        serverConfirmed: false,
        startTime: null
      },
      audio: {
        stream: null,
        context: null,
        processor: null,
        volumeThreshold: 0.01,
        lastChunkSentTime: null,
        pendingChunks: 0
      },
      recognition: {
        currentText: '',
        finalText: '',
        confidence: 0,
        lastUpdateTime: null,
        isWaitingForFinal: false,
        pendingCompleteTimer: null
      },
      connection: {
        ...get().connection,
        lastError: error
      }
    })
  },
  // ===================
  // 状态获取
  // ===================
  // 获取ASR状态摘要
  getStatus: () => {
    const state = get()
    return {
      isRecording: state.status.isRecording,
      isSpaceKeyActive: state.status.isSpaceKeyActive,
      mode: state.status.mode,
      isConnected: state.connection.isConnected,
      serverConfirmed: state.status.serverConfirmed,
      currentText: state.recognition.currentText,
      finalText: state.recognition.finalText,
      lastError: state.connection.lastError
    }
  },
  // 重置所有状态
  reset: () => {
    const {audio} = get()
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
    // 重置状态
    set({
      status: {
        isRecording: false,
        isSpaceKeyActive: false,
        mode: 'idle',
        serverConfirmed: false,
        startTime: null
      },
      recognition: {
        currentText: '',
        finalText: '',
        confidence: 0,
        lastUpdateTime: null,
        lastCompleteText: '',
        lastFragmentTime: null
      },
      audio: {
        stream: null,
        context: null,
        processor: null,
        volumeThreshold: 0.01
      },
      connection: {
        ...get().connection,
        lastError: null
      }
    })
  }
}))
export default useASRStore
