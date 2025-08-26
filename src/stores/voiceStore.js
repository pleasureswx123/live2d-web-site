import { create } from 'zustand'

// 音色名称映射
const voiceNames = {
  'zh_female_meilinvyou_emo_v2_mars_bigtts': '魅力女友',
  'zh_female_roumeinvyou_emo_v2_mars_bigtts': '柔美女友'
}

// ASR名称映射
const asrNames = {
  'xfyun': '讯飞ASR',
  'doubao': '豆包ASR'
}

// 对话阶段名称映射
const stageNames = {
  'initial_meeting': '初识阶段',
  'getting_to_know': '了解阶段',
  'new_friends': '新朋友阶段',
  'close_friends': '普通朋友阶段',
  'ambiguous': '暧昧阶段',
  'love': '恋爱阶段'
}

// 获取语速描述
const getSpeedDescription = (speed) => {
  if (speed < 0.8) {
    return '慢速'
  } else if (speed > 1.2) {
    return '快速'
  } else {
    return '正常'
  }
}

// 语音设置状态管理store
export const useVoiceStore = create((set, get) => ({
  // ===================
  // 核心状态
  // ===================
  // 当前音色设置
  currentVoice: 'zh_female_meilinvyou_emo_v2_mars_bigtts',
  // 当前语速设置
  currentSpeed: 1.2,
  // 当前ASR设置
  currentASR: 'xfyun',
  // Toast函数引用
  toastFunction: null,
  // WebSocket引用
  wsRef: null,

  // ===================
  // 对话阶段状态
  // ===================
  conversationStage: {
    stage: 'initial_meeting',
    turn_count: 0,
    stage_name: '初识阶段',
    description: '悠悠比较害羞试探，希望了解用户基本信息',
    key_info_status: {
      name: false,
      identity: false,
      hobbies: false
    },
    info_completion: 0,
    is_manual: false
  },
  // 手动阶段控制
  isManualStageControl: true,
  manualStage: '',

  // ===================
  // 常量映射
  // ===================
  voiceNames,
  asrNames,
  stageNames,

  // ===================
  // Toast相关方法
  // ===================
  // 注册Toast函数
  registerToast: (toastFn) => {
    set({ toastFunction: toastFn })
  },

  // 显示通知的统一方法
  showNotification: (title, description, variant = 'default') => {
    const { toastFunction } = get()
    if (toastFunction) {
      toastFunction({
        title,
        description,
        variant,
        duration: 2000
      })
    }
  },

  // ===================
  // 音色相关方法
  // ===================
  // 切换音色
  changeVoice: (voiceId) => {
    const { wsRef, showNotification } = get()
    const voiceName = voiceNames[voiceId] || '未知音色'
    
    set({ currentVoice: voiceId })
    console.log(`🎵 音色已切换为: ${voiceName} (${voiceId})`)

    // 显示通知
    showNotification('音色切换', `音色已切换为: ${voiceName}`)

    // 发送音色切换请求到后端
    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
      wsRef.send(JSON.stringify({
        type: 'change_voice',
        voice: voiceId
      }))
      console.log(`📤 音色切换请求已发送: ${voiceId}`)
    }
  },

  // 获取当前音色名称
  getCurrentVoiceName: () => {
    const { currentVoice } = get()
    return voiceNames[currentVoice] || '未知音色'
  },

  // ===================
  // 语速相关方法
  // ===================
  // 切换语速
  changeSpeed: (speed) => {
    const { wsRef, showNotification } = get()
    
    set({ currentSpeed: speed })
    console.log(`🎚️ 语速已调节为: ${speed.toFixed(1)}x`)

    // 显示通知
    const speedText = getSpeedDescription(speed)
    showNotification('语速调节', `语速已调节为: ${speed.toFixed(1)}x (${speedText})`)

    // 发送语速调节请求到后端
    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
      wsRef.send(JSON.stringify({
        type: 'change_speed',
        speed: speed
      }))
      console.log(`📤 语速调节请求已发送: ${speed}`)
    }
  },

  // 获取语速描述
  getSpeedDescription,

  // ===================
  // ASR相关方法
  // ===================
  // 切换ASR
  changeASR: (asrId) => {
    const { wsRef, showNotification } = get()
    const asrName = asrNames[asrId] || '未知ASR'
    
    set({ currentASR: asrId })
    console.log(`🎤 ASR已切换为: ${asrName} (${asrId})`)

    // 显示通知
    showNotification('语音识别切换', `ASR已切换为: ${asrName}`)

    // 发送ASR切换请求到后端
    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
      wsRef.send(JSON.stringify({
        type: 'change_asr',
        asr_type: asrId
      }))
      console.log(`📤 ASR切换请求已发送: ${asrId}`)
    }
  },

  // 获取当前ASR名称
  getCurrentASRName: () => {
    const { currentASR } = get()
    return asrNames[currentASR] || '未知ASR'
  },

  // ===================
  // 对话阶段相关方法
  // ===================
  // 更新对话阶段信息
  updateConversationStage: (stageInfo) => {
    try {
      console.log('🔧 updateConversationStage 被调用，参数:', stageInfo)

      set((state) => ({
        conversationStage: {
          ...state.conversationStage,
          ...stageInfo
        }
      }))

      console.log('✅ 对话阶段信息已更新')
    } catch (error) {
      console.error('❌ 更新对话阶段信息失败:', error)
    }
  },

  // 手动切换对话阶段
  changeStage: (selectedStage) => {
    const { wsRef, showNotification } = get()
    const stageName = stageNames[selectedStage] || selectedStage
    
    set({
      isManualStageControl: false,
      manualStage: selectedStage
    })
    
    console.log(`🎛️ 手动设置对话阶段为: ${selectedStage}`)

    // 显示通知
    showNotification('对话阶段调节', `对话阶段已手动调节为: ${stageName}`)

    // 发送阶段调节请求到后端
    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
      wsRef.send(JSON.stringify({
        type: 'manual_stage_change',
        stage: selectedStage
      }))
      console.log(`📤 手动阶段调节请求已发送: ${selectedStage}`)
    }
  },

  // 获取当前阶段名称
  getCurrentStageName: () => {
    const { conversationStage } = get()
    return stageNames[conversationStage.stage_name] || '未知阶段'
  },

  // ===================
  // WebSocket相关方法
  // ===================
  // 设置WebSocket引用
  setWebSocketRef: (ws) => {
    set({ wsRef: ws })
  },

  // 获取WebSocket引用
  getWebSocketRef: () => {
    const { wsRef } = get()
    return wsRef
  }
}))
