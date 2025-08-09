import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 系统设置状态管理
export const useSystemStore = create(
  persist(
    (set, get) => ({
      // 系统控制设置
      settings: {
        deepThinking: false,
        internetSearch: false,
        modelPreheating: false,
        autoSync: true,
        debugMode: false
      },
      
      // UI状态
      ui: {
        activeDrawer: null, // 'chat', 'profile', 'voice', 'system', 'performance', 'stage'
        isAnyDrawerOpen: false,
        drawerWidth: 400,
        iconPositions: {
          left: ['chat', 'profile', 'voice', 'system'],
          right: ['performance', 'stage', 'memory', 'sync']
        }
      },
      
      // 性能监测显示
      performance: {
        showMetrics: false,
        showDetailedStats: false,
        metricsHistory: []
      },
      
      // 错误处理
      errors: [],
      
      // 通知系统
      notifications: [],
      
      // Actions
      // 系统设置
      updateSetting: (key, value) => set((state) => ({
        settings: { ...state.settings, [key]: value }
      })),
      
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),
      
      // UI控制
      setActiveDrawer: (drawer) => set((state) => ({
        ui: {
          ...state.ui,
          activeDrawer: drawer,
          isAnyDrawerOpen: !!drawer
        }
      })),
      
      closeAllDrawers: () => set((state) => ({
        ui: {
          ...state.ui,
          activeDrawer: null,
          isAnyDrawerOpen: false
        }
      })),
      
      toggleDrawer: (drawer) => set((state) => {
        const isCurrentlyOpen = state.ui.activeDrawer === drawer
        return {
          ui: {
            ...state.ui,
            activeDrawer: isCurrentlyOpen ? null : drawer,
            isAnyDrawerOpen: !isCurrentlyOpen
          }
        }
      }),
      
      setDrawerWidth: (width) => set((state) => ({
        ui: { ...state.ui, drawerWidth: width }
      })),
      
      // 性能监测
      updatePerformanceSettings: (updates) => set((state) => ({
        performance: { ...state.performance, ...updates }
      })),
      
      addMetricsToHistory: (metrics) => set((state) => ({
        performance: {
          ...state.performance,
          metricsHistory: [
            ...state.performance.metricsHistory,
            {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              ...metrics
            }
          ].slice(-100) // 只保留最近100条记录
        }
      })),
      
      clearMetricsHistory: () => set((state) => ({
        performance: { ...state.performance, metricsHistory: [] }
      })),
      
      // 错误处理
      addError: (error) => set((state) => ({
        errors: [
          ...state.errors,
          {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            message: error.message || error,
            type: error.type || 'error',
            stack: error.stack
          }
        ].slice(-20) // 只保留最近20条错误
      })),
      
      removeError: (id) => set((state) => ({
        errors: state.errors.filter(error => error.id !== id)
      })),
      
      clearErrors: () => set({ errors: [] }),
      
      // 通知系统
      addNotification: (notification) => set((state) => ({
        notifications: [
          ...state.notifications,
          {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            type: 'info',
            duration: 3000,
            ...notification
          }
        ]
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(notif => notif.id !== id)
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      // 系统状态检查
      getSystemStatus: () => {
        const state = get()
        return {
          hasErrors: state.errors.length > 0,
          hasNotifications: state.notifications.length > 0,
          isAnyDrawerOpen: state.ui.isAnyDrawerOpen,
          activeFeatures: Object.entries(state.settings)
            .filter(([key, value]) => value)
            .map(([key]) => key)
        }
      },
      
      // 重置系统状态
      resetSystem: () => set({
        errors: [],
        notifications: [],
        ui: {
          activeDrawer: null,
          isAnyDrawerOpen: false,
          drawerWidth: 400,
          iconPositions: {
            left: ['chat', 'profile', 'voice', 'system'],
            right: ['performance', 'stage', 'memory', 'sync']
          }
        }
      })
    }),
    {
      name: 'system-storage',
      partialize: (state) => ({
        settings: state.settings,
        ui: {
          drawerWidth: state.ui.drawerWidth,
          iconPositions: state.ui.iconPositions
        },
        performance: {
          showMetrics: state.performance.showMetrics,
          showDetailedStats: state.performance.showDetailedStats
        }
      })
    }
  )
)
