import { createContext, useContext, useState } from 'react'

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

// 创建 Context
const VoiceContext = createContext()

// Provider 组件
export const VoiceProvider = ({ children }) => {
  const [currentVoice, setCurrentVoice] = useState('zh_female_meilinvyou_emo_v2_mars_bigtts')
  const [currentSpeed, setCurrentSpeed] = useState(1.2)
  const [currentASR, setCurrentASR] = useState('xfyun')
  const [toastFunction, setToastFunction] = useState(null)

  // 对话阶段状态
  const [conversationStage, setConversationStage] = useState({
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
  })
  const [isManualStageControl, setIsManualStageControl] = useState(true)
  const [manualStage, setManualStage] = useState('')

  // 注册Toast函数
  const registerToast = (toastFn) => {
    setToastFunction(() => toastFn)
  }

  // 显示通知的统一方法
  const showNotification = (title, description, variant = 'default') => {
    if (toastFunction) {
      toastFunction({
        title,
        description,
        variant,
        duration: 2000
      })
    }
  }

  // WebSocket 引用
  const [wsRef, setWsRef] = useState(null)

  // 切换音色的方法
  const changeVoice = (voiceId) => {
    setCurrentVoice(voiceId)
    const voiceName = voiceNames[voiceId] || '未知音色'
    console.log(`🎵 音色已切换为: ${voiceName} (${voiceId})`)

    // 显示通知
    showNotification('音色切换', `音色已切换为: ${voiceName}`)

    // 发送音色切换请求到后端
    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
      wsRef.send(JSON.stringify({
        type: 'change_voice',
        voice: voiceId
      }));
      console.log(`📤 音色切换请求已发送: ${voiceId}`);
    }
  }

  // 获取当前音色名称
  const getCurrentVoiceName = () => {
    return voiceNames[currentVoice] || '未知音色'
  }

  // 切换语速的方法
  const changeSpeed = (speed) => {
    setCurrentSpeed(speed)
    console.log(`🎚️ 语速已调节为: ${speed.toFixed(1)}x`)

    // 显示通知
    const speedText = getSpeedDescription(speed)
    showNotification('语速调节', `语速已调节为: ${speed.toFixed(1)}x (${speedText})`)

    // 发送语速调节请求到后端
    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
      wsRef.send(JSON.stringify({
        type: 'change_speed',
        speed: speed
      }));
      console.log(`📤 语速调节请求已发送: ${speed}`);
    }
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

  // 切换ASR的方法
  const changeASR = (asrId) => {
    setCurrentASR(asrId)
    const asrName = asrNames[asrId] || '未知ASR'
    console.log(`🎤 ASR已切换为: ${asrName} (${asrId})`)

    // 显示通知
    showNotification('语音识别切换', `ASR已切换为: ${asrName}`)

    // 发送ASR切换请求到后端
    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
      wsRef.send(JSON.stringify({
        type: 'change_asr',
        asr_type: asrId
      }));
      console.log(`📤 ASR切换请求已发送: ${asrId}`);
    }
  }

  // 获取当前ASR名称
  const getCurrentASRName = () => {
    return asrNames[currentASR] || '未知ASR'
  }

  // 更新对话阶段信息（其他组件会调用）
  const updateConversationStage = (stageInfo) => {
    try {
      console.log('🔧 updateConversationStage 被调用，参数:', stageInfo)

      setConversationStage(prev => ({
        ...prev,
        ...stageInfo
      }))

      console.log('✅ 对话阶段信息已更新')
    } catch (error) {
      console.error('❌ 更新对话阶段信息失败:', error)
    }
  }

  // 手动切换对话阶段
  const changeStage = (selectedStage) => {
    setIsManualStageControl(false)
    setManualStage(selectedStage)

    const stageName = stageNames[selectedStage] || selectedStage
    console.log(`🎛️ 手动设置对话阶段为: ${selectedStage}`)

    // 显示通知
    showNotification('对话阶段调节', `对话阶段已手动调节为: ${stageName}`)

    // 发送阶段调节请求到后端
    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
      wsRef.send(JSON.stringify({
        type: 'manual_stage_change',
        stage: selectedStage
      }));
      console.log(`📤 手动阶段调节请求已发送: ${selectedStage}`);
    }
  }

  // 获取当前阶段名称
  const getCurrentStageName = () => {
    return stageNames[conversationStage.stage_name] || '未知阶段'
  }

  // WebSocket 相关方法
  const setWebSocketRef = (ws) => {
    setWsRef(ws)
  }

  const getWebSocketRef = () => {
    return wsRef
  }

  const value = {
    currentVoice,
    voiceNames,
    changeVoice,
    getCurrentVoiceName,
    currentSpeed,
    changeSpeed,
    getSpeedDescription,
    currentASR,
    asrNames,
    changeASR,
    getCurrentASRName,
    registerToast,
    showNotification,
    // 对话阶段相关
    conversationStage,
    stageNames,
    updateConversationStage,
    changeStage,
    getCurrentStageName,
    isManualStageControl,
    manualStage,
    // WebSocket 相关
    setWebSocketRef,
    getWebSocketRef,
    wsRef
  }

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  )
}

// 自定义 Hook
export const useVoice = () => {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }
  return context
}

export default VoiceContext
