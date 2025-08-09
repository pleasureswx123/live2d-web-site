import { useRef, useCallback, useEffect } from 'react'
import { useVoiceStore } from '../stores/voiceStore'

export const useTTSPlayer = () => {
  const audioContextRef = useRef(null)
  const audioQueueRef = useRef([])
  const isPlayingRef = useRef(false)
  const currentSourceRef = useRef(null)
  
  const { tts, setTTSSpeaking } = useVoiceStore()
  
  // 初始化音频上下文
  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
    
    return audioContextRef.current
  }, [])
  
  // 播放音频缓冲区
  const playAudioBuffer = useCallback(async (audioBuffer) => {
    if (tts.isMuted) return
    
    try {
      const audioContext = await initializeAudioContext()
      
      const source = audioContext.createBufferSource()
      const gainNode = audioContext.createGain()
      
      source.buffer = audioBuffer
      source.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // 设置音量（可以根据需要调整）
      gainNode.gain.value = 1.0
      
      currentSourceRef.current = source
      
      return new Promise((resolve, reject) => {
        source.onended = () => {
          currentSourceRef.current = null
          resolve()
        }
        
        source.onerror = (error) => {
          currentSourceRef.current = null
          reject(error)
        }
        
        source.start()
      })
      
    } catch (error) {
      console.error('音频播放失败:', error)
      throw error
    }
  }, [tts.isMuted, initializeAudioContext])
  
  // 处理音频队列
  const processAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return
    
    isPlayingRef.current = true
    setTTSSpeaking(true)
    
    try {
      while (audioQueueRef.current.length > 0) {
        const audioBuffer = audioQueueRef.current.shift()
        await playAudioBuffer(audioBuffer)
      }
    } catch (error) {
      console.error('音频队列处理失败:', error)
    } finally {
      isPlayingRef.current = false
      setTTSSpeaking(false)
    }
  }, [playAudioBuffer, setTTSSpeaking])
  
  // 添加音频到队列
  const addAudioToQueue = useCallback(async (audioData) => {
    try {
      // 解码Base64音频数据
      const binaryString = atob(audioData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      const audioContext = await initializeAudioContext()
      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer)
      
      audioQueueRef.current.push(audioBuffer)
      processAudioQueue()
      
    } catch (error) {
      console.error('音频解码失败:', error)
    }
  }, [initializeAudioContext, processAudioQueue])
  
  // 停止播放
  const stopPlaying = useCallback(() => {
    if (currentSourceRef.current) {
      currentSourceRef.current.stop()
      currentSourceRef.current = null
    }
    
    audioQueueRef.current = []
    isPlayingRef.current = false
    setTTSSpeaking(false)
  }, [setTTSSpeaking])
  
  // 清空队列
  const clearQueue = useCallback(() => {
    audioQueueRef.current = []
  }, [])
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopPlaying()
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [stopPlaying])
  
  return {
    isSpeaking: tts.isSpeaking,
    addAudioToQueue,
    stopPlaying,
    clearQueue
  }
}
