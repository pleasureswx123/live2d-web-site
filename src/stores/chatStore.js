import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 聊天状态管理
export const useChatStore = create(
  persist(
    (set, get) => ({
      // WebSocket连接状态
      ws: null,
      isConnected: false,
      connectionStatus: 'disconnected', // 'connecting', 'connected', 'disconnected', 'error'
      
      // 用户会话状态
      currentUserId: null,
      currentUserName: null,
      sessionToken: null,
      lastSync: null,
      
      // 聊天消息
      messages: [],
      currentBotMessage: null,
      isTyping: false,
      
      // 文件上传
      currentFile: null,
      
      // 性能监测
      performanceMetrics: {
        messageStartTime: null,
        llmFirstTokenTime: null,
        ttsFirstPacketTime: null,
        endToEndTime: null,
        isLLMFirstToken: false,
        isTTSFirstPacket: false
      },
      
      // Actions
      setWebSocket: (ws) => set({ ws }),
      setConnectionStatus: (status) => set({ connectionStatus: status, isConnected: status === 'connected' }),
      
      setUserSession: (userId, userName, sessionToken = null) => set({
        currentUserId: userId,
        currentUserName: userName,
        sessionToken,
        lastSync: new Date().toISOString()
      }),
      
      clearUserSession: () => set({
        currentUserId: null,
        currentUserName: null,
        sessionToken: null,
        lastSync: null,
        messages: []
      }),
      
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          ...message
        }]
      })),
      
      updateCurrentBotMessage: (content) => set({ currentBotMessage: content }),
      clearCurrentBotMessage: () => set({ currentBotMessage: null }),
      
      setTyping: (isTyping) => set({ isTyping }),
      
      setCurrentFile: (file) => set({ currentFile: file }),
      
      updatePerformanceMetrics: (metrics) => set((state) => ({
        performanceMetrics: { ...state.performanceMetrics, ...metrics }
      })),
      
      resetPerformanceMetrics: () => set({
        performanceMetrics: {
          messageStartTime: null,
          llmFirstTokenTime: null,
          ttsFirstPacketTime: null,
          endToEndTime: null,
          isLLMFirstToken: false,
          isTTSFirstPacket: false
        }
      }),
      
      // 清空聊天记录
      clearMessages: () => set({ messages: [], currentBotMessage: null })
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        currentUserId: state.currentUserId,
        currentUserName: state.currentUserName,
        sessionToken: state.sessionToken,
        lastSync: state.lastSync,
        messages: state.messages.slice(-50) // 只保存最近50条消息
      })
    }
  )
)
