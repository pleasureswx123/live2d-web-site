import {create} from 'zustand'
import {useTTSStore} from "@/stores/ttsStore.js";
// 聊天消息状态管理store
export const useChatMessagesStore = create((set, get) => ({
  // 消息数据
  messages: [],
  // 用户信息
  currentUser: {
    name: null,
    avatar: null,
    id: null
  },
  // UI状态
  ui: {
    isScrolledToBottom: true,
    autoScroll: true,
    showTyping: false,
    searchQuery: '',
    isSearching: false,
    containerRef: null
  },
  // 配置
  config: {
    welcomeMessageTemplate: '你好{userName}！我是悠悠，一个18岁的动漫设计专业大一学妹～ 很高兴认识你！我对艺术创作和生活美学都很感兴趣，也喜欢和大家分享小众漫画和设计理念。有什么想聊的吗？',
    defaultWelcomeMessage: '你好！我是悠悠，刚上大一，学动漫设计的。平时喜欢画画，也关注一些有趣的事情。有什么想聊的吗？',
    maxMessages: 50,
    enableFileUpload: true,
    supportedFileTypes: ['image/*', '.pdf', '.txt', '.doc', '.docx'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    characterInfo: {
      name: '悠悠',
      avatar: 'AI',
      description: '动漫设计专业大一学妹'
    }
  },
  // 添加消息
  addMessage: (message) => {
    const newMessage = {
      id: message.id || Date.now().toString(),
      type: message.type || 'user',
      content: message.content || '',
      timestamp: message.timestamp || new Date(),
      user: message.user || get().currentUser,
      attachments: message.attachments || [],
      status: message.status || 'sent',
      ...message
    }
    set((state) => {
      const newMessages = [...state.messages, newMessage]
      // 限制消息数量
      if (newMessages.length > state.config.maxMessages) {
        newMessages.splice(0, newMessages.length - state.config.maxMessages)
      }
      return {messages: newMessages}
    })
    // 自动滚动到底部
    if (get().ui.autoScroll) {
      setTimeout(() => get().scrollToBottom(), 100)
    }
    // 触发消息添加事件
    const event = new CustomEvent('messageAdded', {
      detail: {message: newMessage}
    })
    window.dispatchEvent(event)
    return newMessage.id
  },
  // 添加用户消息
  addUserMessage: (text, file = null) => {
    const {currentUser, formatMessageText} = get()
    const attachments = []
    if (file) {
      attachments.push({
        id: Date.now().toString(),
        type: file.type,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        file: file
      })
    }
    const message = {
      type: 'user',
      content: formatMessageText(text),
      user: {
        name: currentUser.name || '用户',
        avatar: currentUser.avatar || '用户',
        id: currentUser.id || 'user'
      },
      attachments,
      status: 'sent'
    }
    return get().addMessage(message)
  },
  // 添加机器人消息
  addBotMessage: (text) => {
    const {config, formatMessageText} = get()
    const message = {
      type: 'bot',
      content: formatMessageText(text),
      user: {
        name: config.characterInfo.name,
        avatar: config.characterInfo.avatar,
        id: 'bot'
      },
      status: 'sent'
    }
    return get().addMessage(message)
  },
  // 添加系统消息
  addSystemMessage: (text) => {
    const message = {
      type: 'system',
      content: text,
      user: {
        name: 'System',
        avatar: '⚙️',
        id: 'system'
      },
      status: 'sent'
    }
    return get().addMessage(message)
  },
  // 更新消息状态
  updateMessageStatus: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? {...msg, status} : msg
      )
    }))
  },
  // 更新消息内容
  updateMessageContent: (messageId, content) => {
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? {...msg, content: get().formatMessageText(content)} : msg
      )
    }))
  },
  // 删除消息
  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter(msg => msg.id !== messageId)
    }))
    // 触发消息删除事件
    const event = new CustomEvent('messageDeleted', {
      detail: {messageId}
    })
    window.dispatchEvent(event)
  },
  // 清空消息
  clearMessages: () => {
    // 清理附件URL
    const {messages} = get()
    messages.forEach(message => {
      message.attachments?.forEach(attachment => {
        if (attachment.url && attachment.url.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.url)
        }
      })
    })
    set({messages: []})
    // 触发消息清空事件
    const event = new CustomEvent('messagesCleared')
    window.dispatchEvent(event)
  },
  // 更新欢迎消息
  updateWelcomeMessage: () => {
    const {currentUser, config, clearMessages, addBotMessage} = get()
    // 清空现有消息
    clearMessages()
    // 生成欢迎消息
    let welcomeMessage = config.defaultWelcomeMessage
    if (currentUser.name) {
      welcomeMessage = config.welcomeMessageTemplate.replace('{userName}', currentUser.name)
    }
    // 添加欢迎消息
    addBotMessage(welcomeMessage)
  },
  // 设置当前用户
  setCurrentUser: (user) => {
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        ...user
      }
    }))
    // 更新欢迎消息
    get().updateWelcomeMessage()
  },
  // 切换用户
  switchToUser: (user) => {
    const {clearMessages, setCurrentUser} = get()
    // 清空聊天记录
    clearMessages()
    // 设置新用户
    setCurrentUser(user)
  },
  // 用户登出
  logoutUser: () => {
    const {clearMessages} = get()
    // 清空聊天记录
    clearMessages()
    // 重置用户信息
    set({
      currentUser: {
        name: null,
        avatar: null,
        id: null
      }
    })
  },
  // 格式化消息文本
  formatMessageText: (text) => {
    if (!text) return ''
    // 转义HTML
    let formattedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
    // 处理换行
    formattedText = formattedText.replace(/\n/g, '<br>')
    // 处理代码块
    formattedText = formattedText.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // 处理行内代码
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>')
    return formattedText
  },
  // 显示搜索指示器
  showSearchIndicator: (query) => {
    const {config} = get()
    // 移除现有的搜索指示器
    get().hideSearchIndicator()
    const searchMessage = {
      id: 'search-indicator',
      type: 'system',
      content: `正在搜索"${query}"...`,
      user: {
        name: config.characterInfo.name,
        avatar: config.characterInfo.avatar,
        id: 'search'
      },
      isSearchIndicator: true,
      status: 'sent'
    }
    set((state) => ({
      messages: [...state.messages, searchMessage],
      ui: {
        ...state.ui,
        isSearching: true,
        searchQuery: query
      }
    }))
    // 自动滚动
    setTimeout(() => get().scrollToBottom(), 100)
  },
  // 隐藏搜索指示器
  hideSearchIndicator: () => {
    set((state) => ({
      messages: state.messages.filter(msg => !msg.isSearchIndicator),
      ui: {
        ...state.ui,
        isSearching: false,
        searchQuery: ''
      }
    }))
  },
  // 当前流式消息ID（用于WebSocket流式消息）
  currentStreamingMessageId: null,
  // 创建新的机器人消息
  createNewBotMessage: () => {
    const {config} = get()
    const message = {
      type: 'bot',
      content: '',
      user: {
        name: config.characterInfo.name,
        avatar: config.characterInfo.avatar,
        id: 'bot'
      },
      status: 'sending',
      isStreaming: true
    }
    return get().addMessage(message)
  },
  // 创建新的机器人消息框（WebSocket专用）
  createNewBotMessageForWebSocket: () => {
    const {config} = get()
    const message = {
      type: 'bot',
      content: '',
      user: {
        name: config.characterInfo.name,
        avatar: config.characterInfo.avatar,
        id: 'bot'
      },
      status: 'sending',
      isStreaming: true
    }
    const messageId = get().addMessage(message)
    // 设置当前流式消息ID
    set({currentStreamingMessageId: messageId})
    console.log('💬 创建新的机器人消息框，ID:', messageId)
    return messageId
  },
  // 追加到当前机器人消息（WebSocket专用）
  appendToBotMessage: (text) => {
    const {currentStreamingMessageId, messages} = get()
    if (!currentStreamingMessageId) {
      // 如果没有当前消息，创建一个新的
      console.log('💬 没有当前流式消息，创建新的消息框')
      get().createNewBotMessageForWebSocket()
      return get().appendToBotMessage(text)
    }
    // 找到当前流式消息
    const currentMessage = messages.find(msg => msg.id === currentStreamingMessageId)
    if (!currentMessage) {
      console.warn('⚠️ 找不到当前流式消息，创建新的消息框')
      get().createNewBotMessageForWebSocket()
      return get().appendToBotMessage(text)
    }
    // 追加文本到消息内容
    const newContent = currentMessage.content + text
    set((state) => ({
      messages: state.messages.map(msg => msg.id === currentStreamingMessageId ? {...msg, content: newContent} : msg)
    }))
    // 自动滚动到底部
    if (get().ui.autoScroll) {
      setTimeout(() => get().scrollToBottom(), 10)
    }
    console.log('💬 追加文本到机器人消息:', text)
  },
  // 完成当前流式消息
  finishStreamingMessage: () => {
    const {currentStreamingMessageId} = get()
    if (currentStreamingMessageId) {
      set((state) => {
        const currentMessage = state.messages.find(msg => msg.id === currentStreamingMessageId);
        const content = currentMessage.content.trim();
        if (content) {
          // 表情同步 - 从文本内容中匹配表情
          try {
            const matchedExpression = useTTSStore.getState().matchExpression(content)
            if (matchedExpression) {
              // 异步播放表情，不阻塞文本显示
              useTTSStore.getState().playLive2DExpression(matchedExpression).catch(error => {
                console.warn('🎭 表情播放失败:', error)
              })
            }
          } catch (error) {
            console.error('❌ 表情匹配异常:', error)
          }
        }
        const msgInfo = {
          ...currentMessage,
          status: 'sent',
          isStreaming: false
        }
        const messages = state.messages.map(msg =>
          msg.id === currentStreamingMessageId ? msgInfo : msg
        )
        return {
          messages,
          currentStreamingMessageId: null
        };
      })
      console.log('✅ 完成流式消息，ID:', currentStreamingMessageId)
    }
  },
  // 更新当前流式机器人消息的语音播放元信息（TTS容错/可视化）
  updateCurrentStreamingMessageMeta: (updates) => {
    const {currentStreamingMessageId} = get()
    if (!currentStreamingMessageId) return
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === currentStreamingMessageId
          ? {...msg, ttsMeta: {...(msg.ttsMeta || {}), ...(updates || {})}}
          : msg
      )
    }))
  },
  // 递增当前流式机器人消息的已接收音频片段计数
  incrementCurrentStreamingMessageTTSChunks: () => {
    const {currentStreamingMessageId} = get()
    if (!currentStreamingMessageId) return
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === currentStreamingMessageId
          ? {
            ...msg,
            ttsMeta: {
              ...(msg.ttsMeta || {}),
              receivedChunks: ((msg.ttsMeta?.receivedChunks) || 0) + 1
            }
          }
          : msg
      )
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
  // 设置容器引用
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
    const {ui} = get()
    const container = ui.containerRef?.current
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  },
  // 检查是否滚动到底部
  checkScrollPosition: () => {
    const {ui} = get()
    const container = ui.containerRef?.current
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50
      if (ui.isScrolledToBottom !== isAtBottom) {
        set((state) => ({
          ui: {
            ...state.ui,
            isScrolledToBottom: isAtBottom
          }
        }))
      }
    }
  },
  // 搜索消息
  searchMessages: (query) => {
    const {messages} = get()
    if (!query.trim()) {
      return messages
    }
    return messages.filter(message =>
      message.content.toLowerCase().includes(query.toLowerCase()) ||
      message.user.name.toLowerCase().includes(query.toLowerCase())
    )
  },
  // 获取消息统计
  getMessageStats: () => {
    const {messages} = get()
    return {
      total: messages.length,
      user: messages.filter(m => m.type === 'user').length,
      bot: messages.filter(m => m.type === 'bot').length,
      system: messages.filter(m => m.type === 'system').length,
      withAttachments: messages.filter(m => m.attachments?.length > 0).length
    }
  },
  // 导出消息
  exportMessages: (format = 'json') => {
    const {messages} = get()
    switch (format) {
      case 'json':
        return JSON.stringify(messages, null, 2)
      case 'txt':
        return messages.map(msg =>
          `[${msg.timestamp.toLocaleString()}] ${msg.user.name}: ${msg.content}`
        ).join('\n')
      default:
        return messages
    }
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
  // 重置所有状态
  reset: () => {
    const {clearMessages} = get()
    clearMessages()
    set({
      currentUser: {
        name: null,
        avatar: null,
        id: null
      },
      ui: {
        isScrolledToBottom: true,
        autoScroll: true,
        showTyping: false,
        searchQuery: '',
        isSearching: false,
        containerRef: null
      }
    })
  }
}))
export default useChatMessagesStore
