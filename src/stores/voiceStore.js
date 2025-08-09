import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 语音功能状态管理
export const useVoiceStore = create(
  persist(
    (set, get) => ({
      // ASR (语音识别) 状态
      asr: {
        isRecording: false,
        isSpaceKeyASRActive: false,
        currentEngine: 'xfyun', // 'xfyun', 'doubao'
        currentText: '',
        bestText: '',
        lastResultTime: null,
        isListening: false,
        volumeThreshold: 0.01,
        silenceThreshold: 1000,
        engines: {
          xfyun: '讯飞ASR',
          doubao: '豆包ASR'
        }
      },
      
      // TTS (语音合成) 状态
      tts: {
        isSpeaking: false,
        currentVoice: 'zh_female_meilinvyou_emo_v2_mars_bigtts',
        currentSpeed: 1.2,
        isMuted: false,
        voices: {
          'zh_female_meilinvyou_emo_v2_mars_bigtts': '魅力女友',
          'zh_female_roumeinvyou_emo_v2_mars_bigtts': '柔美女友'
        }
      },
      
      // 音频流状态
      audioStream: null,
      mediaRecorder: null,
      audioContext: null,
      
      // 长按空格键状态
      spaceKey: {
        isPressed: false,
        startTime: null,
        timer: null,
        holdThreshold: 400 // 0.4秒
      },
      
      // Actions
      // ASR Actions
      setASRRecording: (isRecording) => set((state) => ({
        asr: { ...state.asr, isRecording }
      })),
      
      setASREngine: (engine) => set((state) => ({
        asr: { ...state.asr, currentEngine: engine }
      })),
      
      setASRText: (currentText, bestText = null) => set((state) => ({
        asr: {
          ...state.asr,
          currentText,
          bestText: bestText || state.asr.bestText,
          lastResultTime: Date.now()
        }
      })),
      
      setSpaceKeyASRActive: (isActive) => set((state) => ({
        asr: { ...state.asr, isSpaceKeyASRActive: isActive }
      })),
      
      setASRListening: (isListening) => set((state) => ({
        asr: { ...state.asr, isListening }
      })),
      
      resetASRText: () => set((state) => ({
        asr: { ...state.asr, currentText: '', bestText: '', lastResultTime: null }
      })),
      
      // TTS Actions
      setTTSSpeaking: (isSpeaking) => set((state) => ({
        tts: { ...state.tts, isSpeaking }
      })),
      
      setTTSVoice: (voice) => set((state) => ({
        tts: { ...state.tts, currentVoice: voice }
      })),
      
      setTTSSpeed: (speed) => set((state) => ({
        tts: { ...state.tts, currentSpeed: speed }
      })),
      
      setTTSMuted: (isMuted) => set((state) => ({
        tts: { ...state.tts, isMuted }
      })),
      
      // Audio Stream Actions
      setAudioStream: (stream) => set({ audioStream: stream }),
      setMediaRecorder: (recorder) => set({ mediaRecorder: recorder }),
      setAudioContext: (context) => set({ audioContext: context }),
      
      // Space Key Actions
      setSpaceKeyPressed: (isPressed, startTime = null) => set((state) => ({
        spaceKey: { ...state.spaceKey, isPressed, startTime }
      })),
      
      setSpaceKeyTimer: (timer) => set((state) => ({
        spaceKey: { ...state.spaceKey, timer }
      })),
      
      // 清理音频资源
      cleanupAudioResources: () => {
        const state = get()
        
        // 停止录音
        if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
          state.mediaRecorder.stop()
        }
        
        // 关闭音频流
        if (state.audioStream) {
          state.audioStream.getTracks().forEach(track => track.stop())
        }
        
        // 关闭音频上下文
        if (state.audioContext && state.audioContext.state !== 'closed') {
          state.audioContext.close()
        }
        
        // 清除定时器
        if (state.spaceKey.timer) {
          clearTimeout(state.spaceKey.timer)
        }
        
        set({
          audioStream: null,
          mediaRecorder: null,
          audioContext: null,
          spaceKey: { ...state.spaceKey, timer: null, isPressed: false }
        })
      }
    }),
    {
      name: 'voice-storage',
      partialize: (state) => ({
        asr: {
          currentEngine: state.asr.currentEngine,
          volumeThreshold: state.asr.volumeThreshold,
          silenceThreshold: state.asr.silenceThreshold
        },
        tts: {
          currentVoice: state.tts.currentVoice,
          currentSpeed: state.tts.currentSpeed,
          isMuted: state.tts.isMuted
        }
      })
    }
  )
)
