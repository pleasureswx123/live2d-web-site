/**
 * 音频播放工具函数
 * 解决浏览器自动播放限制问题
 */

class AudioPlaybackManager {
  constructor() {
    this.audioContext = null
    this.isUnlocked = false
    this.pendingAudio = []
    this.userInteractionEvents = ['click', 'touchstart', 'keydown', 'mousedown']
    this.init()
  }

  // 初始化
  init() {
    this.setupUserInteractionListeners()
    this.detectAutoplaySupport()
  }

  // 设置用户交互监听器
  setupUserInteractionListeners() {
    const handleUserInteraction = () => {
      this.unlockAudio()
    }

    this.userInteractionEvents.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { 
        once: true, 
        passive: true 
      })
    })
  }

  // 检测自动播放支持
  async detectAutoplaySupport() {
    try {
      const audio = new Audio()
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
      audio.volume = 0.01
      audio.muted = true
      
      await audio.play()
      this.isUnlocked = true
      console.log('✅ 自动播放可用')
    } catch (error) {
      console.log('🔒 自动播放被限制，等待用户交互')
    }
  }

  // 解锁音频播放
  async unlockAudio() {
    if (this.isUnlocked) return true

    try {
      // 创建或恢复音频上下文
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // 播放静音音频解锁
      const buffer = this.audioContext.createBuffer(1, 1, 22050)
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(this.audioContext.destination)
      source.start(0)

      this.isUnlocked = true
      console.log('🎵 音频播放已解锁')

      // 处理待播放音频
      this.processPendingAudio()
      
      return true
    } catch (error) {
      console.error('❌ 音频解锁失败:', error)
      return false
    }
  }

  // 处理待播放音频
  processPendingAudio() {
    if (this.pendingAudio.length > 0) {
      console.log(`🎵 处理 ${this.pendingAudio.length} 个待播放音频`)
      
      this.pendingAudio.forEach(({ audio, resolve, reject }) => {
        audio.play().then(resolve).catch(reject)
      })
      
      this.pendingAudio = []
    }
  }

  // 播放音频（主要方法）
  async playAudio(audio) {
    if (this.isUnlocked) {
      try {
        await audio.play()
        return true
      } catch (error) {
        console.error('音频播放失败:', error)
        throw error
      }
    } else {
      // 尝试解锁
      const unlocked = await this.unlockAudio()
      
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
          this.pendingAudio.push({ audio, resolve, reject })
          console.log('🎵 音频已加入待播放队列')
        })
      }
    }
  }

  // 从Base64创建并播放音频
  async playAudioFromBase64(base64Data, format = 'mp3', volume = 0.8) {
    try {
      // 解码Base64
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // 创建Blob和URL
      const blob = new Blob([bytes], { type: `audio/${format}` })
      const audioUrl = URL.createObjectURL(blob)

      // 创建音频元素
      const audio = new Audio(audioUrl)
      audio.volume = volume

      // 设置清理函数
      const cleanup = () => {
        URL.revokeObjectURL(audioUrl)
      }

      audio.addEventListener('ended', cleanup)
      audio.addEventListener('error', cleanup)

      // 播放音频
      await this.playAudio(audio)
      
      return audio
    } catch (error) {
      console.error('Base64音频播放失败:', error)
      throw error
    }
  }

  // 获取状态
  getStatus() {
    return {
      isUnlocked: this.isUnlocked,
      pendingCount: this.pendingAudio.length,
      hasAudioContext: !!this.audioContext,
      audioContextState: this.audioContext?.state
    }
  }

  // 显示用户提示
  showUserPrompt(onEnable, onCancel) {
    const promptDiv = document.createElement('div')
    promptDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="
          background: white;
          padding: 24px;
          border-radius: 8px;
          max-width: 400px;
          margin: 16px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">🔊</div>
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">启用音频播放</h3>
          <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
            为了播放TTS音频，需要您的授权。这是浏览器的安全策略要求。
          </p>
          <div style="display: flex; gap: 12px;">
            <button id="enable-audio" style="
              flex: 1;
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            ">启用音频</button>
            <button id="cancel-audio" style="
              flex: 1;
              background: #6c757d;
              color: white;
              border: none;
              padding: 10px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            ">稍后再说</button>
          </div>
          <p style="margin: 12px 0 0 0; color: #999; font-size: 12px;">
            我们不会收集任何音频数据
          </p>
        </div>
      </div>
    `

    document.body.appendChild(promptDiv)

    const enableBtn = promptDiv.querySelector('#enable-audio')
    const cancelBtn = promptDiv.querySelector('#cancel-audio')

    const cleanup = () => {
      document.body.removeChild(promptDiv)
    }

    enableBtn.addEventListener('click', async () => {
      const success = await this.unlockAudio()
      cleanup()
      if (onEnable) onEnable(success)
    })

    cancelBtn.addEventListener('click', () => {
      cleanup()
      if (onCancel) onCancel()
    })

    return cleanup
  }
}

// 创建全局实例
const audioManager = new AudioPlaybackManager()

// 导出便捷函数
export const playAudioFromBase64 = (base64Data, format = 'mp3', volume = 0.8) => {
  return audioManager.playAudioFromBase64(base64Data, format, volume)
}

export const playAudio = (audio) => {
  return audioManager.playAudio(audio)
}

export const getAudioStatus = () => {
  return audioManager.getStatus()
}

export const unlockAudio = () => {
  return audioManager.unlockAudio()
}

export const showAudioPrompt = (onEnable, onCancel) => {
  return audioManager.showUserPrompt(onEnable, onCancel)
}

export default audioManager
