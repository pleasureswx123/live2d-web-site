import { create } from 'zustand'

// ASR语音识别状态管理store
export const useASRStore = create((set, get) => ({
  // 录音状态
  recording: {
    isRecording: false,
    isSpaceKeyPressed: false,
    isSpaceKeyASRActive: false,
    recordingStartTime: null,
    spaceKeyStartTime: null,
    spaceKeyTimer: null
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
    autoSendTimer: null
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

  // ASR结果处理
  onASRResult: (text, isFinal = false, confidence = 0) => {
    const { recording, updateRecognitionResult, updateUIState } = get()
    
    console.log('🎤 ASR结果:', text, '(final:', isFinal, ', confidence:', confidence, ')')
    
    // 更新识别结果
    updateRecognitionResult(text, isFinal, confidence)

    // 长按空格键ASR模式处理
    if (recording.isSpaceKeyASRActive) {
      if (text && text.trim()) {
        updateUIState({
          statusText: `长按识别: ${text}`
        })
        
        // 触发实时结果事件
        const event = new CustomEvent('asrRealtimeResult', { 
          detail: { text, isFinal, confidence } 
        })
        window.dispatchEvent(event)
      }
      return
    }

    // 其他模式的处理逻辑可以在这里添加
  },

  // ASR错误处理
  onASRError: (error) => {
    console.error('❌ ASR错误:', error)
    
    const { updateRecordingState, updateUIState, audio, config } = get()

    updateRecordingState({
      isRecording: false,
      isSpaceKeyASRActive: false
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
      detail: { error } 
    })
    window.dispatchEvent(event)
  },

  // 重置所有状态
  reset: () => {
    const { audio, config } = get()
    
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

    set({
      recording: {
        isRecording: false,
        isSpaceKeyPressed: false,
        isSpaceKeyASRActive: false,
        recordingStartTime: null,
        spaceKeyStartTime: null,
        spaceKeyTimer: null
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
