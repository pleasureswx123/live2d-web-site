import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import * as Popover from '@radix-ui/react-popover'
import { useUserAuthStore } from '../stores/userAuthStore'
import { X, User, BarChart3, LogOut, Loader2 } from 'lucide-react'

const LoginDialog = () => {
  const {
    ui,
    status,
    users,
    handleUserLogin,
    searchUsers,
    selectUserSuggestion,
    logoutUser,
    openUserManagement,
    hideLoginDialog
  } = useUserAuthStore()

  const [username, setUsername] = useState('')
  const inputRef = useRef(null)

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && ui.showLoginDialog) {
        // ESC键关闭登录对话框（如果有其他用户已登录）
        if (useUserAuthStore.getState().currentUser.id) {
          hideLoginDialog()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [ui.showLoginDialog, hideLoginDialog])

  // 点击外部关闭用户建议
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ui.showUserSuggestions && inputRef.current && !inputRef.current.contains(e.target)) {
        useUserAuthStore.setState({
          ui: { ...useUserAuthStore.getState().ui, showUserSuggestions: false }
        })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ui.showUserSuggestions])

  // 处理用户名输入
  const handleUsernameChange = (e) => {
    const value = e.target.value
    setUsername(value)
    searchUsers(value)
  }

  // 选择用户建议
  const handleSelectUser = (user) => {
    selectUserSuggestion(user)
    setUsername(user.name || user.user_id)
  }

  // 处理登录
  const handleLogin = async () => {
    const success = await handleUserLogin(username)
    if (success) {
      setUsername('')
    }
  }

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLogin()
    }
  }

  return (
    <Dialog.Root open={ui.showLoginDialog} onOpenChange={hideLoginDialog}>
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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3, type: "spring", damping: 20 }}
            >
            {/* 登录头部 */}
            <div className="login-header p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <Dialog.Title className="text-2xl font-bold text-gray-800">
                  👋 欢迎使用悠悠AI
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                    <X size={20} />
                  </button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="text-gray-600">
                请输入您的用户名开始聊天
              </Dialog.Description>
            </div>

            {/* 登录表单 */}
            <div className="login-form p-6">
              <div className="form-group mb-6">
                <label htmlFor="usernameInput" className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                
                <Popover.Root open={ui.showUserSuggestions}>
                  <Popover.Trigger asChild>
                    <input
                      ref={inputRef}
                      type="text"
                      id="usernameInput"
                      value={username}
                      onChange={handleUsernameChange}
                      onKeyDown={handleKeyDown}
                      placeholder="输入您的用户名..."
                      autoComplete="off"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </Popover.Trigger>
                  
                  {/* 用户建议弹出层 */}
                  <Popover.Portal>
                    <Popover.Content
                      className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto w-[var(--radix-popover-trigger-width)]"
                      style={{ zIndex: 9999 }}
                      sideOffset={4}
                    >
                      <AnimatePresence>
                        {users.suggestions.map((user, index) => (
                          <motion.div
                            key={user.user_id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            onClick={() => handleSelectUser(user)}
                            className="user-suggestion p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                          >
                            <div className="suggestion-info">
                              <div className="suggestion-name font-medium text-gray-800">
                                {user.name || '未设置'}
                              </div>
                              <div className="suggestion-id text-sm text-gray-500">
                                {user.user_id}
                              </div>
                            </div>
                            <div className="suggestion-badge inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full mt-2">
                              已存在
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>

              {/* 登录按钮组 */}
              <div className="login-buttons space-y-3">
                <motion.button
                  onClick={handleLogin}
                  disabled={ui.isLoggingIn || !username.trim()}
                  className={`login-btn w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                    ui.isLoggingIn || !username.trim()
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                  }`}
                  whileHover={!ui.isLoggingIn && username.trim() ? { scale: 1.02 } : {}}
                  whileTap={!ui.isLoggingIn && username.trim() ? { scale: 0.98 } : {}}
                >
                  {ui.isLoggingIn ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      登录中...
                    </div>
                  ) : (
                    '开始聊天'
                  )}
                </motion.button>

                <div className="flex gap-3">
                  <motion.button
                    onClick={openUserManagement}
                    className="login-btn flex-1 py-2 px-4 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <BarChart3 size={16} className="inline mr-2" />
                    管理用户
                  </motion.button>
                  
                  <motion.button
                    onClick={logoutUser}
                    className="login-btn flex-1 py-2 px-4 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut size={16} className="inline mr-2" />
                    注销登录
                  </motion.button>
                </div>
              </div>

              {/* 登录状态消息 */}
              <AnimatePresence>
                {status.login.message && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`login-status mt-4 p-3 rounded-xl text-sm ${
                      status.login.type === 'success' ? 'bg-green-100 text-green-700' :
                      status.login.type === 'error' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {status.login.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default LoginDialog
