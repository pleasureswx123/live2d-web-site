import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserAuthStore } from '../stores/userAuthStore'
import { User, RefreshCw, Users, LogOut, Wifi, WifiOff } from 'lucide-react'

const UserInfoCard = () => {
  const {
    currentUser,
    session,
    ui,
    status,
    handleManualSync,
    logoutUser,
    showSwitchUserDialog,
  } = useUserAuthStore()

  // 格式化同步时间
  const formatSyncTime = (time) => {
    if (!time) return '未同步'

    const syncTime = new Date(time)
    const now = new Date()
    const diffMinutes = Math.floor((now - syncTime) / (1000 * 60))

    if (diffMinutes < 1) {
      return '刚刚同步'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`
    } else {
      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) {
        return `${diffHours}小时前`
      } else {
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays}天前`
      }
    }
  }

  // 如果没有用户信息，不显示组件
  if (!currentUser.id || !currentUser.name) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="user-info-section p-4 shadow-lg rounded-xl"
    >
      {/* 应用标题 */}
      <div className="sidebar-header mb-4">
        <motion.h1
          className="text-2xl font-bold text-gray-800 mb-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          悠悠
        </motion.h1>

        {/* 用户信息卡片 */}
        <motion.div
          className="user-info bg-white rounded-xl p-4 shadow-lg border border-gray-100"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* 用户基本信息 */}
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-lg">{currentUser.name}</h3>
              <p className="text-sm text-gray-500">ID: {currentUser.id}</p>
            </div>
            {/* 在线状态指示器 */}
            <div className="flex items-center">
              {session.isOffline ? (
                <WifiOff size={16} className="text-red-500" title="离线模式" />
              ) : (
                <Wifi size={16} className="text-green-500" title="在线" />
              )}
            </div>
          </div>

          {/* 用户操作按钮 */}
          <div className="user-actions grid grid-cols-2 gap-2 mb-4">
            <motion.button
              onClick={handleManualSync}
              disabled={ui.isSyncing}
              className={`sync-btn flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                ui.isSyncing
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:scale-105'
              }`}
              whileHover={{ scale: ui.isSyncing ? 1 : 1.05 }}
              whileTap={{ scale: ui.isSyncing ? 1 : 0.95 }}
              title="手动同步用户数据"
            >
              <RefreshCw
                size={14}
                className={`mr-1 ${ui.isSyncing ? 'animate-spin' : ''}`}
              />
              {ui.isSyncing ? '同步中' : '同步'}
            </motion.button>

            <motion.button
              onClick={showSwitchUserDialog}
              className="switch-user-btn flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="切换到其他用户"
            >
              <Users size={14} className="mr-1" />
              切换用户
            </motion.button>
          </div>

          {/* 同步信息 */}
          <div className="user-sync-info flex items-center justify-between text-xs mb-3">
            <span className="sync-time text-gray-500">
              {formatSyncTime(session.lastSync)}
            </span>
            <motion.span
              className={`online-indicator w-2 h-2 rounded-full ${
                session.isOffline ? 'bg-red-500' : 'bg-green-500'
              }`}
              animate={{
                scale: session.isOffline ? [1, 1.2, 1] : 1,
                opacity: session.isOffline ? [1, 0.5, 1] : 1
              }}
              transition={{
                duration: 2,
                repeat: session.isOffline ? Infinity : 0
              }}
              title={session.isOffline ? '离线模式' : '在线'}
            />
          </div>

          {/* 同步状态消息 */}
          <AnimatePresence>
            {status.sync.message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`sync-status p-2 rounded-lg text-xs ${
                  status.sync.type === 'success' ? 'bg-green-100 text-green-700' :
                  status.sync.type === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}
              >
                {status.sync.message}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 注销按钮 */}
      <motion.div
        className="logout-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <motion.button
          onClick={logoutUser}
          className="logout-btn w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-all duration-200 border border-red-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut size={16} className="mr-2" />
          注销登录
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export default UserInfoCard
