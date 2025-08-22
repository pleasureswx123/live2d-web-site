import { useEffect, useRef } from 'react'
import { useSystemControlStore } from '../stores/systemControlStore'
import { useWebSocket } from '../contexts/WebSocketContext'
import { Wifi, Brain, Search, Zap, RotateCcw } from 'lucide-react'

const SystemControl = () => {
  const {
    // connectionStatus,
    isWarmedUp,
    isWarmingUp,
    isDeepThinking,
    isSearchEnabled,
    isTogglingThinking,
    warmupLLM,
    toggleDeepThinking,
    toggleSearch,
    resetSystemState,
    getConnectionStatusText,
    getLLMStatusText,
    getThinkingStatusText,
    getSearchStatusText,
    startStatusPolling
  } = useSystemControlStore()
  const {connectionStatus} = useWebSocket();

  const cleanupRef = useRef(null)

  // 组件挂载时开始状态轮询
  useEffect(() => {
    cleanupRef.current = startStatusPolling()

    // 组件卸载时清理定时器
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [startStatusPolling])

  // 状态指示器组件
  const StatusDot = ({ status, type = 'default' }) => {
    let colorClass = 'bg-gray-400' // 默认灰色

    if (type === 'connection') {
      colorClass = status ? 'bg-green-500' : 'bg-red-500'
    } else if (type === 'llm') {
      if (isWarmingUp) {
        colorClass = 'bg-yellow-500 animate-pulse'
      } else {
        colorClass = status ? 'bg-green-500' : 'bg-yellow-500'
      }
    }

    return (
      <div className={`w-3 h-3 rounded-full ${colorClass} flex-shrink-0`}></div>
    )
  }

  // 状态项组件
  const StatusItem = ({ icon: Icon, dot, text, status, type }) => (
    <div className="status-item flex items-center space-x-3 py-2 px-3 bg-gray-50 rounded-lg">
      <Icon size={16} className="text-gray-600" />
      <StatusDot status={status} type={type} />
      <span className="text-sm font-medium text-gray-700 flex-1">{text}</span>
    </div>
  )

  // 处理预热LLM
  const handleWarmup = async () => {
    const result = await warmupLLM()
    if (!result.success) {
      alert(`预热失败：${result.error}`)
    }
  }

  // 处理深度思考切换
  const handleToggleThinking = async () => {
    const result = await toggleDeepThinking()
    if (!result.success) {
      alert(`切换深度思考失败：${result.error}`)
    }
  }

  return (
    <div className="system-control  p-4 shadow-lg rounded-xl">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Zap size={18} className="text-blue-600 mr-2" />
          <span className="font-semibold text-gray-800">系统控制</span>
        </div>
        <button
          onClick={resetSystemState}
          className="text-xs text-gray-500 hover:text-red-500 transition-colors"
          title="重置状态"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* 状态显示 */}
      <div className="status-section space-y-3 mb-4">
        <StatusItem
          icon={Wifi}
          status={connectionStatus}
          type="connection"
          text={getConnectionStatusText()}
        />
        <StatusItem
          icon={Brain}
          status={isWarmedUp}
          type="llm"
          text={getLLMStatusText()}
        />
      </div>

      {/* 控制按钮 */}
      <div className="control-buttons space-y-3">
        {/* 预热LLM按钮 */}
        <button
          onClick={handleWarmup}
          disabled={isWarmingUp || isWarmedUp}
          className={`control-btn w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            isWarmingUp
              ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
              : isWarmedUp
              ? 'bg-green-100 text-green-700 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isWarmingUp ? '🔄 预热中...' : isWarmedUp ? '✅ 已预热' : '🔥 预热LLM'}
        </button>

        {/* 深度思考按钮 */}
        <button
          onClick={handleToggleThinking}
          disabled={isTogglingThinking}
          className={`control-btn w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            isDeepThinking
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } ${isTogglingThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isTogglingThinking
            ? '🔄 切换中...'
            : isDeepThinking
            ? '🧠 关闭深度思考'
            : '🧠 开启深度思考'
          }
        </button>

        {/* 联网搜索按钮 */}
        <button
          onClick={toggleSearch}
          className={`control-btn w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            isSearchEnabled
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Search size={16} className="inline mr-2" />
          {isSearchEnabled ? '关闭联网搜索' : '开启联网搜索'}
        </button>
      </div>

      {/* 状态信息 */}
      <div className="status-info mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600 space-y-1">
          <div>{getThinkingStatusText()}</div>
          <div>{getSearchStatusText()}</div>
          {connectionStatus && (
            <div className="text-green-600">
              🟢 系统运行正常
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SystemControl
