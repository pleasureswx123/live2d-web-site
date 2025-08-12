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

// 创建 Context
const VoiceContext = createContext()

// Provider 组件
export const VoiceProvider = ({ children }) => {
  const [currentVoice, setCurrentVoice] = useState('zh_female_meilinvyou_emo_v2_mars_bigtts')
  const [currentSpeed, setCurrentSpeed] = useState(1.2)
  const [currentASR, setCurrentASR] = useState('xfyun')
  const [toastFunction, setToastFunction] = useState(null)

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

  // 切换音色的方法
  const changeVoice = (voiceId) => {
    setCurrentVoice(voiceId)
    const voiceName = voiceNames[voiceId] || '未知音色'
    console.log(`🎵 音色已切换为: ${voiceName} (${voiceId})`)

    // 显示通知
    showNotification('音色切换', `音色已切换为: ${voiceName}`)

    // to do 后续后完善，发送音色切换请求到后端
    // if (ws && ws.readyState === WebSocket.OPEN) {
    //   ws.send(JSON.stringify({
    //     type: 'change_voice',
    //     voice: currentVoice
    //   }));
    //   console.log(`📤 音色切换请求已发送: ${currentVoice}`);
    // }
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

    // to do ... 发送语速调节请求到后端
    // if (ws && ws.readyState === WebSocket.OPEN) {
    //   ws.send(JSON.stringify({
    //     type: 'change_speed',
    //     speed: currentSpeed
    //   }));
    //   console.log(`📤 语速调节请求已发送: ${currentSpeed}`);
    // }
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

    // to do ... 发送ASR切换请求到后端
    // if (ws && ws.readyState === WebSocket.OPEN) {
    //   ws.send(JSON.stringify({
    //     type: 'change_asr',
    //     asr_type: currentASR
    //   }));
    //   console.log(`📤 ASR切换请求已发送: ${currentASR}`);
    // }
  }

  // 获取当前ASR名称
  const getCurrentASRName = () => {
    return asrNames[currentASR] || '未知ASR'
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
    showNotification
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
