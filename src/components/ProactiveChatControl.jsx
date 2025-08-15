import { useState } from 'react'
import { useProactiveChatStore } from '../stores/proactiveChatStore'
import { useUserAuthStore } from '../stores/userAuthStore'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'

const ProactiveChatControl = () => {
  const {
    silenceTimeout,
    isProactiveChatEnabled,
    showDebugInfo,
    isApplying,
    setSilenceTimeout,
    applySilenceTimeout,
    toggleProactiveChat,
    toggleDebugInfo,
    getStatusText,
    getRecentTopicsText,
    getPendingStatusText,
    resetProactiveChatData
  } = useProactiveChatStore()

  const [tempTimeout, setTempTimeout] = useState(silenceTimeout)
  // 使用真实的当前用户ID（优先 currentUser.id，其次 session.userId）
  const currentUserId = useUserAuthStore((s) => s.currentUser?.id || s.session?.userId)

  // 处理滑块变化
  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value)
    setTempTimeout(value)
  }

  // 应用设置
  const handleApplySettings = async () => {
    if (!currentUserId) {
      console.warn('⚠️ 未登录或未选择用户，无法应用设置')
      return
    }
    setSilenceTimeout(tempTimeout)
    const success = await applySilenceTimeout(currentUserId)
    if (success) {
      // 可以添加成功提示
      console.log('设置应用成功')
    }
  }

  return (
    <div className="proactive-chat-controls">
      {/* 标题和说明 */}
      <div className="proactive-info mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-lg">🤖</span>
            <span className="ml-2 font-semibold text-gray-800">智能主动对话</span>
          </div>
          <button
            onClick={resetProactiveChatData}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            title="重置设置"
          >
            重置
          </button>
        </div>
        <small className="text-gray-600 text-sm">
          AI会在初始化和沉默时自动开启对话
        </small>
      </div>

      {/* 沉默时间控制 */}
      <div className="silence-control mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          沉默触发时间: <span className="font-bold text-blue-600">{tempTimeout}</span>秒
        </label>
        <input
          type="range"
          min="5"
          max="120"
          value={tempTimeout}
          step="5"
          onChange={handleSliderChange}
          className="silence-slider w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-3"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((tempTimeout - 5) / 115) * 100}%, #e5e7eb ${((tempTimeout - 5) / 115) * 100}%, #e5e7eb 100%)`
          }}
        />
        <button
          onClick={handleApplySettings}
          disabled={isApplying || tempTimeout === silenceTimeout || !currentUserId}
          className={`control-btn w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            isApplying || tempTimeout === silenceTimeout || !currentUserId
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isApplying ? '应用中...' : (!currentUserId ? '请先登录/选择用户' : '应用设置')}
        </button>
      </div>

      {/* 主动对话状态 */}
      <div className="proactive-status mb-3">
        <div className={`text-sm font-medium p-2 rounded-lg ${
          isProactiveChatEnabled 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {getStatusText()}
        </div>
      </div>

      {/* 调试信息切换 */}
      <div className="debug-toggle mb-3">
        <button
          onClick={toggleDebugInfo}
          className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>调试信息</span>
          {showDebugInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 调试信息 */}
      {showDebugInfo && (
        <div className="proactive-debug bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="text-xs text-gray-600">
            <span className="font-medium">最近话题:</span>
            <div className="mt-1 text-gray-500">
              {getRecentTopicsText()}
            </div>
          </div>
          
          <div className="text-xs text-yellow-600">
            {getPendingStatusText()}
          </div>
          
          <div className="text-xs text-gray-600">
            <span className="font-medium">对话次数:</span>
            <span className="ml-1">{useProactiveChatStore.getState().proactiveChatCount}</span>
          </div>
        </div>
      )}

      {/* 主动对话开关 */}
      <div className="proactive-toggle mt-4">
        <button
          onClick={toggleProactiveChat}
          className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            isProactiveChatEnabled
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isProactiveChatEnabled ? '关闭主动对话' : '开启主动对话'}
        </button>
      </div>
    </div>
  )
}

export default ProactiveChatControl
