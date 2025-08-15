import { create } from 'zustand'

// 主动对话控制store
export const useProactiveChatStore = create((set, get) => ({
  // 沉默触发时间（秒）
  silenceTimeout: 30,

  // API基础URL
  apiBaseUrl: 'http://localhost:8000',

  // 主动对话是否启用
  isProactiveChatEnabled: true,

  // 主动对话统计
  proactiveChatCount: 0,
  proactiveChatHistory: [],

  // 话题和状态
  recentTopics: new Set(),
  pendingProactiveMessage: false,
  userResponseToProactive: false,

  // UI控制
  showDebugInfo: false,
  isApplying: false, // 是否正在应用设置

  // 设置沉默时间
  setSilenceTimeout: (timeout) => {
    set({ silenceTimeout: timeout })
  },

  // 应用沉默时间设置到后端
  applySilenceTimeout: async (currentUserId) => {
    const { silenceTimeout, apiBaseUrl } = get()

    if (!currentUserId) {
      console.log('❌ 无用户ID，无法设置沉默时间')
      return false
    }

    set({ isApplying: true })

    try {
      // 模拟API调用 - 在实际项目中替换为真实的API端点
      const response = await fetch(`${apiBaseUrl}/proactive/silence-timeout/${currentUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeout: silenceTimeout })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ 沉默时间设置成功: ${silenceTimeout}秒`)
        set({ isApplying: false })
        return true
      } else {
        const error = await response.json()
        console.error('❌ 设置沉默时间失败:', error.error)
        set({ isApplying: false })
        return false
      }
    } catch (error) {
      console.error('❌ 设置沉默时间请求失败:', error)
      // 在开发环境中模拟成功
      console.log(`🔧 开发模式: 模拟设置沉默时间成功: ${silenceTimeout}秒`)
      set({ isApplying: false })
      return true
    }
  },

	  // 加载沉默时间（从后端获取），未获取到则保持现有值
	  loadSilenceTimeout: async (currentUserId) => {
	    const { apiBaseUrl } = get()
	    if (!currentUserId) {
	      console.warn('⚠️ 无用户ID，跳过加载沉默时间')
	      return false
	    }
	    try {
	      const resp = await fetch(`${apiBaseUrl}/proactive/silence-timeout/${currentUserId}`)
	      if (resp.ok) {
	        const result = await resp.json()
	        const timeout = result?.silence_timeout ?? result?.timeout ?? result?.silenceTimeout
	        if (typeof timeout === 'number' && timeout > 0) {
	          set({ silenceTimeout: timeout })
	          console.log(`✅ 加载沉默时间设置: ${timeout}秒`)
	          return true
	        } else {
	          console.warn('⚠️ 后端未返回有效的沉默时间，保留本地值')
	          return false
	        }
	      } else {
	        const errorText = await resp.text().catch(() => '')
	        console.error('❌ 加载沉默时间失败:', resp.status, errorText)
	        return false
	      }
	    } catch (error) {
	      console.error('❌ 加载沉默时间请求异常:', error)
	      // 开发环境可选择静默
	      return false
	    }
	  },


  // 切换主动对话状态
  toggleProactiveChat: () => {
    set((state) => ({
      isProactiveChatEnabled: !state.isProactiveChatEnabled
    }))
  },

  // 添加主动对话记录
  addProactiveChatRecord: (message) => {
    set((state) => ({
      proactiveChatCount: state.proactiveChatCount + 1,
      proactiveChatHistory: [
        ...state.proactiveChatHistory,
        {
          id: Date.now(),
          message,
          timestamp: new Date(),
          responded: false
        }
      ].slice(-10) // 只保留最近10条记录
    }))
  },

  // 更新最近话题
  updateRecentTopics: (topics) => {
    set({ recentTopics: new Set(topics) })
  },

  // 添加话题
  addTopic: (topic) => {
    set((state) => {
      const newTopics = new Set(state.recentTopics)
      newTopics.add(topic)
      // 限制话题数量
      if (newTopics.size > 5) {
        const topicsArray = Array.from(newTopics)
        newTopics.clear()
        topicsArray.slice(-5).forEach(t => newTopics.add(t))
      }
      return { recentTopics: newTopics }
    })
  },

  // 设置待回应状态
  setPendingProactiveMessage: (pending) => {
    set({ pendingProactiveMessage: pending })
  },

  // 设置用户回应状态
  setUserResponseToProactive: (responded) => {
    set({ userResponseToProactive: responded })

    // 如果用户已回应，更新历史记录
    if (responded) {
      set((state) => ({
        proactiveChatHistory: state.proactiveChatHistory.map(record =>
          record.responded ? record : { ...record, responded: true }
        )
      }))
    }
  },

  // 切换调试信息显示
  toggleDebugInfo: () => {
    set((state) => ({
      showDebugInfo: !state.showDebugInfo
    }))
  },

  // 重置所有数据
  resetProactiveChatData: () => {
    set({
      silenceTimeout: 30,
      isProactiveChatEnabled: true,
      proactiveChatCount: 0,
      proactiveChatHistory: [],
      recentTopics: new Set(),
      pendingProactiveMessage: false,
      userResponseToProactive: false,
      showDebugInfo: false
    })
    console.log('🗑️ 主动对话数据已重置')
  },

  // 获取状态文本
  getStatusText: () => {
    const { isProactiveChatEnabled, silenceTimeout } = get()
    return isProactiveChatEnabled
      ? `智能对话: 已启用 (${silenceTimeout}秒触发)`
      : '智能对话: 已关闭'
  },

  // 获取最近话题文本
  getRecentTopicsText: () => {
    const { recentTopics } = get()
    const topicsArray = Array.from(recentTopics)
    return topicsArray.length > 0 ? topicsArray.join(', ') : '无'
  },

  // 获取待回应状态文本
  getPendingStatusText: () => {
    const { pendingProactiveMessage, userResponseToProactive } = get()
    if (pendingProactiveMessage && !userResponseToProactive) {
      return '⏳ 等待用户回应...'
    }
    return ''
  }
}))

// 示例：如何在其他组件中使用
// import { useProactiveChatStore } from '../stores/proactiveChatStore'
//
// const {
//   setSilenceTimeout,
//   addTopic,
//   setPendingProactiveMessage,
//   addProactiveChatRecord
// } = useProactiveChatStore()
//
// // 使用示例
// setSilenceTimeout(60) // 设置沉默时间为60秒
// addTopic('天气') // 添加话题
// setPendingProactiveMessage(true) // 设置有待回应消息
// addProactiveChatRecord('今天天气怎么样？') // 添加主动对话记录

export default useProactiveChatStore
