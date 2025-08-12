import { createContext, useContext, useState } from 'react'

// 音色名称映射
const voiceNames = {
  'zh_female_meilinvyou_emo_v2_mars_bigtts': '魅力女友',
  'zh_female_roumeinvyou_emo_v2_mars_bigtts': '柔美女友'
}

// 创建 Context
const VoiceContext = createContext()

// Provider 组件
export const VoiceProvider = ({ children }) => {
  const [currentVoice, setCurrentVoice] = useState('zh_female_meilinvyou_emo_v2_mars_bigtts')

  // 切换音色的方法
  const changeVoice = (voiceId) => {
    setCurrentVoice(voiceId)
    const voiceName = voiceNames[voiceId] || '未知音色'
    console.log(`🎵 音色已切换为: ${voiceName} (${voiceId})`)

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

  const value = {
    currentVoice,
    voiceNames,
    changeVoice,
    getCurrentVoiceName
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
