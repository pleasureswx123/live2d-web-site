import { useCallback } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useUserProfileStore } from '../stores/userProfileStore'
import { useSystemStore } from '../stores/systemStore'

// 用户管理API Hook (基于test.html分析)
export const useUserAPI = () => {
  const { setUserSession, clearUserSession } = useChatStore()
  const { updateProfile, resetProfile } = useUserProfileStore()
  const { addError, addNotification } = useSystemStore()

  // API基础URL
  const API_BASE = 'http://localhost:8000'

  // 获取用户会话信息
  const getUserSession = useCallback(async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/user/${userId}/session`)
      const data = await response.json()
      
      if (data.success && data.profile) {
        updateProfile(data.profile)
        return data
      } else {
        throw new Error(data.error || '获取用户会话失败')
      }
    } catch (error) {
      console.error('获取用户会话失败:', error)
      addError({
        message: '获取用户会话失败',
        type: 'api',
        details: error.message
      })
      throw error
    }
  }, [updateProfile, addError])

  // 获取活跃用户列表
  const getActiveUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/memory/users/active`)
      const data = await response.json()
      
      if (data.success && data.active_users) {
        return data.active_users
      } else {
        throw new Error(data.error || '获取用户列表失败')
      }
    } catch (error) {
      console.error('获取活跃用户失败:', error)
      addError({
        message: '获取用户列表失败',
        type: 'api',
        details: error.message
      })
      return []
    }
  }, [addError])

  // 创建用户档案
  const createUserProfile = useCallback(async (username) => {
    try {
      const userId = `user_${username.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}`
      
      const response = await fetch(`${API_BASE}/memory/user/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: username,
          user_id: userId,
          created_at: new Date().toISOString()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // 设置用户会话
        setUserSession(userId, username)
        
        // 更新档案
        updateProfile({
          name: username,
          user_id: userId,
          created_at: new Date().toISOString()
        })
        
        addNotification({
          message: `欢迎，${username}！`,
          type: 'success'
        })
        
        return { userId, username }
      } else {
        throw new Error(data.error || '创建用户失败')
      }
    } catch (error) {
      console.error('创建用户失败:', error)
      addError({
        message: '创建用户失败',
        type: 'api',
        details: error.message
      })
      throw error
    }
  }, [setUserSession, updateProfile, addError, addNotification])

  // 用户登录
  const loginUser = useCallback(async (username) => {
    try {
      // 首先查找现有用户
      const activeUsers = await getActiveUsers()
      const existingUser = activeUsers.find(user => 
        user.name?.toLowerCase() === username.toLowerCase()
      )
      
      if (existingUser) {
        // 登录现有用户
        setUserSession(existingUser.user_id, existingUser.name)
        
        // 获取用户会话信息
        await getUserSession(existingUser.user_id)
        
        addNotification({
          message: `欢迎回来，${existingUser.name}！`,
          type: 'success'
        })
        
        return existingUser
      } else {
        // 创建新用户
        return await createUserProfile(username)
      }
    } catch (error) {
      console.error('用户登录失败:', error)
      addError({
        message: '登录失败',
        type: 'login',
        details: error.message
      })
      throw error
    }
  }, [getActiveUsers, setUserSession, getUserSession, createUserProfile, addError, addNotification])

  // 切换用户
  const switchUser = useCallback(async (targetUser) => {
    try {
      // 设置新用户会话
      setUserSession(targetUser.user_id, targetUser.name)
      
      // 获取用户会话信息
      await getUserSession(targetUser.user_id)
      
      addNotification({
        message: `已切换到用户: ${targetUser.name}`,
        type: 'success'
      })
      
      return targetUser
    } catch (error) {
      console.error('切换用户失败:', error)
      addError({
        message: '切换用户失败',
        type: 'switch',
        details: error.message
      })
      throw error
    }
  }, [setUserSession, getUserSession, addError, addNotification])

  // 注销用户
  const logoutUser = useCallback(() => {
    try {
      clearUserSession()
      resetProfile()
      
      addNotification({
        message: '已注销',
        type: 'info'
      })
    } catch (error) {
      console.error('注销失败:', error)
      addError({
        message: '注销失败',
        type: 'logout',
        details: error.message
      })
    }
  }, [clearUserSession, resetProfile, addError, addNotification])

  // 打开用户管理页面
  const openUserManagement = useCallback(() => {
    window.open('http://localhost:8081/profile_manager.html', '_blank')
  }, [])

  // 获取用户建议
  const getUserSuggestions = useCallback(async (query) => {
    if (!query || query.length < 1) return []
    
    try {
      const activeUsers = await getActiveUsers()
      return activeUsers.filter(user =>
        user.name?.toLowerCase().includes(query.toLowerCase()) ||
        user.user_id?.toLowerCase().includes(query.toLowerCase())
      )
    } catch (error) {
      console.error('获取用户建议失败:', error)
      return []
    }
  }, [getActiveUsers])

  return {
    getUserSession,
    getActiveUsers,
    createUserProfile,
    loginUser,
    switchUser,
    logoutUser,
    openUserManagement,
    getUserSuggestions
  }
}
