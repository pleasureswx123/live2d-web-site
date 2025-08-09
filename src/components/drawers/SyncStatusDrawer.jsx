import React from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useWebSocket } from '../../hooks/useWebSocket'

const SyncStatusDrawer = () => {
  const { isConnected, connectionStatus, lastSync } = useChatStore()
  const { connect, disconnect } = useWebSocket()
  
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: '🟢', color: 'green', text: '已连接' }
      case 'connecting':
        return { icon: '🟡', color: 'yellow', text: '连接中' }
      case 'disconnected':
        return { icon: '🔴', color: 'red', text: '未连接' }
      case 'error':
        return { icon: '❌', color: 'red', text: '连接错误' }
      default:
        return { icon: '❓', color: 'gray', text: '未知状态' }
    }
  }
  
  const config = getStatusConfig()
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">🔄</div>
        <div className="text-lg font-medium">同步状态</div>
        <div className="text-gray-600 text-sm">查看连接和同步状态</div>
      </div>
      
      {/* 连接状态 */}
      <div className={`border rounded-lg p-4 ${
        isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="text-center">
          <div className="text-2xl mb-2">{config.icon}</div>
          <div className={`font-medium ${
            isConnected ? 'text-green-700' : 'text-red-700'
          }`}>
            {config.text}
          </div>
        </div>
      </div>
      
      {/* 同步信息 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">同步信息</h3>
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>最后同步:</span>
            <span className="font-medium">
              {lastSync ? new Date(lastSync).toLocaleString() : '从未同步'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>连接状态:</span>
            <span className={`font-medium text-${config.color}-600`}>
              {config.text}
            </span>
          </div>
        </div>
      </div>
      
      {/* 连接控制 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">连接控制</h3>
        <div className="space-y-2">
          {isConnected ? (
            <button
              onClick={disconnect}
              className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              断开连接
            </button>
          ) : (
            <button
              onClick={connect}
              className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              重新连接
            </button>
          )}
        </div>
      </div>
      
      {/* 连接提示 */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-yellow-700 text-sm">
            <div className="font-medium mb-1">⚠️ 连接提示</div>
            <div className="text-xs">
              请确保后端服务正在运行，并检查网络连接是否正常。
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SyncStatusDrawer
