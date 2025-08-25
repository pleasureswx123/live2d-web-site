import {useState, useEffect, useRef} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import {Command} from 'cmdk'
import {useUserAuthStore} from '../stores/userAuthStore'
import {X, User, BarChart3, LogOut, Loader2} from 'lucide-react'

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
  // 选择用户建议
  const handleSelectUser = (user) => {
    selectUserSuggestion(user)
    setUsername(user.name || user.user_id)
    // 选择用户后自动登录
    handleUserLogin(user.name || user.user_id)
  }
  // 处理登录
  const handleLogin = async () => {
    const success = await handleUserLogin(username)
    if (success) {
      setUsername('')
    }
  }
  // 处理键盘事件 - 只在没有建议时允许回车登录
  const handleKeyDown = (e) => {
    // 只有在没有用户建议时才允许回车键直接登录
    if (e.key === 'Enter' && (!ui.showUserSuggestions || users.suggestions.length === 0)) {
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
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.2}}
          />
        </Dialog.Overlay>

        <Dialog.Content asChild>
          <motion.div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.2}}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
              initial={{opacity: 0, scale: 0.9, y: -20}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.9, y: -20}}
              transition={{duration: 0.3, type: "spring", damping: 20}}
            >
              {/* 登录头部 */}
              <div className="login-header p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <Dialog.Title className="text-2xl font-bold text-gray-800">
                    👋 欢迎使用悠悠AI
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                      <X size={20}/>
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

                  <div className="relative">
                    <Command className="w-full">
                      <Command.Input
                        ref={inputRef}
                        value={username}
                        onValueChange={(value) => {
                          setUsername(value)
                          searchUsers(value)
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="输入您的用户名..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />

                      {ui.showUserSuggestions && users.suggestions.length > 0 && (
                        <Command.List
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                          <AnimatePresence>
                            {users.suggestions.map((user, index) => (
                              <Command.Item
                                key={user.user_id}
                                value={user.name || user.user_id}
                                onSelect={() => handleSelectUser(user)}
                                className="user-suggestion p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700"
                              >
                                <div className="suggestion-info">
                                  <div className="suggestion-name font-medium text-gray-800">
                                    {user.name || '未设置'}
                                  </div>
                                  <div className="suggestion-id text-sm text-gray-500">
                                    {user.user_id}
                                  </div>
                                </div>
                                <div
                                  className="suggestion-badge inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full mt-2">
                                  已存在
                                </div>
                              </Command.Item>
                            ))}
                          </AnimatePresence>
                        </Command.List>
                      )}
                    </Command>
                  </div>
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
                    whileHover={!ui.isLoggingIn && username.trim() ? {scale: 1.02} : {}}
                    whileTap={!ui.isLoggingIn && username.trim() ? {scale: 0.98} : {}}
                  >
                    {ui.isLoggingIn ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2"/>
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
                      whileHover={{scale: 1.02}}
                      whileTap={{scale: 0.98}}
                    >
                      <BarChart3 size={16} className="inline mr-2"/>
                      管理用户
                    </motion.button>

                    <motion.button
                      onClick={logoutUser}
                      className="login-btn flex-1 py-2 px-4 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
                      whileHover={{scale: 1.02}}
                      whileTap={{scale: 0.98}}
                    >
                      <LogOut size={16} className="inline mr-2"/>
                      注销登录
                    </motion.button>
                  </div>
                </div>

                {/* 登录状态消息 */}
                <AnimatePresence>
                  {status.login.message && (
                    <motion.div
                      initial={{opacity: 0, height: 0}}
                      animate={{opacity: 1, height: 'auto'}}
                      exit={{opacity: 0, height: 0}}
                      transition={{duration: 0.2}}
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
