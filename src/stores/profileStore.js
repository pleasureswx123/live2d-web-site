import { create } from 'zustand'

// 用户档案store
export const useProfileStore = create((set, get) => ({
  // 档案完成度（0-1之间的小数）
  completion_rate: 0,
  
  // 关键信息收集状态
  key_info_status: {
    name: false,
    identity: false,
    hobbies: false
  },
  
  // 详细档案信息
  key_info_summary: {
    name: '',
    age: '',
    location: '',
    career: '',
    primary_interests: []
  },

  // 更新用户档案活动信息
  updateProfileActivity: (activityInfo) => {
    try {
      console.log('🔧 updateProfileActivity 被调用，参数:', activityInfo)
      
      set((state) => ({
        completion_rate: activityInfo.completion_rate || state.completion_rate,
        key_info_status: {
          ...state.key_info_status,
          ...(activityInfo.key_info_status || {})
        },
        key_info_summary: {
          ...state.key_info_summary,
          ...(activityInfo.key_info_summary || {})
        }
      }))
      
      console.log('✅ 用户档案活动信息已更新')
    } catch (error) {
      console.error('❌ 更新用户档案活动信息失败:', error)
    }
  },

  // 更新单个信息收集状态
  updateInfoStatus: (infoType, isCollected) => {
    set((state) => ({
      key_info_status: {
        ...state.key_info_status,
        [infoType]: isCollected
      }
    }))
    
    // 重新计算完成度
    const { calculateCompletionRate } = get()
    calculateCompletionRate()
  },

  // 更新详细档案信息
  updateProfileDetails: (profileData) => {
    set((state) => ({
      key_info_summary: {
        ...state.key_info_summary,
        ...profileData
      }
    }))
  },

  // 计算完成度
  calculateCompletionRate: () => {
    const { key_info_status, key_info_summary } = get()
    
    // 基于收集状态和实际数据计算完成度
    const statusCount = Object.values(key_info_status).filter(Boolean).length
    const totalStatus = Object.keys(key_info_status).length
    
    const detailsCount = Object.values(key_info_summary).filter(value => 
      value !== null && value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length
    const totalDetails = Object.keys(key_info_summary).length
    
    // 综合计算完成度
    const completion = (statusCount / totalStatus * 0.6) + (detailsCount / totalDetails * 0.4)
    
    set({ completion_rate: Math.min(completion, 1) })
  },

  // 重置档案信息
  resetProfile: () => {
    set({
      completion_rate: 0,
      key_info_status: {
        name: false,
        identity: false,
        hobbies: false
      },
      key_info_summary: {
        name: '',
        age: '',
        location: '',
        career: '',
        primary_interests: []
      }
    })
    console.log('🗑️ 用户档案已重置')
  },

  // 获取完成度百分比文本
  getCompletionPercentage: () => {
    const { completion_rate } = get()
    return (completion_rate * 100).toFixed(1)
  },

  // 检查是否有任何详细信息
  hasAnyDetails: () => {
    const { key_info_summary } = get()
    return Object.values(key_info_summary).some(value =>
      value !== null && value !== undefined && value !== '' &&
      (Array.isArray(value) ? value.length > 0 : true)
    )
  }
}))

// 示例：如何在其他组件中使用
// import { useProfileStore } from '../stores/profileStore'
//
// const { updateProfileActivity } = useProfileStore()
//
// // 调用示例
// updateProfileActivity({
//   completion_rate: 0.6,
//   key_info_status: {
//     name: true,
//     identity: true,
//     hobbies: false
//   },
//   key_info_summary: {
//     name: '张三',
//     age: '25',
//     location: '北京',
//     career: '软件工程师',
//     primary_interests: ['编程', '音乐', '旅行']
//   }
// })

export default useProfileStore
