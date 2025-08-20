import { create } from 'zustand'

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

    // 新的文本收集机制
    textFragments: [], // 收集所有文本片段
    lastFragmentTime: null, // 最后收到文本的时间
    isCollecting: false, // 是否正在收集文本

    // 停止和等待机制
    stopRequestTime: null, // 停止请求时间
    hasReceivedStopped: false, // 是否已收到asr_stopped
    finalResultTimer: null, // 等待最终结果的定时器
    collectionTimer: null, // 文本收集超时定时器
    stopTimer: null, // 智能停止定时器
    checkInterval: null // ASR活动检测间隔
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
  // 核心方法
  // ===================

  // 设置WebSocket连接
  setWebSocket: (ws) => {
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

  // 更新连接状态（从WebSocketContext调用）
  updateConnectionFromContext: (wsOrRef, connectionStatus) => {
    const ws = wsOrRef && typeof wsOrRef === 'object' && 'readyState' in wsOrRef
      ? wsOrRef
      : wsOrRef?.current

    set((state) => ({
      connection: {
        ...state.connection,
        ws,
        isConnected: connectionStatus === 'connected' && ws?.readyState === WebSocket.OPEN
      }
    }))
    console.log('🔌 ASR连接状态更新:', connectionStatus, 'ws:', !!ws)
  },

  // ===================
  // 长按空格键ASR
  // ===================

  // 开始长按空格键ASR
  startSpaceKeyASR: async () => {
    const { status, connection } = get()

    if (status.isSpaceKeyActive || status.isRecording) {
      console.log('🎤 ASR已在运行中，跳过')
      return
    }

    console.log('🎤 开始长按空格键ASR')

    // 停止所有TTS音频
      window.dispatchEvent(new CustomEvent('stopAllTTS'))
      window.dispatchEvent(new CustomEvent('clearAudioQueue'))

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

  // 停止长按空格键ASR（智能等待方案）
  stopSpaceKeyASR: async () => {
    const { status } = get()

    if (!status.isSpaceKeyActive) {
      return
    }

    console.log('🎤 停止长按空格键ASR（新策略：延迟停止+文本收集）')

    try {
      // 1. 立即停止本地录音（停止发送新音频）
      await get().stopRecordingOnly()

      // 2. 启动文本收集模式，给后端更多时间处理剩余音频
      get().startTextCollection()

    } catch (error) {
      console.error('❌ 停止长按空格键ASR失败:', error)
      get().handleASRError(error.message)
    }
  },

  // 启动文本收集模式（新策略核心）
  startTextCollection: () => {
    console.log('📝 启动文本收集模式')

    const now = Date.now()

    // 更新状态为收集模式
    set((state) => ({
      status: {
        ...state.status,
        isSpaceKeyActive: false,
        mode: 'collecting', // 文本收集模式
        startTime: null
      },
      recognition: {
        ...state.recognition,
        isCollecting: true,
        stopRequestTime: now,
        lastFragmentTime: now,
        hasReceivedStopped: false,
        collectionTimer: null,
        finalResultTimer: null
      }
    }))

    // 智能延迟策略：基于ASR活动动态调整
    let stopTimer = null
    let checkInterval = null
    let noResultCount = 0
    
    const checkASRActivity = () => {
      const currentState = get()
      const timeSinceLastFragment = now - (currentState.recognition.lastFragmentTime || now)
      
      if (timeSinceLastFragment > 300) { // 300ms没有新结果
        noResultCount++
        console.log(`🔍 ASR活动检测: ${noResultCount}次无结果 (间隔${timeSinceLastFragment}ms)`)
        
        if (noResultCount >= 3) { // 连续3次无结果，认为ASR处理完毕
          console.log('🎯 检测到ASR处理完毕，立即发送stop_asr')
          clearInterval(checkInterval)
          clearTimeout(stopTimer)
          get().sendStopASR()
          return
        }
      } else {
        noResultCount = 0 // 重置计数器
      }
    }
    
    // 每200ms检测一次ASR活动
    checkInterval = setInterval(checkASRActivity, 200)
    
    // 最大延迟兜底（防止无限等待）
    stopTimer = setTimeout(() => {
      console.log('⏰ 最大延迟兜底，强制发送stop_asr')
      clearInterval(checkInterval)
      get().sendStopASR()
    }, 2500) // 最大2.5秒兜底

    // 启动收集超时保护（如果长时间无文本更新）
    const collectionTimer = setTimeout(() => {
      const currentState = get()
      if (currentState.recognition.isCollecting) {
        console.log('⏰ 文本收集超时，强制完成')
        get().finishTextCollection('collection_timeout')
      }
    }, 5000) // 5秒超时保护

    // 保存定时器引用
    set((state) => ({
      recognition: {
        ...state.recognition,
        collectionTimer,
        // 保存智能检测定时器
        stopTimer,
        checkInterval
      }
    }))
  },

  // 发送stop_asr到后端
  sendStopASR: () => {
    const { connection } = get()

    if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({
        type: 'stop_asr',
        timestamp: Date.now(),
        mode: 'spacekey'
      }))
      console.log('📤 发送stop_asr到后端')
    }
  },

  // 完成文本收集
  finishTextCollection: (trigger = 'unknown') => {
    console.log(`🏁 完成文本收集，触发原因: ${trigger}`)

    const { recognition } = get()

    // 清理定时器
    if (recognition.collectionTimer) {
      clearTimeout(recognition.collectionTimer)
    }
    if (recognition.finalResultTimer) {
      clearTimeout(recognition.finalResultTimer)
    }
    if (recognition.stopTimer) {
      clearTimeout(recognition.stopTimer)
    }
    if (recognition.checkInterval) {
      clearInterval(recognition.checkInterval)
    }

    // 合并所有文本片段，优先使用finalText
    let finalText = recognition.finalText
    if (!finalText && recognition.textFragments.length > 0) {
      // 如果没有finalText，使用最后一个有内容的片段
      finalText = recognition.textFragments
        .filter(fragment => fragment.trim())
        .slice(-1)[0] || recognition.currentText
    }

    if (!finalText) {
      finalText = recognition.currentText
    }

    console.log(`📝 收集到的最终文本: "${finalText}" (来源: ${trigger})`)
    console.log(`📊 文本片段历史: [${recognition.textFragments.map(t => `"${t}"`).join(', ')}]`)

    // 触发完成事件
    get().triggerASRComplete(finalText || '', trigger)
  },

  // ===================
  // 录音控制
  // ===================

  // 开始录音
  startRecording: async () => {
    const { connection, audio } = get()

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
        const { status, connection } = get()

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

  // 停止录音（完整版，包含发送stop_asr）
  stopRecording: async () => {
    await get().stopRecordingOnly()
    await get().sendStopASRImmediate()
  },

  // 仅停止录音，不发送stop_asr
  stopRecordingOnly: async () => {
    const { audio } = get()

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

    // 触发启动事件
    window.dispatchEvent(new CustomEvent('asrServerStarted', {
      detail: {
        timestamp: Date.now(),
        mode: get().status.mode
      }
    }))
  },

  // ASR结果处理（来自服务器）
  onASRResult: (text, isFinal = false, confidence = 0) => {
    console.log(`🎤 ASR结果: "${text}" (final: ${isFinal}, confidence: ${confidence})`)

    const now = Date.now()
    const currentState = get()

    // 新策略：收集所有有效的文本片段
    const textToAdd = text || ''

    // 更新识别结果和文本片段收集
    set((state) => ({
      recognition: {
        ...state.recognition,
        currentText: textToAdd,
        finalText: isFinal ? textToAdd : state.recognition.finalText,
        confidence,
        lastUpdateTime: now,
        lastFragmentTime: now,
        // 收集所有非空文本片段（避免重复）
        textFragments: textToAdd && !state.recognition.textFragments.includes(textToAdd)
          ? [...state.recognition.textFragments, textToAdd]
          : state.recognition.textFragments
      }
    }))

    // 新策略核心：在收集模式下处理文本
    if (currentState.recognition.isCollecting) {
      console.log(`📝 收集模式中，添加文本片段: "${textToAdd}" (final: ${isFinal})`)

      if (isFinal) {
        console.log('✅ 收到最终结果，完成文本收集')
        // 收到最终结果，立即完成收集
        get().finishTextCollection('final_received')
        return
      } else {
        // 重置收集超时（延长等待时间，因为还有更多文本可能到来）
        const { recognition } = get()
        if (recognition.collectionTimer) {
          clearTimeout(recognition.collectionTimer)

          const newCollectionTimer = setTimeout(() => {
            const currentState = get()
            if (currentState.recognition.isCollecting) {
              console.log('⏰ 文本收集超时，完成收集')
              get().finishTextCollection('extended_timeout')
            }
          }, 2000) // 收到新文本后，再等待2秒

          set((state) => ({
            recognition: {
              ...state.recognition,
              collectionTimer: newCollectionTimer
            }
          }))
        }
      }
    }

    // 触发实时输入更新事件
    const { status } = get()
    if (status.isSpaceKeyActive || status.mode === 'spacekey' || status.mode === 'collecting') {
      window.dispatchEvent(new CustomEvent('asrInputUpdate', {
        detail: {
          text: textToAdd,
          isFinal,
          mode: status.mode,
          timestamp: now,
          fragments: currentState.recognition.textFragments
        }
      }))
    }
  },

  // ASR停止确认（来自服务器）
  onASRStopped: () => {
    console.log('🎤 服务器确认ASR已停止')

    const { recognition, status } = get()

    // 标记已收到停止信号
    set((state) => ({
      recognition: {
        ...state.recognition,
        hasReceivedStopped: true
      }
    }))

    // 新策略：如果在收集模式下收到停止，启动最终等待
    if (recognition.isCollecting) {
      console.log('📝 收集模式中收到停止信号，启动最终等待机制')

      // 如果已有final文本，立即完成
      if (recognition.finalText && recognition.finalText.trim()) {
        console.log('✅ 已有final文本，立即完成收集')
        get().finishTextCollection('stopped_with_final')
        return
      }

      // 否则等待可能的final结果
      const finalResultTimer = setTimeout(() => {
        const currentState = get()
        if (currentState.recognition.isCollecting) {
          console.log('⏰ 最终等待超时，强制完成收集')
          get().finishTextCollection('final_wait_timeout')
        }
      }, 1500) // 等待1.5秒final结果

      set((state) => ({
        recognition: {
          ...state.recognition,
          finalResultTimer
        }
      }))

      return
    }

    // 旧逻辑保留作为fallback
    console.log('⚠️ 非收集模式下收到停止信号，使用fallback逻辑')
    const finalText = recognition.finalText || recognition.currentText || ''
    get().triggerASRComplete(finalText, 'stopped_fallback')
  },

  // ASR错误处理
  onASRError: (error) => {
    console.error('❌ ASR错误:', error)
    get().handleASRError(error)
  },

  // ===================
  // 辅助方法
  // ===================

  // 获取当前最佳识别文本
  getCurrentBestText: () => {
    const { recognition } = get()
    return recognition.finalText || recognition.currentText || ''
  },

  // 触发ASR完成事件
  triggerASRComplete: (finalText = '', trigger = 'manual') => {
    const { recognition, status } = get()

    // 清除所有定时器
    if (recognition.collectionTimer) {
      clearTimeout(recognition.collectionTimer)
    }
    if (recognition.finalResultTimer) {
      clearTimeout(recognition.finalResultTimer)
    }
    if (recognition.stopTimer) {
      clearTimeout(recognition.stopTimer)
    }
    if (recognition.checkInterval) {
      clearInterval(recognition.checkInterval)
    }

    const textToUse = finalText || recognition.finalText || recognition.currentText || ''
    console.log(`🎤 ASR完成: "${textToUse}" (trigger: ${trigger})`)
    console.log(`📊 收集的文本片段: [${recognition.textFragments.map(t => `"${t}"`).join(', ')}]`)

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
        isCollecting: false,
        hasReceivedStopped: false,
        textFragments: [],
        collectionTimer: null,
        finalResultTimer: null,
        stopTimer: null,
        checkInterval: null,
        lastFragmentTime: null
      }
    }))

    // 触发统一的ASR完成事件
    window.dispatchEvent(new CustomEvent('asrComplete', {
      detail: {
        finalText: textToUse.trim(),
        mode: 'spacekey_final',
        trigger,
        timestamp: Date.now(),
        confidence: recognition.confidence,
        fragments: recognition.textFragments
      }
    }))

    console.log('🎤 ASR完成，最终文本:', textToUse.trim())
  },

  // ===================
  // 错误处理
  // ===================

  // 统一错误处理
  handleASRError: (error) => {
    const { audio, recognition } = get()

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

    // 触发错误事件
    window.dispatchEvent(new CustomEvent('asrServerError', {
      detail: {
        error: error || '语音识别出现错误',
        timestamp: Date.now(),
        mode: 'error'
      }
    }))
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
    const { audio, recognition } = get()

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

    // 清理定时器
    if (recognition.collectionTimer) {
      clearTimeout(recognition.collectionTimer)
    }
    if (recognition.finalResultTimer) {
      clearTimeout(recognition.finalResultTimer)
    }
    if (recognition.stopTimer) {
      clearTimeout(recognition.stopTimer)
    }
    if (recognition.checkInterval) {
      clearInterval(recognition.checkInterval)
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
        textFragments: [],
        lastFragmentTime: null,
        isCollecting: false,
        stopRequestTime: null,
        hasReceivedStopped: false,
        finalResultTimer: null,
        collectionTimer: null,
        stopTimer: null,
        checkInterval: null
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
