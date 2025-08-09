import React, { useEffect, useState } from 'react'
import { useSystemStore } from '../../stores/systemStore'
import { useSystemAPI } from '../../hooks/useSystemAPI'

// 开关组件
const Toggle = ({ label, checked, onChange, description, icon }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex-1">
      <div className="flex items-center space-x-2">
        {icon && <span>{icon}</span>}
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
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

// 系统状态显示组件
const SystemStatus = () => {
  const { getSystemStatus, errors, notifications } = useSystemStore()
  const { getSystemStatus: getAPISystemStatus } = useSystemAPI()
  const [systemInfo, setSystemInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const status = getSystemStatus()

  useEffect(() => {
    const fetchSystemStatus = async () => {
      setIsLoading(true)
      try {
        const info = await getAPISystemStatus()
        setSystemInfo(info)
      } catch (error) {
        console.error('获取系统状态失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSystemStatus()
    // 每30秒刷新一次
    const interval = setInterval(fetchSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [getAPISystemStatus])

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-800">📊 系统状态</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-blue-600 font-bold text-lg">{status.activeFeatures.length}</div>
          <div className="text-blue-700 text-xs">活跃功能</div>
        </div>

        <div className={`border rounded-lg p-3 text-center ${
          status.hasErrors ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        }`}>
          <div className={`font-bold text-lg ${
            status.hasErrors ? 'text-red-600' : 'text-green-600'
          }`}>
            {errors.length}
          </div>
          <div className={`text-xs ${
            status.hasErrors ? 'text-red-700' : 'text-green-700'
          }`}>
            错误数量
          </div>
        </div>
      </div>

      {/* 后端系统状态 */}
      {isLoading ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-gray-500 text-sm">加载系统状态中...</div>
        </div>
      ) : systemInfo ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-green-700 text-sm font-medium mb-2">后端状态:</div>
          <div className="text-xs space-y-1">
            <div>模型预热: {systemInfo.is_warmed_up ? '✅ 已预热' : '❌ 未预热'}</div>
            {systemInfo.model_info && (
              <div>模型: {systemInfo.model_info}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-red-700 text-sm">无法获取后端状态</div>
        </div>
      )}

      {status.activeFeatures.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-blue-700 text-sm font-medium mb-2">活跃功能列表:</div>
          <div className="flex flex-wrap gap-1">
            {status.activeFeatures.map((feature) => (
              <span key={feature} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 错误日志组件
const ErrorLog = () => {
  const { errors, removeError, clearErrors } = useSystemStore()

  if (errors.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">🐛 错误日志</h3>
        <div className="text-center text-gray-500 py-4">
          <div className="text-2xl mb-2">✅</div>
          <div>暂无错误</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800">🐛 错误日志</h3>
        <button
          onClick={clearErrors}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          清空日志
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {errors.map((error) => (
          <div key={error.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-red-700 text-sm font-medium">{error.message}</div>
                <div className="text-red-600 text-xs mt-1">
                  {error.type} • {new Date(error.timestamp).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => removeError(error.id)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 通知管理组件
const NotificationManager = () => {
  const { notifications, removeNotification, clearNotifications } = useSystemStore()

  if (notifications.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">🔔 通知管理</h3>
        <div className="text-center text-gray-500 py-4">
          <div className="text-2xl mb-2">🔕</div>
          <div>暂无通知</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800">🔔 通知管理</h3>
        <button
          onClick={clearNotifications}
          className="text-blue-500 hover:text-blue-700 text-sm"
        >
          清空通知
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {notifications.map((notification) => (
          <div key={notification.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-blue-700 text-sm">{notification.message}</div>
                <div className="text-blue-600 text-xs mt-1">
                  {notification.type} • {new Date(notification.timestamp).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-blue-500 hover:text-blue-700 ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 主系统设置抽屉组件
const SystemSettingsDrawer = () => {
  const { settings, updateSetting, resetSystem } = useSystemStore()
  const { toggleDeepThinking, warmupLLM, testTTS } = useSystemAPI()
  const [isProcessing, setIsProcessing] = useState(false)

  // 处理深度思考切换
  const handleDeepThinkingToggle = async (enabled) => {
    setIsProcessing(true)
    try {
      await toggleDeepThinking(enabled)
    } catch (error) {
      console.error('切换深度思考失败:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 处理模型预热
  const handleWarmup = async () => {
    setIsProcessing(true)
    try {
      await warmupLLM()
    } catch (error) {
      console.error('模型预热失败:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // 处理TTS测试
  const handleTTSTest = async () => {
    setIsProcessing(true)
    try {
      await testTTS()
    } catch (error) {
      console.error('TTS测试失败:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">⚙️</div>
        <div className="text-lg font-medium">系统设置</div>
        <div className="text-gray-600 text-sm">配置系统功能和查看状态</div>
      </div>

      {/* 系统状态 */}
      <SystemStatus />

      {/* 功能开关 */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-800">🔧 功能开关</h3>

        <Toggle
          icon="🧠"
          label="深度思考"
          checked={settings.deepThinking}
          onChange={handleDeepThinkingToggle}
          description="启用AI深度思考模式，提供更详细的回答"
        />

        <Toggle
          icon="🌐"
          label="联网搜索"
          checked={settings.internetSearch}
          onChange={(value) => updateSetting('internetSearch', value)}
          description="允许AI进行联网搜索获取最新信息"
        />

        <Toggle
          icon="🔥"
          label="模型预热"
          checked={settings.modelPreheating}
          onChange={(value) => updateSetting('modelPreheating', value)}
          description="预热AI模型以提高响应速度"
        />

        <Toggle
          icon="🔄"
          label="自动同步"
          checked={settings.autoSync}
          onChange={(value) => updateSetting('autoSync', value)}
          description="自动同步用户数据和对话状态"
        />

        <Toggle
          icon="🐛"
          label="调试模式"
          checked={settings.debugMode}
          onChange={(value) => updateSetting('debugMode', value)}
          description="显示详细的调试信息和日志"
        />
      </div>

      {/* 错误日志 */}
      <div className="border-t border-gray-200 pt-4">
        <ErrorLog />
      </div>

      {/* 通知管理 */}
      <div className="border-t border-gray-200 pt-4">
        <NotificationManager />
      </div>

      {/* 系统操作 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">🔧 系统操作</h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleWarmup}
            disabled={isProcessing}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors text-sm"
          >
            {isProcessing ? '预热中...' : '模型预热'}
          </button>

          <button
            onClick={handleTTSTest}
            disabled={isProcessing}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors text-sm"
          >
            {isProcessing ? '测试中...' : 'TTS测试'}
          </button>
        </div>

        <button
          onClick={resetSystem}
          disabled={isProcessing}
          className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-colors"
        >
          重置系统状态
        </button>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-yellow-700 text-sm">
            <div className="font-medium mb-1">⚠️ 注意</div>
            <div className="text-xs">
              重置系统状态将清除所有错误日志、通知和UI状态，但不会影响用户数据和聊天记录。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettingsDrawer
