import {create} from 'zustand'
import {useProactiveChatStore} from './proactiveChatStore'

// TTS音频播放状态管理store
export const useTTSStore = create((set, get) => {
  // 音频播放管理器状态
  let audioContext = null
  let isUnlocked = false
  let pendingAudio = []

  // 最小化优化：简单的URL清理跟踪
  const activeAudioUrls = new Set()

  const userInteractionEvents = ['click', 'touchstart', 'keydown', 'mousedown']

  // 初始化音频播放管理器
  const initAudioManager = () => {
    setupUserInteractionListeners()
    detectAutoplaySupport()
  }

  // 设置用户交互监听器
  const setupUserInteractionListeners = () => {
    const handleUserInteraction = () => {
      unlockAudio()
    }
    userInteractionEvents.forEach(event => {
      document.addEventListener(event, handleUserInteraction, {
        once: true,
        passive: true
      })
    })
  }

  // 检测自动播放支持
  const detectAutoplaySupport = async () => {
    try {
      const audio = new Audio()
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
      audio.volume = 0.01
      audio.muted = true
      await audio.play()
      isUnlocked = true
      console.log('✅ 自动播放可用')
    } catch (error) {
      console.log('🔒 自动播放被限制，等待用户交互')
    }
  }

  // 解锁音频播放
  const unlockAudio = async () => {
    if (isUnlocked) return true
    try {
      // 创建或恢复音频上下文
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      // 播放静音音频解锁
      const buffer = audioContext.createBuffer(1, 1, 22050)
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start(0)
      isUnlocked = true
      console.log('🎵 音频播放已解锁')
      // 处理待播放音频
      processPendingAudio()
      return true
    } catch (error) {
      console.error('❌ 音频解锁失败:', error)
      return false
    }
  }

  // 处理待播放音频
  const processPendingAudio = () => {
    if (pendingAudio.length > 0) {
      console.log(`🎵 处理 ${pendingAudio.length} 个待播放音频`)
      pendingAudio.forEach(({audio, resolve, reject}) => {
        audio.play().then(resolve).catch(reject)
      })
      pendingAudio = []
    }
  }

  // 播放音频（主要方法）
  const playAudio = async (audio) => {
    if (isUnlocked) {
      try {
        await audio.play()
        return true
      } catch (error) {
        console.error('音频播放失败:', error)
        throw error
      }
    } else {
      // 尝试解锁
      const unlocked = await unlockAudio()
      if (unlocked) {
        try {
          await audio.play()
          return true
        } catch (error) {
          console.error('解锁后音频播放失败:', error)
          throw error
        }
      } else {
        // 加入待播放队列
        return new Promise((resolve, reject) => {
          pendingAudio.push({audio, resolve, reject})
          console.log('🎵 音频已加入待播放队列')
        })
      }
    }
  }

  // 从Base64创建并播放音频（保持原始逻辑，只添加URL跟踪）
  const playAudioFromBase64 = async (base64Data, format = 'mp3', volume = 0.8) => {
    try {
      // 解码Base64
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // 创建Blob和URL
      const blob = new Blob([bytes], {type: `audio/${format}`})
      const audioUrl = URL.createObjectURL(blob)

      // 跟踪URL以便清理
      activeAudioUrls.add(audioUrl)

      // 创建音频元素
      const audio = new Audio(audioUrl)
      audio.volume = volume

      // 设置清理函数
      const cleanup = () => {
        if (activeAudioUrls.has(audioUrl)) {
          URL.revokeObjectURL(audioUrl)
          activeAudioUrls.delete(audioUrl)
        }
      }

      audio.addEventListener('ended', cleanup)
      audio.addEventListener('error', cleanup)

      // 播放音频
      await playAudio(audio)
      return audio
    } catch (error) {
      console.error('Base64音频播放失败:', error)
      throw error
    }
  }

  // 清理所有资源
  const cleanupAllResources = () => {
    console.log('🧹 开始兜底清理所有音频资源...')

    // 1. 清理所有活跃的URL
    activeAudioUrls.forEach(url => {
      URL.revokeObjectURL(url)
    })
    activeAudioUrls.clear()

    // 2. 清理待播放队列
    pendingAudio.length = 0

    // 3. 清理音频状态（兜底清理）
    const {audio} = get()
    if (audio.currentAudio) {
      audio.currentAudio.pause()
      audio.currentAudio.currentTime = 0
      audio.currentAudio.src = ''
      audio.currentAudio.load()
    }

    // 4. 清理所有音频元素
    audio.audioElements.forEach((audioElement) => {
      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
        audioElement.src = ''
        audioElement.load()
        // 移除事件监听器
        audioElement.onended = null
        audioElement.onerror = null
        audioElement.onload = null
      }
    })

    // 5. 停止Live2D嘴部同步
    if (window.__stopLipSync) {
      window.__stopLipSync()
    }

    // 6. 重置音频状态（为下一轮对话做准备）
    set((state) => ({
      audio: {
        ...state.audio,
        currentAudio: null,
        audioElements: [],
        audioQueue: [],
        orderedAudioBuffer: new Map(),
        expectedOrder: 1,
        isPlayingQueue: false,
        isTTSGenerationComplete: false
      }
    }))

    console.log('🧹 兜底清理完成，准备下一轮对话')
  }

  // 初始化音频管理器
  initAudioManager()

  return {
    // 音频播放状态
    audio: {
      isPlaying: false,
      isTesting: false,
      volume: 0.8,
      playbackRate: 1.0,
      currentAudio: null,
      audioElements: [],
      audioQueue: [],
      orderedAudioBuffer: new Map(),
      expectedOrder: 1,
      isPlayingQueue: false,
      isTTSGenerationComplete: false
    },

    // 表情同步状态
    expression: {
      lastExpressionTime: 0,
      currentExpression: null,
      EXPRESSION_DEBOUNCE_TIME: 1000 // 1秒防抖
    },

    // 表情关键词映射表 - 按优先级排序，强烈情感优先
    EXPRESSION_KEYWORDS: {
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
    },

    // 设置WebSocket引用
    setWebSocketRef: (wsRef) => {
      set((state) => ({
        wsRef: wsRef
      }))
    },

    // 停止当前播放的音频
    stopCurrentAudio: () => {
      const {audio} = get()
      if (audio.currentAudio) {
        console.log('⏹️ 停止当前播放的音频')
        audio.currentAudio.pause()
        audio.currentAudio = null
      }
      set((state) => ({
        audio: {
          ...state.audio,
          currentAudio: null
        }
      }))
    },

    // 停止所有音频
    stopAllAudio: () => {
      const {audio} = get()

      // 停止Live2D嘴部同步
      if (window.__stopLipSync) {
        window.__stopLipSync()
      }

      // 停止当前播放的音频
      if (audio.currentAudio) {
        audio.currentAudio.pause()
        audio.currentAudio.currentTime = 0
      }

      // 停止所有音频元素
      audio.audioElements.forEach((audioElement) => {
        if (audioElement && !audioElement.paused) {
          audioElement.pause()
          audioElement.currentTime = 0
        }
      })

      // 清空音频队列和缓冲区
      set((state) => ({
        audio: {
          ...state.audio,
          currentAudio: null,
          audioElements: [],
          audioQueue: [],
          orderedAudioBuffer: new Map(),
          expectedOrder: 1,
          isPlayingQueue: false,
          isTTSGenerationComplete: false
        }
      }))

      console.log('✅ 所有音频已停止')
    },

    // 清空音频队列
    clearAudioQueue: () => {
      set((state) => ({
        audio: {
          ...state.audio,
          audioQueue: [],
          orderedAudioBuffer: new Map(),
          isPlayingQueue: false
        }
      }))
      console.log('🗑️ 音频队列已清空')
    },

    // 表情匹配函数
    matchExpression: (text) => {
      const {EXPRESSION_KEYWORDS} = get()
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
    },

    // 播放Live2D表情
    playLive2DExpression: async (expressionName) => {
      const {expression} = get()

      try {
        const model = window.live2dModel
        if (!model) {
          console.log('🎭 Live2D模型未加载，跳过表情播放')
          return false
        }

        // 防抖检查
        const now = Date.now()
        if (now - expression.lastExpressionTime < expression.EXPRESSION_DEBOUNCE_TIME) {
          console.log('🎭 表情切换过于频繁，跳过')
          return false
        }

        // 如果是相同表情，跳过
        if (expression.currentExpression === expressionName) {
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
          set((state) => ({
            expression: {
              ...state.expression,
              lastExpressionTime: now,
              currentExpression: expressionName
            }
          }))
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
    },

    // 基础音频播放函数
    playTTSAudioBase: async (audioBase64, format = 'mp3', onComplete = null) => {
      const {stopCurrentAudio} = get()

      try {
        console.log('🔊 开始处理TTS音频数据:', {
          format: format,
          base64Length: audioBase64.length,
          base64Sample: audioBase64.substring(0, 50) + '...'
        })

        // 停止当前播放的音频
        stopCurrentAudio()

        // 使用原始的音频播放功能
        const audio = await playAudioFromBase64(audioBase64, format, 0.8)

        // 设置为当前音频
        set((state) => ({
          audio: {
            ...state.audio,
            currentAudio: audio,
            audioElements: [...state.audio.audioElements, audio]
          }
        }))

        // 启动Live2D嘴部同步
        if (window.__startLipSyncForAudio) {
          try {
            window.__startLipSyncForAudio(audio)
          } catch (error) {
            console.warn('⚠️ 嘴部同步启动失败:', error)
          }
        }

        // 创建音频结束处理函数
        const handleAudioEnd = (isError = false, error = null) => {
          if (isError) {
            console.error('音频播放错误:', error)
          } else {
            console.log('音频播放完成')
          }

          // 停止Live2D嘴部同步
          if (window.__stopLipSync) {
            window.__stopLipSync()
          }

          // 清理音频状态
          set((state) => {
            const currentAudioElements = state.audio.audioElements.filter(el => el !== audio)
            const newCurrentAudio = state.audio.currentAudio === audio ? null : state.audio.currentAudio

            return {
              audio: {
                ...state.audio,
                audioElements: currentAudioElements,
                currentAudio: newCurrentAudio
              }
            }
          })

          // 调用完成回调
          if (onComplete) {
            onComplete()
          }
        }

        // 设置事件监听器
        audio.onended = () => handleAudioEnd(false)
        audio.onerror = (e) => handleAudioEnd(true, e)

        console.log('✅ 音频播放成功')

      } catch (error) {
        console.error('处理TTS音频数据失败:', error)
        if (onComplete) {
          onComplete()
        }
      }
    },

    // 主要的音频播放函数（用于单独播放）
    playTTSAudio: (audioBase64, format = 'mp3') => {
      get().playTTSAudioBase(audioBase64, format)
    },

    // 处理有序音频缓冲区
    processOrderedAudioBuffer: () => {
      const {audio} = get()
      const orderedAudioBuffer = audio.orderedAudioBuffer
      const expectedOrder = audio.expectedOrder

      console.log(`🎵 处理有序音频缓冲区，期望顺序: ${expectedOrder}`)

      // 检查是否有期望顺序的音频片段
      while (orderedAudioBuffer.has(expectedOrder)) {
        const audioChunk = orderedAudioBuffer.get(expectedOrder)
        orderedAudioBuffer.delete(expectedOrder)

        // 将音频片段添加到播放队列
        set((state) => ({
          audio: {
            ...state.audio,
            audioQueue: [...state.audio.audioQueue, audioChunk],
            expectedOrder: state.audio.expectedOrder + 1
          }
        }))
        console.log(`🎵 音频片段 #${expectedOrder} 已加入播放队列`)

        // 如果没有在播放，开始播放队列
        if (!audio.isPlayingQueue) {
          console.log('🎵 开始播放音频队列...')
          get().playAudioQueue()
        }
      }
    },

    // 播放音频队列
    playAudioQueue: () => {
      const {audio} = get()

      if (audio.audioQueue.length === 0) {
        console.log('🎵 音频队列为空，停止播放')
        set((state) => ({
          audio: {
            ...state.audio,
            isPlayingQueue: false
          }
        }))
        return
      }

      if (audio.isPlayingQueue) {
        console.log('🎵 音频队列正在播放中，跳过重复调用')
        return
      }

      set((state) => ({
        audio: {
          ...state.audio,
          isPlayingQueue: true
        }
      }))
      console.log('🎵 开始播放音频队列，队列长度:', audio.audioQueue.length)

      const playNextAudio = () => {
        const {audio} = get()
        if (audio.audioQueue.length === 0) {
          console.log('🎵 音频队列播放完成')
          set((state) => ({
            audio: {
              ...state.audio,
              isPlayingQueue: false
            }
          }))
          get().checkAllAudioPlaybackComplete()
          return
        }

        const audioChunk = audio.audioQueue.shift()
        set((state) => ({
          audio: {
            ...state.audio,
            audioQueue: audio.audioQueue
          }
        }))
        console.log('🎵 播放下一个音频片段，剩余队列长度:', audio.audioQueue.length)

        try {
          // 使用基础播放函数播放音频
          get().playTTSAudioBase(audioChunk.data, audioChunk.format, playNextAudio)
        } catch (error) {
          console.error('❌ 播放音频片段失败:', error)
          // 继续播放下一个
          playNextAudio()
        }
      }

      playNextAudio()
    },

    // 检查所有音频播放是否完成
    checkAllAudioPlaybackComplete: () => {
      const {audio, wsRef} = get()

      console.log('🎵 检查音频播放完成状态:', {
        queueLength: audio.audioQueue.length,
        bufferSize: audio.orderedAudioBuffer.size,
        ttsComplete: audio.isTTSGenerationComplete,
        isPlaying: audio.isPlayingQueue
      })

      if (audio.audioQueue.length === 0 && audio.orderedAudioBuffer.size === 0 &&
        audio.isTTSGenerationComplete && !audio.isPlayingQueue) {

        // 实时获取最新的主动对话状态
        const {isProactiveChatEnabled} = useProactiveChatStore.getState();
        console.log('✅ 所有音频播放完成', isProactiveChatEnabled)

        cleanupAllResources();

        // 可以在这里添加完成回调
        if (wsRef && wsRef.readyState === WebSocket.OPEN && !!isProactiveChatEnabled) {
          wsRef.send(JSON.stringify({
            type: 'audio_playback_complete',
            message: '音频播放完成'
          }));
          console.log('📤 已通知服务端：音频播放完成');
        } else {
          console.log('⚠️ WebSocket未连接或关闭了主动对话，无法通知服务端音频播放完成');
        }
      }
    },

    // 带顺序号的流式TTS音频播放功能
    playTTSAudioChunkWithOrder: (audioBase64, format = 'mp3', order = 0) => {
      try {
        const {audio} = get()
        console.log('🎵 处理带顺序号的音频片段:', {
          order: order,
          expectedOrder: audio.expectedOrder,
          format: format,
          base64Length: audioBase64.length,
          bufferSize: audio.orderedAudioBuffer.size
        })

        // 验证base64数据
        if (!audioBase64 || audioBase64.length === 0) {
          console.error('❌ 音频数据为空')
          return
        }

        // 存储音频片段到有序缓冲区
        set((state) => ({
          audio: {
            ...state.audio,
            orderedAudioBuffer: new Map(state.audio.orderedAudioBuffer.set(order, {
              data: audioBase64,
              format: format
            }))
          }
        }))
        console.log(`🎵 音频片段 #${order} 已存储到缓冲区`)

        // 尝试播放按顺序排列的音频片段
        get().processOrderedAudioBuffer()
      } catch (error) {
        console.error('❌ 处理带顺序号的TTS音频片段失败:', error)
      }
    },

    // 流式TTS音频播放功能（兼容旧版本）
    playTTSAudioChunk: (audioBase64, format = 'mp3') => {
      try {
        const {audio} = get()
        console.log('🎵 处理流式音频片段:', {
          format: format,
          base64Length: audioBase64.length,
          isValidBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(audioBase64),
          currentQueueLength: audio.audioQueue.length,
          isCurrentlyPlaying: audio.isPlayingQueue
        })

        // 验证base64数据
        if (!audioBase64 || audioBase64.length === 0) {
          console.error('❌ 音频数据为空')
          return
        }

        // 将音频片段添加到队列
        set((state) => ({
          audio: {
            ...state.audio,
            audioQueue: [...state.audio.audioQueue, {
              data: audioBase64,
              format: format
            }]
          }
        }))
        console.log('🎵 音频片段已加入队列，当前队列长度:', audio.audioQueue.length + 1)

        // 如果没有在播放，开始播放队列
        if (!audio.isPlayingQueue) {
          console.log('🎵 开始播放音频队列...')
          get().playAudioQueue()
        } else {
          console.log('🎵 音频队列正在播放中，片段已排队')
        }
      } catch (error) {
        console.error('❌ 处理流式TTS音频片段失败:', error)
      }
    },

    // TTS完成处理
    onTTSComplete: () => {
      const {audio} = get()
      console.log('🎵 TTS生成完成，队列中还有', audio.audioQueue.length, '个音频片段，缓冲区还有', audio.orderedAudioBuffer.size, '个片段')

      // 处理剩余的缓冲区音频（防止有遗漏的片段）
      if (audio.orderedAudioBuffer.size > 0) {
        console.log('🎵 处理缓冲区中剩余的音频片段...')
        // 按顺序处理剩余的音频片段
        const remainingOrders = Array.from(audio.orderedAudioBuffer.keys()).sort((a, b) => a - b)
        for (const order of remainingOrders) {
          const audioChunk = audio.orderedAudioBuffer.get(order)
          audio.orderedAudioBuffer.delete(order)
          set((state) => ({
            audio: {
              ...state.audio,
              audioQueue: [...state.audio.audioQueue, audioChunk]
            }
          }))
          console.log(`🎵 将缓冲区音频片段 #${order} 加入播放队列`)
        }

        // 如果没有在播放，开始播放队列
        if (!audio.isPlayingQueue && audio.audioQueue.length > 0) {
          console.log('🎵 开始播放剩余音频队列...')
          get().playAudioQueue()
        }
      }

      // 重置顺序号，为下次对话做准备
      set((state) => ({
        audio: {
          ...state.audio,
          expectedOrder: 1,
          isTTSGenerationComplete: true
        }
      }))
      console.log('🎵 已重置音频顺序号，准备下次对话')

      // 检查是否所有音频都播放完成
      get().checkAllAudioPlaybackComplete()
    }
  }
})
