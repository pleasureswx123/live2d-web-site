import { useWebSocket } from '../contexts/WebSocketContext'

const WebSocketStatus = () => {
  const { connectionStatus, connectWebSocket, disconnectWebSocket } = useWebSocket()

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500'
      case 'connecting':
        return 'text-yellow-500'
      case 'disconnected':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '已连接'
      case 'connecting':
        return '连接中...'
      case 'disconnected':
        return '未连接'
      default:
        return '未知状态'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢'
      case 'connecting':
        return '🟡'
      case 'disconnected':
        return '🔴'
      default:
        return '⚪'
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700  m-4 shadow-lg rounded-xl">
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <div>
          <div className="text-sm font-medium text-white">WebSocket 连接</div>
          <div className={`text-xs ${getStatusColor()}`}>
            {getStatusText()}
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        {connectionStatus === 'disconnected' && (
          <button
            onClick={connectWebSocket}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            重连
          </button>
        )}
        {connectionStatus === 'connected' && (
          <button
            onClick={disconnectWebSocket}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            断开
          </button>
        )}
      </div>
    </div>
  )
}

export default WebSocketStatus
