import { create } from 'zustand'

// 系统控制store
export const useSystemControlStore = create((set, get) => ({
  // 连接状态
  connectionStatus: false,
  
  // LLM状态
  isWarmedUp: false,
  isWarmingUp: false,
  
  // 功能开关
  isDeepThinking: false,
  isSearchEnabled: false,
  
  // UI状态
  isTogglingThinking: false,
  lastStatusUpdate: null,
  
  // API基础URL
  apiBaseUrl: 'http://localhost:8000',

  // 更新系统状态
  updateSystemStatus: async () => {
    try {
      const { apiBaseUrl } = get()
      const response = await fetch(`${apiBaseUrl}/status`)
      
      if (response.ok) {
        const data = await response.json()
        
        set({
          connectionStatus: true,
          isWarmedUp: data.is_warmed_up || false,
          isDeepThinking: data.deep_reasoning || false,
          lastStatusUpdate: new Date()
        })
        
        console.log('✅ 系统状态更新成功:', data)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('❌ 获取系统状态失败:', error)
      set({
        connectionStatus: false,
        lastStatusUpdate: new Date()
      })
    }
  },

  // 预热LLM
  warmupLLM: async () => {
    const { apiBaseUrl } = get()
    
    set({ isWarmingUp: true })
    
    try {
      const response = await fetch(`${apiBaseUrl}/control/warm_up`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        set({
          isWarmedUp: true,
          isWarmingUp: false
        })
        console.log('✅ LLM预热成功')
        return { success: true }
      } else {
        throw new Error(data.message || 'LLM预热失败')
      }
    } catch (error) {
      console.error('❌ LLM预热失败:', error)
      set({ isWarmingUp: false })
      return { success: false, error: error.message }
    }
  },

  // 切换深度思考
  toggleDeepThinking: async () => {
    const { apiBaseUrl, isDeepThinking } = get()
    
    set({ isTogglingThinking: true })
    
    try {
      const response = await fetch(`${apiBaseUrl}/control/deep_reasoning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `enabled=${!isDeepThinking}`
      })
      
      const data = await response.json()
      
      if (data.success) {
        set({
          isDeepThinking: !isDeepThinking,
          isTogglingThinking: false
        })
        console.log(`✅ 深度思考已${!isDeepThinking ? '开启' : '关闭'}`)
        return { success: true }
      } else {
        throw new Error(data.message || '切换深度思考失败')
      }
    } catch (error) {
      console.error('❌ 切换深度思考失败:', error)
      set({ isTogglingThinking: false })
      return { success: false, error: error.message }
    }
  },

  // 切换联网搜索
  toggleSearch: () => {
    set((state) => ({
      isSearchEnabled: !state.isSearchEnabled
    }))
    
    const { isSearchEnabled } = get()
    console.log(`🔍 联网搜索已${isSearchEnabled ? '开启' : '关闭'}`)
  },

  // 手动设置连接状态
  setConnectionStatus: (connected) => {
    set({ connectionStatus: connected })
  },

  // 重置所有状态
  resetSystemState: () => {
    set({
      connectionStatus: false,
      isWarmedUp: false,
      isWarmingUp: false,
      isDeepThinking: false,
      isSearchEnabled: false,
      isTogglingThinking: false,
      lastStatusUpdate: null
    })
    console.log('🗑️ 系统状态已重置')
  },

  // 获取连接状态文本
  getConnectionStatusText: () => {
    const { connectionStatus } = get()
    return connectionStatus ? '已连接' : '已断开'
  },

  // 获取LLM状态文本
  getLLMStatusText: () => {
    const { isWarmedUp, isWarmingUp } = get()
    if (isWarmingUp) return '预热中...'
    return isWarmedUp ? '已预热' : '未预热'
  },

  // 获取深度思考状态文本
  getThinkingStatusText: () => {
    const { isDeepThinking } = get()
    return `思考模式: ${isDeepThinking ? '开启' : '关闭'}`
  },

  // 获取搜索状态文本
  getSearchStatusText: () => {
    const { isSearchEnabled } = get()
    return `联网搜索: ${isSearchEnabled ? '开启' : '关闭'}`
  },

  // 开始定时更新状态
  startStatusPolling: () => {
    const { updateSystemStatus } = get()
    
    // 立即更新一次
    updateSystemStatus()
    
    // 每5秒更新一次
    const interval = setInterval(updateSystemStatus, 5000)
    
    // 返回清理函数
    return () => clearInterval(interval)
  }
}))

// 示例：如何在其他组件中使用
// import { useSystemControlStore } from '../stores/systemControlStore'
//
// const {
//   connectionStatus,
//   isWarmedUp,
//   isDeepThinking,
//   warmupLLM,
//   toggleDeepThinking,
//   updateSystemStatus
// } = useSystemControlStore()
//
// // 使用示例
// await warmupLLM() // 预热LLM
// await toggleDeepThinking() // 切换深度思考
// await updateSystemStatus() // 更新系统状态

export default useSystemControlStore
