import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 用户档案状态管理
export const useUserProfileStore = create(
  persist(
    (set, get) => ({
      // 用户档案信息
      profile: {
        name: null,
        identity: null,
        hobby: null,
        completionPercentage: 0,
        lastUpdated: null
      },
      
      // 关键信息状态
      keyInfo: {
        name: { status: 'unknown', value: null },
        identity: { status: 'unknown', value: null },
        hobby: { status: 'unknown', value: null }
      },
      
      // 档案转换活动记录
      conversionActivities: [],
      
      // 对话阶段管理
      conversationStage: {
        current: 1, // 1-6: 初识→了解→新朋友→普通朋友→暧昧→恋爱
        isManual: false,
        conversationCount: 0,
        stageDescriptions: {
          1: '初识阶段 - 刚刚认识，保持礼貌和距离',
          2: '了解阶段 - 开始互相了解基本信息',
          3: '新朋友阶段 - 建立初步友谊',
          4: '普通朋友阶段 - 成为日常聊天的朋友',
          5: '暧昧阶段 - 关系变得微妙和亲密',
          6: '恋爱阶段 - 确立恋爱关系'
        }
      },
      
      // 记忆活动
      memoryActivities: [],
      
      // 主动对话系统
      proactiveChat: {
        isEnabled: true,
        silenceThreshold: 30000, // 30秒
        lastMessageTime: null,
        proactiveHistory: [],
        topicKeywords: []
      },
      
      // Actions
      // 档案信息更新
      updateProfile: (updates) => set((state) => {
        const newProfile = { ...state.profile, ...updates, lastUpdated: new Date().toISOString() }
        
        // 计算完成度
        const fields = ['name', 'identity', 'hobby']
        const completedFields = fields.filter(field => newProfile[field])
        const completionPercentage = Math.round((completedFields.length / fields.length) * 100)
        
        return {
          profile: { ...newProfile, completionPercentage }
        }
      }),
      
      // 关键信息状态更新
      updateKeyInfo: (key, status, value = null) => set((state) => ({
        keyInfo: {
          ...state.keyInfo,
          [key]: { status, value }
        }
      })),
      
      // 批量更新关键信息
      updateKeyInfoBatch: (updates) => set((state) => ({
        keyInfo: { ...state.keyInfo, ...updates }
      })),
      
      // 添加档案转换活动
      addConversionActivity: (activity) => set((state) => ({
        conversionActivities: [
          ...state.conversionActivities,
          {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...activity
          }
        ].slice(-20) // 只保留最近20条记录
      })),
      
      // 对话阶段管理
      setConversationStage: (stage, isManual = false) => set((state) => ({
        conversationStage: {
          ...state.conversationStage,
          current: stage,
          isManual
        }
      })),
      
      incrementConversationCount: () => set((state) => ({
        conversationStage: {
          ...state.conversationStage,
          conversationCount: state.conversationStage.conversationCount + 1
        }
      })),
      
      setManualStageControl: (isManual) => set((state) => ({
        conversationStage: {
          ...state.conversationStage,
          isManual
        }
      })),
      
      // 记忆活动管理
      addMemoryActivity: (activity) => set((state) => ({
        memoryActivities: [
          ...state.memoryActivities,
          {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...activity
          }
        ].slice(-50) // 只保留最近50条记录
      })),
      
      // 主动对话管理
      updateProactiveChat: (updates) => set((state) => ({
        proactiveChat: { ...state.proactiveChat, ...updates }
      })),
      
      addProactiveHistory: (message) => set((state) => ({
        proactiveChat: {
          ...state.proactiveChat,
          proactiveHistory: [
            ...state.proactiveChat.proactiveHistory,
            {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              message
            }
          ].slice(-10) // 只保留最近10条记录
        }
      })),
      
      updateLastMessageTime: () => set((state) => ({
        proactiveChat: {
          ...state.proactiveChat,
          lastMessageTime: Date.now()
        }
      })),
      
      // 重置档案
      resetProfile: () => set({
        profile: {
          name: null,
          identity: null,
          hobby: null,
          completionPercentage: 0,
          lastUpdated: null
        },
        keyInfo: {
          name: { status: 'unknown', value: null },
          identity: { status: 'unknown', value: null },
          hobby: { status: 'unknown', value: null }
        },
        conversionActivities: [],
        memoryActivities: []
      }),
      
      // 获取当前阶段描述
      getCurrentStageDescription: () => {
        const state = get()
        return state.conversationStage.stageDescriptions[state.conversationStage.current]
      }
    }),
    {
      name: 'user-profile-storage',
      partialize: (state) => ({
        profile: state.profile,
        keyInfo: state.keyInfo,
        conversationStage: state.conversationStage,
        proactiveChat: {
          isEnabled: state.proactiveChat.isEnabled,
          silenceThreshold: state.proactiveChat.silenceThreshold
        }
      })
    }
  )
)
