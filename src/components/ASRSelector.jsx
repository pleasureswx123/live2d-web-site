import { useVoice } from '../contexts/VoiceContext'
import { useToast } from './ui/toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const ASRSelector = () => {
  const { currentASR, asrNames, changeASR, getCurrentASRName } = useVoice()
  const { addToast } = useToast()

  // 处理ASR切换
  const handleASRChange = (selectedASR) => {
    changeASR(selectedASR)
    
    // 显示通知
    const asrName = asrNames[selectedASR] || '未知ASR'
    addToast({
      title: "语音识别切换",
      description: `ASR已切换为: ${asrName}`,
      variant: "default",
      duration: 2000
    })
  }

  return (
    <div className="asr-selector-sidebar">
      {/* 标题 */}
      <div className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        🎤 语音识别
      </div>

      {/* 选择框 */}
      <Select value={currentASR} onValueChange={handleASRChange}>
        <SelectTrigger className="w-full mb-3">
          <SelectValue placeholder="选择ASR服务" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(asrNames).map(([asrId, asrName]) => (
            <SelectItem key={asrId} value={asrId}>
              {asrName} {asrId === 'xfyun' ? '(默认)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 状态显示 */}
      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
        当前: {getCurrentASRName()}
      </div>
    </div>
  )
}

export default ASRSelector
