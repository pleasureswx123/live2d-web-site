import { create } from 'zustand'

// 用户认证和会话管理store
export const useUserAuthStore = create((set, get) => ({
  // 当前用户状态
  currentUser: {
    id: null,
    name: null,
    profile: null
  },

  // 会话管理
  session: {
    userId: null,
    userName: null,
    profile: null,
    lastSync: null,
    isOffline: false,
    sessionToken: null
  },

  // UI状态
  ui: {
    showLoginDialog: false, // 默认不显示登录对话框，等初始化完成后决定
    showSwitchUserDialog: false,
    showUserSuggestions: false,
    isLoading: false,
    isSyncing: false,
    isLoggingIn: false
  },

  // 用户数据
  users: {
    suggestions: [],
    recent: [],
    searchQuery: ''
  },

  // 状态消息
  status: {
    login: { message: '', type: '' },
    sync: { message: '', type: '' }
  },

  // 配置
  config: {
    apiBaseUrl: 'http://localhost:8000',
    sessionKey: 'user_session_v2',
    syncInterval: 60 * 60 * 1000, // 1小时
    userManagementUrl: 'http://localhost:8081/profile_manager.html'
  },

  // 会话管理方法
  sessionManager: {
    // 保存会话
    save: (userData) => {
      const session = {
        userId: userData.userId || userData.user_id,
        userName: userData.userName || userData.name,
        profile: userData.profile || {
          name: userData.userName || userData.name,
          age: userData.age || null,
          gender: userData.gender || null,
          style: userData.style || '友好',
          interests: userData.interests || []
        },
        lastSync: new Date().toISOString(),
        isOffline: false,
        sessionToken: userData.sessionToken || null
      }

      const { config } = get()
      localStorage.setItem(config.sessionKey, JSON.stringify(session))

      set({
        session,
        currentUser: {
          id: session.userId,
          name: session.userName,
          profile: session.profile
        }
      })

      console.log('✅ 用户会话已保存:', session)
      return session
    },

    // 加载会话
    load: () => {
      try {
        const { config } = get()
        const data = localStorage.getItem(config.sessionKey)

        if (data) {
          const session = JSON.parse(data)
          set({
            session,
            currentUser: {
              id: session.userId,
              name: session.userName,
              profile: session.profile
            },
            ui: { ...get().ui, showLoginDialog: false }
          })
          console.log('✅ 会话已从本地存储恢复:', session)
          return session
        }

        // 兼容旧版本数据
        return get().sessionManager.migrateOld()
      } catch (error) {
        console.error('❌ 加载会话失败:', error)
        return null
      }
    },

    // 迁移旧数据
    migrateOld: () => {
      const oldUserId = localStorage.getItem('currentUserId')
      const oldUserName = localStorage.getItem('currentUserName')

      if (oldUserId && oldUserName) {
        const session = get().sessionManager.save({
          userId: oldUserId,
          userName: oldUserName
        })

        // 清理旧数据
        localStorage.removeItem('currentUserId')
        localStorage.removeItem('currentUserName')

        return session
      }

      return null
    },

    // 清除会话
    clear: () => {
      const { config } = get()
      localStorage.removeItem(config.sessionKey)

      set({
        session: {
          userId: null,
          userName: null,
          profile: null,
          lastSync: null,
          isOffline: false,
          sessionToken: null
        },
        currentUser: {
          id: null,
          name: null,
          profile: null
        },
        ui: { ...get().ui, showLoginDialog: true }
      })

      console.log('✅ 用户会话已清除')
    },

    // 检查会话是否过期
    isExpired: () => {
      const { session, config } = get()
      if (!session.lastSync) return true

      const lastSync = new Date(session.lastSync)
      const now = new Date()
      const expired = (now - lastSync) > config.syncInterval

      console.log(`🕒 会话检查: 上次同步 ${lastSync.toLocaleString()}, ${expired ? '已过期' : '有效'}`)
      return expired
    },

    // 刷新会话
    refresh: async (showLoading = false) => {
      const { session, config } = get()

      if (!session.userId) {
        throw new Error('没有活跃会话')
      }

      try {
        if (showLoading) {
          set({ ui: { ...get().ui, isSyncing: true } })
          get().showSyncStatus('正在同步用户数据...', 'loading')
        }

        console.log('🔄 开始刷新用户会话...')
        const response = await fetch(`${config.apiBaseUrl}/api/user/${session.userId}/session`)
        const data = await response.json()

        if (data.success && data.profile) {
          const updatedSession = get().sessionManager.save({
            userId: session.userId,
            userName: data.profile.name,
            profile: data.profile,
            sessionToken: session.sessionToken
          })

          updatedSession.isOffline = false
          get().sessionManager.save(updatedSession)

          if (showLoading) {
            get().showSyncStatus('同步成功！', 'success')
          }

          console.log('✅ 会话刷新成功:', updatedSession)
          return updatedSession
        } else {
          throw new Error(data.error || '用户验证失败')
        }
      } catch (error) {
        console.error('❌ 会话刷新失败:', error)

        // 标记为离线状态
        if (session.userId) {
          const offlineSession = { ...session, isOffline: true }
          get().sessionManager.save(offlineSession)
        }

        if (showLoading) {
          get().showSyncStatus('同步失败，使用离线模式', 'error')
        }

        throw error
      } finally {
        set({ ui: { ...get().ui, isSyncing: false } })
      }
    }
  },

  // UI状态管理方法
  showLoginStatus: (message, type = 'error') => {
    set({
      status: {
        ...get().status,
        login: { message, type }
      }
    })

    if (type === 'success') {
      setTimeout(() => {
        set({
          status: {
            ...get().status,
            login: { message: '', type: '' }
          }
        })
      }, 3000)
    }
  },

  showSyncStatus: (message, type = 'info') => {
    set({
      status: {
        ...get().status,
        sync: { message, type }
      }
    })

    console.log(`📊 同步状态: ${message}`)

    setTimeout(() => {
      set({
        status: {
          ...get().status,
          sync: { message: '', type: '' }
        }
      })
    }, 3000)
  },

  // 用户搜索方法
  searchUsers: async (query) => {
    set({
      users: {
        ...get().users,
        searchQuery: query
      }
    })

    if (!query.trim()) {
      set({
        users: {
          ...get().users,
          suggestions: []
        },
        ui: {
          ...get().ui,
          showUserSuggestions: false
        }
      })
      return
    }

    try {
      const { config } = get()
      const response = await fetch(`${config.apiBaseUrl}/memory/users/active`)
      const data = await response.json()

      if (data.success && data.active_users) {
        const filteredUsers = data.active_users.filter(user =>
          user.name?.toLowerCase().includes(query.toLowerCase()) ||
          user.user_id?.toLowerCase().includes(query.toLowerCase())
        )

        set({
          users: {
            ...get().users,
            suggestions: filteredUsers
          },
          ui: {
            ...get().ui,
            showUserSuggestions: filteredUsers.length > 0
          }
        })
      } else {
        set({
          users: {
            ...get().users,
            suggestions: []
          },
          ui: {
            ...get().ui,
            showUserSuggestions: false
          }
        })
      }
    } catch (error) {
      console.error('搜索用户失败:', error)
      set({
        users: {
          ...get().users,
          suggestions: []
        },
        ui: {
          ...get().ui,
          showUserSuggestions: false
        }
      })
    }
  },

  // 选择用户建议
  selectUserSuggestion: (user) => {
    set({
      users: {
        ...get().users,
        searchQuery: user.name || user.user_id,
        suggestions: []
      },
      ui: {
        ...get().ui,
        showUserSuggestions: false
      }
    })
  },

  // 用户登录/创建
  handleUserLogin: async (username) => {
    if (!username.trim()) {
      get().showLoginStatus('请输入用户名', 'error')
      return false
    }

    set({
      ui: {
        ...get().ui,
        isLoggingIn: true
      }
    })

    get().showLoginStatus('', '')

    try {
      const { config, sessionManager, showLoginStatus } = get()

      // 查找现有用户
      const searchResponse = await fetch(`${config.apiBaseUrl}/memory/users/active`)
      const searchData = await searchResponse.json()

      let existingUser = null
      if (searchData.success && searchData.active_users) {
        existingUser = searchData.active_users.find(user =>
          user.name === username || user.user_id === username
        )
      }

      if (existingUser) {
        // 使用现有用户
        sessionManager.save({
          userId: existingUser.user_id,
          userName: existingUser.name,
          profile: {
            name: existingUser.name,
            age: existingUser.age,
            gender: existingUser.gender,
            style: existingUser.style || '友好',
            interests: existingUser.interests || []
          }
        })

        showLoginStatus(`欢迎回来，${existingUser.name}！`, 'success')
      } else {
        // 创建新用户
        const userId = `user_${username.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}`
        const createResponse = await fetch(`${config.apiBaseUrl}/memory/user/${userId}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: username,
            style: '友好'
          })
        })

        const createData = await createResponse.json()
        if (createData.success) {
          sessionManager.save({
            userId: userId,
            userName: username,
            profile: {
              name: username,
              style: '友好'
            }
          })

          showLoginStatus(`新用户 ${username} 创建成功！`, 'success')
        } else {
          throw new Error(createData.error || '创建用户失败')
        }
      }

      // 登录成功，执行完整的后续操作
      set({
        ui: {
          ...get().ui,
          showLoginDialog: false
        }
      })

      // 执行登录后的完整流程
      setTimeout(() => {
        const { loadSilenceTimeout } = get()
        loadSilenceTimeout()
      }, 100)

      console.log('✅ 登录成功，已隐藏登录界面并执行后续操作')

      return true
    } catch (error) {
      console.error('用户登录失败:', error)
      get().showLoginStatus('登录失败: ' + error.message, 'error')
      return false
    } finally {
      set({
        ui: {
          ...get().ui,
          isLoggingIn: false
        }
      })
    }
  },

  // 注销用户
  logoutUser: () => {
    const { sessionManager, resetRightPanel } = get()

    // 执行完整的清理流程
    resetRightPanel()
    sessionManager.clear()

    set({
      users: {
        suggestions: [],
        recent: [],
        searchQuery: ''
      },
      status: {
        login: { message: '', type: '' },
        sync: { message: '', type: '' }
      },
      ui: {
        ...get().ui,
        showLoginDialog: true
      }
    })

    console.log('✅ 用户注销成功，已执行完整清理流程')
  },

  // 加载最近用户
  loadRecentUsers: async () => {
    try {
      const { config, currentUser } = get()
      const response = await fetch(`${config.apiBaseUrl}/memory/users/active`)
      const data = await response.json()

      if (data.success && data.active_users && data.active_users.length > 0) {
        const otherUsers = data.active_users
          .filter(user => user.user_id !== currentUser.id)
          .sort((a, b) => new Date(b.last_active) - new Date(a.last_active))
          .slice(0, 5)

        set({
          users: {
            ...get().users,
            recent: otherUsers
          }
        })
      } else {
        set({
          users: {
            ...get().users,
            recent: []
          }
        })
      }
    } catch (error) {
      console.error('加载用户列表失败:', error)
      set({
        users: {
          ...get().users,
          recent: []
        }
      })
    }
  },

  // 切换用户
  switchToUser: async (user) => {
    try {
      const {
        sessionManager,
        showSyncStatus,
        resetRightPanel
      } = get()

      // 执行切换前的清理
      resetRightPanel()

      // 保存新用户会话
      sessionManager.save({
        userId: user.user_id,
        userName: user.name,
        profile: {
          name: user.name,
          age: user.age,
          gender: user.gender,
          style: user.style || '友好',
          interests: user.interests || []
        }
      })

      set({
        ui: {
          ...get().ui,
          showSwitchUserDialog: false
        }
      })

      console.log(`✅ 已切换到用户: ${user.name} (${user.user_id})`)
      showSyncStatus(`已切换到 ${user.name}`, 'success')

      return true
    } catch (error) {
      console.error('用户切换失败:', error)
      get().showSyncStatus('切换用户失败: ' + error.message, 'error')
      return false
    }
  },

  // 手动同步
  handleManualSync: async () => {
    try {
      await get().sessionManager.refresh(true)
      console.log('✅ 手动同步完成')
    } catch (error) {
      console.error('❌ 手动同步失败:', error)
    }
  },

  // 智能同步检查
  performSmartSync: async () => {
    const { session, sessionManager } = get()
    if (!session.userId) return

    try {
      if (sessionManager.isExpired()) {
        console.log('🔄 会话过期，执行自动同步...')
        await sessionManager.refresh(false)
      }
    } catch (error) {
      console.warn('⚠️ 自动同步失败，继续使用本地缓存:', error)
    }
  },

  // 初始化用户系统
  initializeUserSystem: () => {
    const { sessionManager } = get()

    console.log('🔄 初始化用户系统...')

    const session = sessionManager.load()
    if (session) {
      console.log('✅ 自动登录成功，用户:', session.userName)

      // 隐藏登录对话框
      set({
        ui: { ...get().ui, showLoginDialog: false }
      })

      // 执行同步检查
      sessionManager.refresh(false)

      return true
    } else {
      console.log('❌ 未找到保存的用户数据，显示登录界面')

      // 显示登录对话框
      set({
        ui: { ...get().ui, showLoginDialog: true }
      })

      return false
    }
  },

  // 打开用户管理页面
  openUserManagement: () => {
    const { config } = get()
    window.open(config.userManagementUrl, '_blank')
  },

  // 显示/隐藏对话框
  showLoginDialog: () => {
    set({
      ui: {
        ...get().ui,
        showLoginDialog: true
      }
    })
  },

  hideLoginDialog: () => {
    set({
      ui: {
        ...get().ui,
        showLoginDialog: false
      }
    })
  },

  showSwitchUserDialog: () => {
    set({
      ui: {
        ...get().ui,
        showSwitchUserDialog: true
      }
    })
  },

  hideSwitchUserDialog: () => {
    set({
      ui: {
        ...get().ui,
        showSwitchUserDialog: false
      }
    })
  },

  // 重置右侧面板（集成点 - 可以被右侧面板系统调用）
  resetRightPanel: () => {
    // 触发自定义事件，让右侧面板系统可以监听
    window.dispatchEvent(new CustomEvent('resetRightPanel'))
    console.log('🔄 右侧面板重置事件已触发')
  },

  // 加载沉默时间设置（集成点）
  loadSilenceTimeout: () => {
    const { currentUser } = get()
    if (currentUser.id) {
      window.dispatchEvent(new CustomEvent('loadSilenceTimeout', {
        detail: { userId: currentUser.id }
      }))
      console.log('⏰ 沉默时间加载事件已触发')
    }
  }
}))

// 使用示例：
// import { useUserAuthStore } from '../stores/userAuthStore'
//
// const {
//   currentUser,
//   session,
//   ui,
//   handleUserLogin,
//   logoutUser,
//   switchToUser,
//   handleManualSync,
//   showSwitchUserDialog,
//   initializeUserSystem
// } = useUserAuthStore()
//
// // 使用方法：
// await handleUserLogin('张三') // 用户登录
// await switchToUser(userObject) // 切换用户
// await handleManualSync() // 手动同步
// logoutUser() // 注销用户
// showSwitchUserDialog() // 显示切换用户对话框
// initializeUserSystem() // 初始化用户系统

// 集成事件监听示例：
// // 在聊天组件中监听用户认证事件
// useEffect(() => {
//   const handleUpdateWelcome = (e) => {
//     console.log('更新欢迎消息:', e.detail.message)
//     // 更新聊天界面的欢迎消息
//   }
//
//   const handleClearChat = () => {
//     console.log('清空聊天记录')
//     // 清空聊天记录的逻辑
//   }
//
//   const handleConnectWS = (e) => {
//     console.log('连接WebSocket:', e.detail)
//     // WebSocket连接逻辑
//   }
//
//
//   return () => {
//   }
// }, [])

export default useUserAuthStore
