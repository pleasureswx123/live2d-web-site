import { useCallback } from 'react'
import { useSystemStore } from '../stores/systemStore'

// 系统控制API Hook (基于test.html分析)
export const useSystemAPI = () => {
  const { updateSetting, addError, addNotification } = useSystemStore()

  // API基础URL
  const API_BASE = 'http://localhost:8000'

  // 获取系统状态
  const getSystemStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/status`)
      const data = await response.json()
      
      return data
    } catch (error) {
      console.error('获取系统状态失败:', error)
      addError({
        message: '获取系统状态失败',
        type: 'api',
        details: error.message
      })
      return null
    }
  }, [addError])

  // 切换深度思考模式
  const toggleDeepThinking = useCallback(async (enabled) => {
    try {
      const response = await fetch(`${API_BASE}/control/deep_reasoning`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded' 
        },
        body: `enabled=${enabled}`
      })
      
      const data = await response.json()
      
      if (data.success) {
        updateSetting('deepThinking', data.enabled)
        addNotification({
          message: `深度思考已${data.enabled ? '启用' : '禁用'}`,
          type: 'success'
        })
        return data.enabled
      } else {
        throw new Error(data.error || '切换深度思考失败')
      }
    } catch (error) {
      console.error('切换深度思考失败:', error)
      addError({
        message: '切换深度思考失败',
        type: 'api',
        details: error.message
      })
      throw error
    }
  }, [updateSetting, addError, addNotification])

  // 预热LLM模型
  const warmupLLM = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/control/warm_up`, { 
        method: 'POST' 
      })
      
      const data = await response.json()
      
      if (data.success) {
        updateSetting('modelPreheating', true)
        addNotification({
          message: '模型预热成功',
          type: 'success'
        })
        return true
      } else {
        throw new Error(data.error || '模型预热失败')
      }
    } catch (error) {
      console.error('模型预热失败:', error)
      addError({
        message: '模型预热失败',
        type: 'api',
        details: error.message
      })
      throw error
    }
  }, [updateSetting, addError, addNotification])

  // 测试TTS功能
  const testTTS = useCallback(async (text = '这是一个TTS测试', voice = 'zh_female_meilinvyou_emo_v2_mars_bigtts') => {
    try {
      const response = await fetch(`${API_BASE}/tts/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice
        })
      })
      
      if (response.ok) {
        addNotification({
          message: 'TTS测试成功',
          type: 'success'
        })
        return true
      } else {
        throw new Error('TTS测试失败')
      }
    } catch (error) {
      console.error('TTS测试失败:', error)
      addError({
        message: 'TTS测试失败',
        type: 'api',
        details: error.message
      })
      return false
    }
  }, [addError, addNotification])

  return {
    getSystemStatus,
    toggleDeepThinking,
    warmupLLM,
    testTTS
  }
}
