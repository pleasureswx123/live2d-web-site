import { useVoice } from '../contexts/VoiceContext'

const VoiceSelector = () => {
  const { currentVoice, voiceNames, changeVoice, getCurrentVoiceName } = useVoice()

  // 处理音色切换
  const handleVoiceChange = (event) => {
    const selectedVoice = event.target.value
    changeVoice(selectedVoice)
  }

  return (
    <div className="voice-selector-sidebar">
      {/* 标题 */}
      <div className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        🎵 音色选择
      </div>

      {/* 选择框 */}
      <select
        value={currentVoice}
        onChange={handleVoiceChange}
        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
      >
        {Object.entries(voiceNames).map(([voiceId, voiceName]) => (
          <option key={voiceId} value={voiceId}>
            {voiceName} {voiceId === 'zh_female_meilinvyou_emo_v2_mars_bigtts' ? '(默认)' : ''}
          </option>
        ))}
      </select>

      {/* 状态显示 */}
      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
        当前: {getCurrentVoiceName()}
      </div>
    </div>
  )
}

export default VoiceSelector
