import { useVoice } from '../contexts/VoiceContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const VoiceSelector = () => {
  const { currentVoice, voiceNames, changeVoice, getCurrentVoiceName } = useVoice()

  // 处理音色切换
  const handleVoiceChange = (selectedVoice) => {
    changeVoice(selectedVoice)
  }

  return (
    <div className="voice-selector-sidebar">
      {/* 标题 */}
      <div className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        🎵 音色选择
      </div>

      {/* 选择框 */}
      <Select value={currentVoice} onValueChange={handleVoiceChange}>
        <SelectTrigger className="w-full mb-3">
          <SelectValue placeholder="选择音色" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(voiceNames).map(([voiceId, voiceName]) => (
            <SelectItem key={voiceId} value={voiceId}>
              {voiceName} {voiceId === 'zh_female_meilinvyou_emo_v2_mars_bigtts' ? '(默认)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 状态显示 */}
      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
        当前: {getCurrentVoiceName()}
      </div>
    </div>
  )
}

export default VoiceSelector
