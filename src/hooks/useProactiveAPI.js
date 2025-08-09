import { useCallback } from 'react'
import { useSystemStore } from '../stores/systemStore'
import { useChatStore } from '../stores/chatStore'

// 主动对话API Hook (基于test.html分析)
export const useProactiveAPI = () => {
  const { addError, addNotification } = useSystemStore()
  const { currentUserId } = useChatStore()

  // API基础URL (注意：test.html中使用的是相对路径)
  const API_BASE = 'http://localhost:8000'

  // 设置沉默阈值
  const setSilenceTimeout = useCallback(async (userId, timeout) => {
    if (!userId) {
      addError({
        message: '用户ID不能为空',
        type: 'validation'
      })
      return false
    }

    try {
      const response = await fetch(`${API_BASE}/proactive/silence-timeout/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeout })
      })

      if (response.ok) {
        const result = await response.json()
        
        addNotification({
          message: `沉默阈值已设置为 ${timeout} 秒`,
          type: 'success'
        })
        
        return result
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('设置沉默阈值失败:', error)
      addError({
        message: '设置沉默阈值失败',
        type: 'api',
        details: error.message
      })
      return false
    }
  }, [addError, addNotification])

  // 获取沉默阈值
  const getSilenceTimeout = useCallback(async (userId) => {
    if (!userId) {
      addError({
        message: '用户ID不能为空',
        type: 'validation'
      })
      return null
    }

    try {
      const response = await fetch(`${API_BASE}/proactive/silence-timeout/${userId}`)
      
      if (response.ok) {
        const result = await response.json()
        return result.silence_timeout
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('获取沉默阈值失败:', error)
      addError({
        message: '获取沉默阈值失败',
        type: 'api',
        details: error.message
      })
      return null
    }
  }, [addError])

  // 为当前用户设置沉默阈值
  const setCurrentUserSilenceTimeout = useCallback(async (timeout) => {
    if (!currentUserId) {
      addError({
        message: '请先登录',
        type: 'auth'
      })
      return false
    }

    return await setSilenceTimeout(currentUserId, timeout)
  }, [currentUserId, setSilenceTimeout, addError])

  // 获取当前用户的沉默阈值
  const getCurrentUserSilenceTimeout = useCallback(async () => {
    if (!currentUserId) {
      addError({
        message: '请先登录',
        type: 'auth'
      })
      return null
    }

    return await getSilenceTimeout(currentUserId)
  }, [currentUserId, getSilenceTimeout, addError])

  // 验证沉默阈值范围
  const validateSilenceTimeout = useCallback((timeout) => {
    const min = 5 // 最小5秒
    const max = 300 // 最大5分钟

    if (typeof timeout !== 'number' || isNaN(timeout)) {
      addError({
        message: '沉默阈值必须是数字',
        type: 'validation'
      })
      return false
    }

    if (timeout < min || timeout > max) {
      addError({
        message: `沉默阈值必须在 ${min}-${max} 秒之间`,
        type: 'validation'
      })
      return false
    }

    return true
  }, [addError])

  // 设置并验证沉默阈值
  const setValidatedSilenceTimeout = useCallback(async (timeout) => {
    if (!validateSilenceTimeout(timeout)) {
      return false
    }

    return await setCurrentUserSilenceTimeout(timeout)
  }, [validateSilenceTimeout, setCurrentUserSilenceTimeout])

  return {
    setSilenceTimeout,
    getSilenceTimeout,
    setCurrentUserSilenceTimeout,
    getCurrentUserSilenceTimeout,
    validateSilenceTimeout,
    setValidatedSilenceTimeout
  }
}
