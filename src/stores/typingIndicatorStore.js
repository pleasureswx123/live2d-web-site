import { create } from 'zustand'

// 打字指示器状态管理store
export const useTypingIndicatorStore = create((set, get) => ({
  // 显示状态
  ui: {
    isVisible: false,
    autoScroll: true,
    position: 'bottom', // 'bottom', 'inline', 'floating'
    containerRef: null // 滚动容器的ref
  },

  // 正在输入的用户列表
  typingUsers: [],

  // 动画配置
  animation: {
    speed: 'normal', // 'slow', 'normal', 'fast'
    dotCount: 3,
    style: 'dots', // 'dots', 'wave', 'pulse', 'bounce'
    duration: 1500 // 动画周期（毫秒）
  },

  // 自定义配置
  config: {
    showAvatar: true,
    showUserName: true,
    customMessage: '',
    maxUsers: 3, // 最多显示几个用户同时输入
    hideTimeout: 0, // 自动隐藏时间（0为不自动隐藏）
    scrollBehavior: 'smooth' // 'smooth', 'auto'
  },

  // 定时器管理
  timers: new Map(),

  // 显示打字指示器
  showTyping: (user = { id: 'ai', name: 'AI', avatar: 'AI', type: 'bot' }) => {
    const { addTypingUser, updateUIState, scrollToBottom } = get()
    
    // 添加用户到输入列表
    addTypingUser(user)
    
    // 显示指示器
    updateUIState({ isVisible: true })
    
    // 自动滚动
    if (get().ui.autoScroll) {
      setTimeout(scrollToBottom, 100)
    }

    // 设置自动隐藏定时器
    const { hideTimeout } = get().config
    if (hideTimeout > 0) {
      get().setHideTimer(user.id, hideTimeout)
    }

    // 触发显示事件
    const event = new CustomEvent('typingIndicatorShow', {
      detail: { user }
    })
    window.dispatchEvent(event)
  },

  // 隐藏特定用户的打字指示器
  hideTyping: (userId = 'ai') => {
    const { removeTypingUser, updateUIState, clearTimer } = get()
    
    // 移除用户
    removeTypingUser(userId)
    
    // 清除定时器
    clearTimer(userId)
    
    // 如果没有用户在输入，隐藏指示器
    const { typingUsers } = get()
    if (typingUsers.length === 0) {
      updateUIState({ isVisible: false })
    }

    // 触发隐藏事件
    const event = new CustomEvent('typingIndicatorHide', {
      detail: { userId }
    })
    window.dispatchEvent(event)
  },

  // 隐藏所有打字指示器
  hideAllTyping: () => {
    const { clearAllTimers } = get()
    
    // 清除所有定时器
    clearAllTimers()
    
    set({
      typingUsers: [],
      ui: {
        ...get().ui,
        isVisible: false
      }
    })

    // 触发隐藏所有事件
    const event = new CustomEvent('typingIndicatorHideAll')
    window.dispatchEvent(event)
  },

  // 添加正在输入的用户
  addTypingUser: (user) => {
    set((state) => {
      const existingIndex = state.typingUsers.findIndex(u => u.id === user.id)
      
      if (existingIndex >= 0) {
        // 更新现有用户
        const updatedUsers = [...state.typingUsers]
        updatedUsers[existingIndex] = {
          ...updatedUsers[existingIndex],
          ...user,
          startTime: Date.now()
        }
        return { typingUsers: updatedUsers }
      } else {
        // 添加新用户
        const newUser = {
          id: user.id || Date.now().toString(),
          name: user.name || 'Unknown',
          avatar: user.avatar || user.name?.[0] || '?',
          type: user.type || 'user',
          startTime: Date.now(),
          ...user
        }
        
        const newUsers = [...state.typingUsers, newUser]
        
        // 限制最大用户数
        if (newUsers.length > state.config.maxUsers) {
          newUsers.splice(0, newUsers.length - state.config.maxUsers)
        }
        
        return { typingUsers: newUsers }
      }
    })
  },

  // 移除正在输入的用户
  removeTypingUser: (userId) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter(user => user.id !== userId)
    }))
  },

  // 更新UI状态
  updateUIState: (updates) => {
    set((state) => ({
      ui: {
        ...state.ui,
        ...updates
      }
    }))
  },

  // 更新动画配置
  updateAnimation: (updates) => {
    set((state) => ({
      animation: {
        ...state.animation,
        ...updates
      }
    }))
  },

  // 更新配置
  updateConfig: (updates) => {
    set((state) => ({
      config: {
        ...state.config,
        ...updates
      }
    }))
  },

  // 设置滚动容器引用
  setContainerRef: (ref) => {
    set((state) => ({
      ui: {
        ...state.ui,
        containerRef: ref
      }
    }))
  },

  // 滚动到底部
  scrollToBottom: () => {
    const { ui, config } = get()
    const container = ui.containerRef?.current
    
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: config.scrollBehavior
      })
    } else {
      // 尝试查找默认的聊天容器
      const chatContainer = document.querySelector('.chat-messages, .messages-container, [data-chat-container]')
      if (chatContainer) {
        chatContainer.scrollTo({
          top: chatContainer.scrollHeight,
          behavior: config.scrollBehavior
        })
      }
    }
  },

  // 设置自动隐藏定时器
  setHideTimer: (userId, timeout) => {
    const { timers, hideTyping } = get()
    
    // 清除现有定时器
    if (timers.has(userId)) {
      clearTimeout(timers.get(userId))
    }
    
    // 设置新定时器
    const timer = setTimeout(() => {
      hideTyping(userId)
    }, timeout)
    
    timers.set(userId, timer)
  },

  // 清除特定定时器
  clearTimer: (userId) => {
    const { timers } = get()
    
    if (timers.has(userId)) {
      clearTimeout(timers.get(userId))
      timers.delete(userId)
    }
  },

  // 清除所有定时器
  clearAllTimers: () => {
    const { timers } = get()
    
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
  },

  // 切换显示状态
  toggleTyping: (user) => {
    const { ui, showTyping, hideTyping } = get()
    
    if (ui.isVisible) {
      hideTyping(user?.id || 'ai')
    } else {
      showTyping(user)
    }
  },

  // 获取动画样式类名
  getAnimationClass: () => {
    const { animation } = get()
    const baseClass = 'typing-animation'
    const speedClass = `typing-${animation.speed}`
    const styleClass = `typing-${animation.style}`
    
    return `${baseClass} ${speedClass} ${styleClass}`
  },

  // 获取动画持续时间
  getAnimationDuration: () => {
    const { animation } = get()
    
    switch (animation.speed) {
      case 'slow':
        return animation.duration * 1.5
      case 'fast':
        return animation.duration * 0.7
      default:
        return animation.duration
    }
  },

  // 检查用户是否正在输入
  isUserTyping: (userId) => {
    const { typingUsers } = get()
    return typingUsers.some(user => user.id === userId)
  },

  // 获取输入状态文本
  getTypingText: () => {
    const { typingUsers, config } = get()
    
    if (config.customMessage) {
      return config.customMessage
    }
    
    if (typingUsers.length === 0) {
      return ''
    }
    
    if (typingUsers.length === 1) {
      return config.showUserName ? `${typingUsers[0].name} 正在输入...` : '正在输入...'
    }
    
    if (typingUsers.length === 2) {
      return `${typingUsers[0].name} 和 ${typingUsers[1].name} 正在输入...`
    }
    
    return `${typingUsers[0].name} 等 ${typingUsers.length} 人正在输入...`
  },

  // 重置所有状态
  reset: () => {
    const { clearAllTimers } = get()
    
    clearAllTimers()
    
    set({
      ui: {
        isVisible: false,
        autoScroll: true,
        position: 'bottom',
        containerRef: null
      },
      typingUsers: [],
      animation: {
        speed: 'normal',
        dotCount: 3,
        style: 'dots',
        duration: 1500
      },
      config: {
        showAvatar: true,
        showUserName: true,
        customMessage: '',
        maxUsers: 3,
        hideTimeout: 0,
        scrollBehavior: 'smooth'
      },
      timers: new Map()
    })
  }
}))

export default useTypingIndicatorStore
