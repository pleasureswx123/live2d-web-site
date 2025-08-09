import React, { useState, useEffect } from 'react'
import { useVoiceStore } from '../../stores/voiceStore'
import { useWebSocket, MESSAGE_TYPES } from '../../hooks/useWebSocket'

// 滑块组件
const Slider = ({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }) => (
  <div className="space-y-2">
    <div className="flex justify-between">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <span className="text-sm text-gray-600">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
    />
  </div>
)

// 选择器组件
const Selector = ({ label, value, onChange, options, disabled = false }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
    >
      {Object.entries(options || {}).map(([key, label]) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </select>
  </div>
)

// 开关组件
const Toggle = ({ label, checked, onChange, description }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex-1">
      <div className="font-medium text-gray-700">{label}</div>
      {description && <div className="text-sm text-gray-500">{description}</div>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-blue-500' : 'bg-gray-300'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  </div>
)

// ASR设置组件
const ASRSettings = () => {
  const {
    asr,
    setASREngine,
    setASRListening,
    setSpaceKeyASRActive
  } = useVoiceStore()

  const { sendMessage } = useWebSocket()

  // 处理ASR引擎切换
  const handleASREngineChange = (engine) => {
    setASREngine(engine)
    sendMessage({
      type: MESSAGE_TYPES.CHANGE_ASR,
      asr_type: engine
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">🎤 语音识别 (ASR)</h3>

      <Selector
        label="ASR引擎"
        value={asr.currentEngine}
        onChange={handleASREngineChange}
        options={asr.engines}
      />

      <Toggle
        label="空格键语音输入"
        checked={asr.isSpaceKeyASRActive}
        onChange={setSpaceKeyASRActive}
        description="长按空格键进行语音输入"
      />

      <Toggle
        label="持续监听"
        checked={asr.isListening}
        onChange={setASRListening}
        description="持续监听环境声音进行识别"
      />

      <Slider
        label="音量阈值"
        value={asr.volumeThreshold * 100}
        onChange={(value) => {
          // TODO: 实现音量阈值设置
        }}
        min={1}
        max={50}
        step={1}
        unit="%"
      />

      <Slider
        label="静音检测时长"
        value={asr.silenceThreshold}
        onChange={(value) => {
          // TODO: 实现静音检测设置
        }}
        min={500}
        max={3000}
        step={100}
        unit="ms"
      />

      {/* ASR状态显示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm">
          <div className="flex justify-between">
            <span>录音状态:</span>
            <span className={asr.isRecording ? 'text-red-600' : 'text-gray-600'}>
              {asr.isRecording ? '🔴 录音中' : '⚪ 待机'}
            </span>
          </div>
          {asr.currentText && (
            <div className="mt-2">
              <div className="text-gray-600">当前识别:</div>
              <div className="bg-white p-2 rounded border text-sm">
                {asr.currentText}
              </div>
            </div>
          )}
          {asr.bestText && (
            <div className="mt-2">
              <div className="text-gray-600">最佳结果:</div>
              <div className="bg-white p-2 rounded border text-sm">
                {asr.bestText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// TTS设置组件
const TTSSettings = () => {
  const {
    tts,
    setTTSVoice,
    setTTSSpeed,
    setTTSMuted
  } = useVoiceStore()

  const { sendMessage } = useWebSocket()

  // 处理音色切换
  const handleVoiceChange = (voice) => {
    setTTSVoice(voice)
    sendMessage({
      type: MESSAGE_TYPES.CHANGE_VOICE,
      voice: voice
    })
  }

  // 处理语速调节
  const handleSpeedChange = (speed) => {
    setTTSSpeed(speed)
    sendMessage({
      type: MESSAGE_TYPES.CHANGE_SPEED,
      speed: speed
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">🔊 语音合成 (TTS)</h3>

      <Selector
        label="音色选择"
        value={tts.currentVoice}
        onChange={handleVoiceChange}
        options={tts.voices}
      />

      <Slider
        label="语速"
        value={tts.currentSpeed}
        onChange={handleSpeedChange}
        min={0.5}
        max={2.0}
        step={0.1}
        unit="x"
      />

      <Toggle
        label="静音模式"
        checked={tts.isMuted}
        onChange={setTTSMuted}
        description="关闭TTS语音播放"
      />

      {/* TTS状态显示 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="text-sm">
          <div className="flex justify-between">
            <span>播放状态:</span>
            <span className={tts.isSpeaking ? 'text-green-600' : 'text-gray-600'}>
              {tts.isSpeaking ? '🟢 播放中' : '⚪ 待机'}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span>音量状态:</span>
            <span className={tts.isMuted ? 'text-red-600' : 'text-green-600'}>
              {tts.isMuted ? '🔇 静音' : '🔊 正常'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 音频权限测试组件
const AudioPermissionTest = () => {
  const [permissionStatus, setPermissionStatus] = useState('unknown')
  const [isTestingMic, setIsTestingMic] = useState(false)

  const testMicrophone = async () => {
    setIsTestingMic(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermissionStatus('granted')
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      setPermissionStatus('denied')
      console.error('麦克风权限测试失败:', error)
    }
    setIsTestingMic(false)
  }

  const getPermissionStatusConfig = () => {
    switch (permissionStatus) {
      case 'granted':
        return { icon: '✅', color: 'green', text: '已授权' }
      case 'denied':
        return { icon: '❌', color: 'red', text: '已拒绝' }
      default:
        return { icon: '❓', color: 'gray', text: '未知' }
    }
  }

  const config = getPermissionStatusConfig()

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">🎧 音频权限测试</h3>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span>麦克风权限:</span>
          <span className={`text-${config.color}-600`}>
            {config.icon} {config.text}
          </span>
        </div>
      </div>

      <button
        onClick={testMicrophone}
        disabled={isTestingMic}
        className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
      >
        {isTestingMic ? '测试中...' : '测试麦克风权限'}
      </button>

      {permissionStatus === 'denied' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-red-700 text-sm">
            ⚠️ 麦克风权限被拒绝，请在浏览器设置中允许麦克风访问
          </div>
        </div>
      )}
    </div>
  )
}

// 主语音设置抽屉组件
const VoiceSettingsDrawer = () => {
  const { cleanupAudioResources } = useVoiceStore()

  useEffect(() => {
    // 组件卸载时清理音频资源
    return () => {
      cleanupAudioResources()
    }
  }, [cleanupAudioResources])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">🎤</div>
        <div className="text-lg font-medium">语音设置</div>
        <div className="text-gray-600 text-sm">配置语音识别和语音合成功能</div>
      </div>

      <AudioPermissionTest />

      <div className="border-t border-gray-200 pt-4">
        <ASRSettings />
      </div>

      <div className="border-t border-gray-200 pt-4">
        <TTSSettings />
      </div>

      {/* 使用说明 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="text-yellow-700 text-sm">
          <div className="font-medium mb-1">💡 使用提示</div>
          <ul className="space-y-1 text-xs">
            <li>• 长按空格键可进行语音输入</li>
            <li>• 在聊天界面长按麦克风按钮也可录音</li>
            <li>• 建议在安静环境下使用语音功能</li>
            <li>• 可以调节语速来适应个人喜好</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default VoiceSettingsDrawer
