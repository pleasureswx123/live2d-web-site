import { create } from 'zustand'
import { playAudioFromBase64, showAudioPrompt, getAudioStatus } from '../utils/audioUtils'
import { useProactiveChatStore } from './proactiveChatStore'

// TTS音频播放状态管理store
export const useTTSStore = create((set, get) => ({
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
    const { audio } = get()
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
    const { audio } = get()
    
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
    const { EXPRESSION_KEYWORDS } = get()
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
    const { expression } = get()
    
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
    const { stopCurrentAudio } = get()
    
    try {
      console.log('🔊 开始处理TTS音频数据:', {
        format: format,
        base64Length: audioBase64.length,
        base64Sample: audioBase64.substring(0, 50) + '...'
      })

      // 停止当前播放的音频
      stopCurrentAudio()

      // 使用新的音频工具播放
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

      // 设置事件监听器
      audio.onended = () => {
        console.log('音频播放完成')

        // 停止Live2D嘴部同步
        if (window.__stopLipSync) {
          window.__stopLipSync()
        }

        // 从跟踪列表中移除
        const { audio } = get()
        const index = audio.audioElements.indexOf(audio)
        if (index > -1) {
          set((state) => ({
            audio: {
              ...state.audio,
              audioElements: state.audio.audioElements.filter((_, i) => i !== index)
            }
          }))
        }

        if (audio.currentAudio === audio) {
          set((state) => ({
            audio: {
              ...state.audio,
              currentAudio: null
            }
          }))
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
        const { audio } = get()
        const index = audio.audioElements.indexOf(audio)
        if (index > -1) {
          set((state) => ({
            audio: {
              ...state.audio,
              audioElements: state.audio.audioElements.filter((_, i) => i !== index)
            }
          }))
        }

        if (audio.currentAudio === audio) {
          set((state) => ({
            audio: {
              ...state.audio,
              currentAudio: null
            }
          }))
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
              get().playTTSAudioBase(audioBase64, format, onComplete)
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
  },

  // 主要的音频播放函数（用于单独播放）
  playTTSAudio: (audioBase64, format = 'mp3') => {
    get().playTTSAudioBase(audioBase64, format)
  },

  // 处理有序音频缓冲区
  processOrderedAudioBuffer: () => {
    const { audio } = get()
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
    const { audio } = get()

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
      const { audio } = get()
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
    const { audio, wsRef } = get()

    console.log('🎵 检查音频播放完成状态:', {
      queueLength: audio.audioQueue.length,
      bufferSize: audio.orderedAudioBuffer.size,
      ttsComplete: audio.isTTSGenerationComplete,
      isPlaying: audio.isPlayingQueue
    })

    if (audio.audioQueue.length === 0 && audio.orderedAudioBuffer.size === 0 &&
      audio.isTTSGenerationComplete && !audio.isPlayingQueue) {
      
      // 实时获取最新的主动对话状态
      const { isProactiveChatEnabled } = useProactiveChatStore.getState();
      console.log('✅ 所有音频播放完成', isProactiveChatEnabled)
      
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
      const { audio } = get()
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
      const { audio } = get()
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
    const { audio } = get()
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
  },

  // 显示音频状态信息
  showAudioStatus: () => {
    const status = getAudioStatus()
    console.log('🎵 音频状态:', status)

    if (!status.isUnlocked && status.pendingCount > 0) {
      // 这里可以调用通知函数，暂时用console.log
      console.log('🔒 音频播放受限，有', status.pendingCount, '个音频等待播放，请点击页面任意位置启用音频')
    }
  }
}))
