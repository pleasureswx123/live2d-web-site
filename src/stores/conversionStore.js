import { create } from 'zustand'

// 档案转换活动store
export const useConversionStore = create((set, get) => ({
  // 转换活动列表，最多保存5条记录
  activities: [],

  // 添加新的转换活动
  addConversionActivity: (conversionSummary) => {
    const newActivity = {
      id: Date.now().toString(),
      type: 'conversion_complete',
      successful_count: conversionSummary.successful_count,
      total_categories: conversionSummary.total_categories,
      successful_updates: conversionSummary.successful_updates || [],
      timestamp: new Date(),
    }

    set((state) => {
      const newActivities = [newActivity, ...state.activities]

      // 限制最多保存5条记录
      if (newActivities.length > 5) {
        newActivities.splice(5)
      }

      console.log('✅ 档案转换活动已添加:', newActivity)
      return { activities: newActivities }
    })
  },

  // 清空所有活动记录
  clearActivities: () => {
    set({ activities: [] })
    console.log('🗑️ 档案转换活动已清空')
  },

  // 获取活动数量
  getActivityCount: () => {
    return get().activities.length
  },
}))

// 示例：如何在其他组件中使用
// import { useConversionStore } from '../stores/conversionStore'
//
// const { addConversionActivity } = useConversionStore()
//
// // 调用示例
// addConversionActivity({
//   successful_count: 3,
//   total_categories: 5,
//   successful_updates: ['基本信息', '兴趣爱好', '工作经历']
// })

export default useConversionStore
