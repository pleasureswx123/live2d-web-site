import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { useUserAuthStore } from '../stores/userAuthStore'
import { useLastActiveTime } from '../hooks/useTimeFormat'
import { X, Users, RefreshCw, Clock, User } from 'lucide-react'

// 用户项组件
const UserItem = ({ user, index, onSwitchUser }) => {
  const lastActiveTime = useLastActiveTime(user.last_active)

  return (
    <motion.div
      key={user.user_id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      onClick={() => onSwitchUser(user)}
      className="user-item p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-all duration-200 hover:shadow-md"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div className="user-item-info flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
            <User size={16} className="text-white" />
          </div>
          <div>
            <div className="user-item-name font-medium text-gray-800">
              {user.name || '匿名用户'}
            </div>
            <div className="user-item-id text-sm text-gray-500">
              ID: {user.user_id}
            </div>
          </div>
        </div>
        <div className="user-item-time text-xs text-gray-400 bg-white px-2 py-1 rounded-full">
          {lastActiveTime}
        </div>
      </div>
    </motion.div>
  )
}

const SwitchUserDialog = () => {
  const {
    ui,
    users,
    switchToUser,
    switchToUserByName,
    loadRecentUsers,
    hideSwitchUserDialog,
  } = useUserAuthStore()

  const [switchUsername, setSwitchUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 当对话框打开时加载用户列表
  useEffect(() => {
    if (ui.showSwitchUserDialog) {
      loadRecentUsers()
    }
  }, [ui.showSwitchUserDialog, loadRecentUsers])

  // 处理手动输入用户名切换
  const handleUserSwitch = async () => {
    setIsLoading(true)
    try {
      const success = await switchToUserByName(switchUsername)
      if (success) {
        setSwitchUsername('')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleUserSwitch()
    }
  }

  return (
    <Dialog.Root open={ui.showSwitchUserDialog} onOpenChange={hideSwitchUserDialog}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </Dialog.Overlay>

        <Dialog.Content asChild>
          <motion.div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3, type: "spring", damping: 20 }}
            >
            {/* 对话框头部 */}
            <div className="modal-header p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <Dialog.Title className="text-xl font-bold text-gray-800 mb-1 flex items-center">
                    <Users size={24} className="mr-2 text-blue-600" />
                    切换用户
                  </Dialog.Title>
                  <Dialog.Description className="text-gray-600">
                    选择要切换到的用户账户
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                    <X size={20} />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* 对话框内容 */}
            <div className="switch-user-content p-6 overflow-y-auto max-h-[60vh]">
              {/* 最近使用的用户 */}
              <div className="quick-switch-section mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Clock size={16} className="mr-2" />
                  最近使用的用户
                </h4>
                <div className="recent-users-list">
                  {users.recent.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="no-users-text text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-xl"
                    >
                      暂无其他用户
                    </motion.div>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {users.recent.map((user, index) => (
                          <UserItem
                            key={user.user_id}
                            user={user}
                            index={index}
                            onSwitchUser={switchToUser}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* 登录其他用户 */}
              <div className="new-user-section">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <User size={16} className="mr-2" />
                  登录其他用户
                </h4>
                <div className="form-group mb-4">
                  <label htmlFor="switchUsernameInput" className="block text-sm font-medium text-gray-600 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    id="switchUsernameInput"
                    value={switchUsername}
                    onChange={(e) => setSwitchUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入用户名..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* 按钮组 */}
            <div className="login-buttons p-6 border-t border-gray-100 flex gap-3">
              <motion.button
                onClick={handleUserSwitch}
                disabled={isLoading || !switchUsername.trim()}
                className={`login-btn flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  isLoading || !switchUsername.trim()
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                }`}
                whileHover={!isLoading && switchUsername.trim() ? { scale: 1.02 } : {}}
                whileTap={!isLoading && switchUsername.trim() ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    切换中...
                  </div>
                ) : (
                  <>
                    <RefreshCw size={16} className="inline mr-2" />
                    切换
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={hideSwitchUserDialog}
                className="login-btn flex-1 py-3 px-4 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                取消
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default SwitchUserDialog
