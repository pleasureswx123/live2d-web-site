import { create } from 'zustand'

// 聊天头部状态管理store
export const useChatHeaderStore = create((set, get) => ({
  // 角色信息
  character: {
    name: '悠悠',
    model: 'doubao-seed-1-6-flash-250715',
    avatar: null,
    status: 'online', // online, offline, thinking, speaking
    description: ''
  },

  // 思考模式
  thinking: {
    enabled: false,
    indicator: '思考模式: 关闭',
    isActive: false // 当前是否正在思考
  },

  // 音频状态
  audio: {
    isPlaying: false,
    isTesting: false,
    currentAudio: null,
    audioElements: [],
    volume: 0.8,
    autoPlay: true,
    playbackRate: 1.0
  },

  // UI状态
  ui: {
    showModelInfo: true,
    showThinkingIndicator: true,
    showAudioTest: true,
    compact: false,
    theme: 'default' // default, minimal, compact
  },

  // 配置
  config: {
    ttsApiUrl: 'http://localhost:8000/tts/synthesize',
    audioFormat: 'mp3',
    testUserId: 'audio_test_user',
    testAudioText: '音频测试',
    maxAudioElements: 5
  },

  // 更新角色信息
  updateCharacterInfo: (info) => {
    set((state) => ({
      character: {
        ...state.character,
        ...info
      }
    }))
  },

  // 切换思考模式
  toggleThinkingMode: () => {
    set((state) => {
      const newEnabled = !state.thinking.enabled
      return {
        thinking: {
          ...state.thinking,
          enabled: newEnabled,
          indicator: `思考模式: ${newEnabled ? '开启' : '关闭'}`
        }
      }
    })

    // 触发思考模式变化事件
    const { thinking } = get()
    const event = new CustomEvent('thinkingModeChanged', {
      detail: { enabled: thinking.enabled }
    })
    window.dispatchEvent(event)
  },

  // 设置思考状态
  setThinkingActive: (active) => {
    set((state) => ({
      thinking: {
        ...state.thinking,
        isActive: active
      },
      character: {
        ...state.character,
        status: active ? 'thinking' : 'online'
      }
    }))
  },

  // 测试浏览器音频
  testBrowserAudio: async () => {
    const { config, playTTSAudio } = get()
    
    set((state) => ({
      audio: {
        ...state.audio,
        isTesting: true
      }
    }))

    try {
      console.log('🧪 开始测试浏览器音频播放能力...')
      
      // 1. 测试Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.value = 440 // A音符
      gainNode.gain.value = 0.1 // 低音量
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.5) // 播放0.5秒
      
      console.log('✅ Web Audio API测试完成')

      // 2. 测试TTS API
      const response = await fetch(config.ttsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: config.testAudioText,
          user_id: config.testUserId
        })
      })

      const data = await response.json()
      
      if (data.success && data.audio_data) {
        console.log('🔊 收到TTS测试音频，开始播放...')
        await playTTSAudio(data.audio_data, data.format)
        
        // 触发测试成功事件
        const event = new CustomEvent('audioTestSuccess', {
          detail: { message: '音频测试成功' }
        })
        window.dispatchEvent(event)
      } else {
        throw new Error(`TTS测试失败: ${data.error || '未知错误'}`)
      }

    } catch (error) {
      console.error('❌ 音频测试失败:', error)
      
      // 触发测试失败事件
      const event = new CustomEvent('audioTestError', {
        detail: { error: error.message }
      })
      window.dispatchEvent(event)
    } finally {
      set((state) => ({
        audio: {
          ...state.audio,
          isTesting: false
        }
      }))
    }
  },

  // 播放TTS音频
  playTTSAudio: async (audioBase64, format = 'mp3') => {
    const { stopCurrentAudio, showAudioPlayButton } = get()
    
    try {
      console.log('🔊 开始处理TTS音频数据:', {
        format: format,
        base64Length: audioBase64.length,
        base64Sample: audioBase64.substring(0, 50) + '...'
      })

      // 停止当前播放的音频
      stopCurrentAudio()

      // 将Base64数据转换为Blob
      console.log('🔄 开始Base64解码...')
      const binaryString = atob(audioBase64)
      console.log('✅ Base64解码完成，二进制长度:', binaryString.length)
      
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      console.log('🗂️ 创建音频Blob...')
      const blob = new Blob([bytes], { type: `audio/${format}` })
      console.log('✅ Blob创建完成:', {
        size: blob.size,
        type: blob.type
      })

      const audioUrl = URL.createObjectURL(blob)
      console.log('🔗 音频URL创建完成:', audioUrl)

      // 创建音频元素
      const audio = new Audio(audioUrl)
      audio.volume = get().audio.volume
      audio.playbackRate = get().audio.playbackRate

      // 设置事件监听器
      audio.onloadstart = () => console.log('音频开始加载...')
      audio.oncanplay = () => console.log('音频可以播放，开始播放...')
      audio.onplay = () => {
        console.log('音频开始播放')
        set((state) => ({
          audio: {
            ...state.audio,
            isPlaying: true
          },
          character: {
            ...state.character,
            status: 'speaking'
          }
        }))
      }
      
      audio.onended = () => {
        console.log('音频播放完成')
        URL.revokeObjectURL(audioUrl)
        get().removeAudioElement(audio)
        
        set((state) => ({
          audio: {
            ...state.audio,
            isPlaying: false,
            currentAudio: null
          },
          character: {
            ...state.character,
            status: 'online'
          }
        }))
      }
      
      audio.onerror = (e) => {
        console.error('音频播放错误:', e)
        URL.revokeObjectURL(audioUrl)
        get().removeAudioElement(audio)
        
        set((state) => ({
          audio: {
            ...state.audio,
            isPlaying: false,
            currentAudio: null
          },
          character: {
            ...state.character,
            status: 'online'
          }
        }))
      }

      // 添加到音频元素列表
      set((state) => ({
        audio: {
          ...state.audio,
          currentAudio: audio,
          audioElements: [...state.audio.audioElements, audio].slice(-state.config.maxAudioElements)
        }
      }))

      // 尝试播放音频
      try {
        await audio.play()
      } catch (error) {
        console.error('播放音频失败:', error)
        
        if (error.name === 'NotAllowedError') {
          console.log('浏览器阻止了自动播放，需要用户交互后才能播放')
          showAudioPlayButton(audioUrl)
        } else {
          throw error
        }
      }

    } catch (error) {
      console.error('处理TTS音频数据失败:', error)
      
      // 触发播放错误事件
      const event = new CustomEvent('audioPlayError', {
        detail: { error: error.message }
      })
      window.dispatchEvent(event)
    }
  },

  // 停止当前音频
  stopCurrentAudio: () => {
    const { audio } = get()
    
    if (audio.currentAudio) {
      console.log('⏹️ 停止当前播放的音频')
      audio.currentAudio.pause()
      audio.currentAudio.currentTime = 0
    }

    // 停止所有音频元素
    audio.audioElements.forEach(audioElement => {
      if (!audioElement.paused) {
        audioElement.pause()
        audioElement.currentTime = 0
      }
    })

    set((state) => ({
      audio: {
        ...state.audio,
        isPlaying: false,
        currentAudio: null,
        audioElements: []
      },
      character: {
        ...state.character,
        status: 'online'
      }
    }))
  },

  // 移除音频元素
  removeAudioElement: (audioElement) => {
    set((state) => ({
      audio: {
        ...state.audio,
        audioElements: state.audio.audioElements.filter(el => el !== audioElement)
      }
    }))
  },

  // 显示音频播放按钮（用于处理自动播放限制）
  showAudioPlayButton: (audioUrl) => {
    // 触发显示播放按钮事件
    const event = new CustomEvent('showAudioPlayButton', {
      detail: { audioUrl }
    })
    window.dispatchEvent(event)
  },

  // 设置音频音量
  setAudioVolume: (volume) => {
    const { audio } = get()
    
    set((state) => ({
      audio: {
        ...state.audio,
        volume: Math.max(0, Math.min(1, volume))
      }
    }))

    // 更新当前播放音频的音量
    if (audio.currentAudio) {
      audio.currentAudio.volume = volume
    }
  },

  // 设置播放速度
  setPlaybackRate: (rate) => {
    const { audio } = get()
    
    set((state) => ({
      audio: {
        ...state.audio,
        playbackRate: Math.max(0.25, Math.min(4, rate))
      }
    }))

    // 更新当前播放音频的速度
    if (audio.currentAudio) {
      audio.currentAudio.playbackRate = rate
    }
  },

  // 更新UI配置
  updateUIConfig: (config) => {
    set((state) => ({
      ui: {
        ...state.ui,
        ...config
      }
    }))
  },

  // 更新配置
  updateConfig: (config) => {
    set((state) => ({
      config: {
        ...state.config,
        ...config
      }
    }))
  },

  // 重置所有状态
  reset: () => {
    const { stopCurrentAudio } = get()
    
    stopCurrentAudio()
    
    set({
      character: {
        name: '悠悠',
        model: 'doubao-seed-1-6-flash-250715',
        avatar: null,
        status: 'online',
        description: ''
      },
      thinking: {
        enabled: false,
        indicator: '思考模式: 关闭',
        isActive: false
      },
      audio: {
        isPlaying: false,
        isTesting: false,
        currentAudio: null,
        audioElements: [],
        volume: 0.8,
        autoPlay: true,
        playbackRate: 1.0
      },
      ui: {
        showModelInfo: true,
        showThinkingIndicator: true,
        showAudioTest: true,
        compact: false,
        theme: 'default'
      }
    })
  }
}))

export default useChatHeaderStore
