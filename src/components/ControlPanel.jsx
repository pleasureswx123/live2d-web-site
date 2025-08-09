import React, { useState, useEffect } from 'react'
import { useSystemStore } from '../stores/systemStore'
import { useChatStore } from '../stores/chatStore'
import { useUserProfileStore } from '../stores/userProfileStore'
import { useVoiceStore } from '../stores/voiceStore'
import { useWebSocket, MESSAGE_TYPES } from '../hooks/useWebSocket'
import { useSystemAPI } from '../hooks/useSystemAPI'
import { useProactiveAPI } from '../hooks/useProactiveAPI'

// 控制面板组件 - 参考test.html的侧边栏设计
const ControlPanel = ({ isOpen, onClose }) => {
  const { isConnected, sendMessage } = useWebSocket()
  const { currentUserId, currentUserName } = useChatStore()
  const { profile, conversationStage } = useUserProfileStore()
  const { tts, asr } = useVoiceStore()
  const { settings, updateSetting } = useSystemStore()
  const { getSystemStatus, toggleDeepThinking, warmupLLM } = useSystemAPI()
  const { setValidatedSilenceTimeout } = useProactiveAPI()

  const [systemInfo, setSystemInfo] = useState(null)
  const [silenceThreshold, setSilenceThreshold] = useState(30)

  // 获取系统状态
  useEffect(() => {
    const fetchSystemStatus = async () => {
      const info = await getSystemStatus()
      setSystemInfo(info)
    }

    if (isOpen) {
      fetchSystemStatus()
      const interval = setInterval(fetchSystemStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [isOpen, getSystemStatus])

  // 处理沉默阈值变化
  const handleSilenceThresholdChange = async (value) => {
    setSilenceThreshold(value)
    await setValidatedSilenceTimeout(value)
  }

  // 处理音色切换
  const handleVoiceChange = (voice) => {
    sendMessage({
      type: MESSAGE_TYPES.CHANGE_VOICE,
      voice: voice
    })
  }

  // 处理语速调节
  const handleSpeedChange = (speed) => {
    sendMessage({
      type: MESSAGE_TYPES.CHANGE_SPEED,
      speed: speed
    })
  }

  // 处理ASR引擎切换
  const handleASRChange = (engine) => {
    sendMessage({
      type: MESSAGE_TYPES.CHANGE_ASR,
      asr_type: engine
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 控制面板 */}
      <div className="relative w-80 bg-white shadow-2xl overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">悠悠控制面板</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* 用户信息 */}
          {currentUserName && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">👤 当前用户</h3>
              <div className="text-blue-800">
                <div className="font-medium">{currentUserName}</div>
                <div className="text-sm opacity-75">{currentUserId}</div>
              </div>
            </div>
          )}

          {/* 连接状态 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">🔗 系统状态</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">连接状态</span>
                <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? '🟢 已连接' : '🔴 未连接'}
                </span>
              </div>

              {systemInfo && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">模型状态</span>
                  <span className={`text-sm font-medium ${systemInfo.is_warmed_up ? 'text-green-600' : 'text-orange-600'}`}>
                    {systemInfo.is_warmed_up ? '✅ 已预热' : '⏳ 预热中'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 系统控制 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">⚙️ 系统控制</h3>
            <div className="space-y-3">
              <button
                onClick={() => warmupLLM()}
                className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                🔥 预热LLM
              </button>

              <button
                onClick={() => toggleDeepThinking(!settings.deepThinking)}
                className={`w-full p-2 rounded-lg transition-colors text-sm ${
                  settings.deepThinking 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🧠 {settings.deepThinking ? '关闭' : '开启'}深度思考
              </button>
            </div>
          </div>

          {/* 主动对话控制 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">🤖 主动对话</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  沉默触发时间: {silenceThreshold}秒
                </label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={silenceThreshold}
                  onChange={(e) => handleSilenceThresholdChange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="text-xs text-gray-500">
                AI会在用户沉默超过设定时间后主动开启对话
              </div>
            </div>
          </div>

          {/* 音色选择 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">🎵 音色选择</h3>
            <select
              value={tts.currentVoice}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            >
              {tts.voices && Object.entries(tts.voices).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-2">
              当前: {(tts.voices && tts.voices[tts.currentVoice]) || tts.currentVoice}
            </div>
          </div>

          {/* 语速调节 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">🎚️ 语速调节</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  语速: {tts.currentSpeed}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={tts.currentSpeed}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>慢</span>
                <span>正常</span>
                <span>快</span>
              </div>
            </div>
          </div>

          {/* ASR选择 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">🎤 语音识别</h3>
            <select
              value={asr.currentEngine}
              onChange={(e) => handleASRChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            >
              {asr.engines && Object.entries(asr.engines).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-2">
              当前: {(asr.engines && asr.engines[asr.currentEngine]) || asr.currentEngine}
            </div>
          </div>

          {/* 对话阶段 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">💬 对话阶段</h3>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">当前阶段: </span>
                <span className="font-medium">{conversationStage?.name || '未知'}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">对话轮数: </span>
                <span className="font-medium">第 {conversationStage?.turnCount || 1} 轮</span>
              </div>
              <div className="text-xs text-gray-500">
                {conversationStage?.description || '暂无描述'}
              </div>
              <div className="text-xs">
                <span className={`px-2 py-1 rounded ${
                  conversationStage?.isManual
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {conversationStage?.isManual ? '手动模式' : '自动模式'}
                </span>
              </div>
            </div>
          </div>

          {/* 用户档案进度 */}
          {profile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">📊 档案完成度</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>完成度</span>
                  <span className="font-medium">{profile.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profile.completionPercentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className={profile.keyInfo?.name ? 'text-green-600' : 'text-gray-400'}>
                      {profile.keyInfo?.name ? '✅' : '❌'}
                    </div>
                    <div>姓名</div>
                  </div>
                  <div className="text-center">
                    <div className={profile.keyInfo?.identity ? 'text-green-600' : 'text-gray-400'}>
                      {profile.keyInfo?.identity ? '✅' : '❌'}
                    </div>
                    <div>身份</div>
                  </div>
                  <div className="text-center">
                    <div className={profile.keyInfo?.hobbies ? 'text-green-600' : 'text-gray-400'}>
                      {profile.keyInfo?.hobbies ? '✅' : '❌'}
                    </div>
                    <div>爱好</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
