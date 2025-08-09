import { useEffect, useRef, useCallback } from 'react'
import { useVoiceStore } from '../stores/voiceStore'
import { useWebSocket, MESSAGE_TYPES } from './useWebSocket'

export const useASR = () => {
  const mediaRecorderRef = useRef(null)
  const audioStreamRef = useRef(null)
  const audioContextRef = useRef(null)
  const workletNodeRef = useRef(null)
  const isRecordingRef = useRef(false)
  
  const { 
    asr, 
    setASRRecording, 
    setASRText, 
    resetASRText,
    setAudioStream,
    setMediaRecorder,
    setAudioContext,
    cleanupAudioResources
  } = useVoiceStore()
  
  const { sendMessage } = useWebSocket()
  
  // 初始化音频上下文和工作节点
  const initializeAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000
        })
        setAudioContext(audioContextRef.current)
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      
      return audioContextRef.current
    } catch (error) {
      console.error('音频上下文初始化失败:', error)
      throw error
    }
  }, [setAudioContext])
  
  // 获取麦克风权限和音频流
  const getMicrophoneStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      audioStreamRef.current = stream
      setAudioStream(stream)
      return stream
    } catch (error) {
      console.error('获取麦克风权限失败:', error)
      throw error
    }
  }, [setAudioStream])
  
  // 创建PCM音频处理器
  const createPCMProcessor = useCallback(async (audioContext, stream) => {
    try {
      // 加载音频工作节点
      await audioContext.audioWorklet.addModule('/js/pcm-processor.js')
      
      const source = audioContext.createMediaStreamSource(stream)
      const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor')
      
      workletNodeRef.current = workletNode
      
      // 监听PCM数据
      workletNode.port.onmessage = (event) => {
        const { type, data } = event.data
        
        if (type === 'pcm-data' && isRecordingRef.current) {
          // 发送PCM数据到后端进行ASR
          sendMessage({
            type: MESSAGE_TYPES.ASR_CHUNK,
            audio_data: Array.from(data),
            engine: asr.currentEngine
          })
        }
      }
      
      source.connect(workletNode)
      workletNode.connect(audioContext.destination)
      
      return workletNode
    } catch (error) {
      console.error('PCM处理器创建失败:', error)
      throw error
    }
  }, [sendMessage, asr.currentEngine])
  
  // 开始录音
  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return
    
    try {
      resetASRText()
      
      const audioContext = await initializeAudioContext()
      const stream = await getMicrophoneStream()
      
      // 创建MediaRecorder作为备用
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      setMediaRecorder(mediaRecorder)
      
      // 创建PCM处理器
      await createPCMProcessor(audioContext, stream)
      
      // 开始录音
      isRecordingRef.current = true
      setASRRecording(true)
      
      // 发送开始录音信号
      sendMessage({
        type: MESSAGE_TYPES.ASR_START,
        engine: asr.currentEngine
      })
      
      console.log('🎤 开始录音')
      
    } catch (error) {
      console.error('开始录音失败:', error)
      isRecordingRef.current = false
      setASRRecording(false)
      throw error
    }
  }, [
    initializeAudioContext,
    getMicrophoneStream,
    createPCMProcessor,
    resetASRText,
    setASRRecording,
    setMediaRecorder,
    sendMessage,
    asr.currentEngine
  ])
  
  // 停止录音
  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return
    
    try {
      isRecordingRef.current = false
      setASRRecording(false)
      
      // 发送停止录音信号
      sendMessage({
        type: MESSAGE_TYPES.ASR_END,
        engine: asr.currentEngine
      })
      
      // 清理资源
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect()
        workletNodeRef.current = null
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
        audioStreamRef.current = null
        setAudioStream(null)
      }
      
      console.log('🎤 停止录音')
      
    } catch (error) {
      console.error('停止录音失败:', error)
    }
  }, [setASRRecording, setAudioStream, sendMessage, asr.currentEngine])
  
  // 空格键长按录音处理
  useEffect(() => {
    if (!asr.isSpaceKeyASRActive) return
    
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && !event.repeat && !isRecordingRef.current) {
        event.preventDefault()
        startRecording()
      }
    }
    
    const handleKeyUp = (event) => {
      if (event.code === 'Space' && isRecordingRef.current) {
        event.preventDefault()
        stopRecording()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [asr.isSpaceKeyASRActive, startRecording, stopRecording])
  
  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      stopRecording()
      cleanupAudioResources()
    }
  }, [stopRecording, cleanupAudioResources])
  
  return {
    isRecording: asr.isRecording,
    currentText: asr.currentText,
    bestText: asr.bestText,
    startRecording,
    stopRecording
  }
}
