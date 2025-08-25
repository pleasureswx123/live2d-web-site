import { useMemo } from 'react'

// 时间格式化配置
const TIME_FORMAT_CONFIG = {
  zh: {
    justNow: '刚刚',
    minutesAgo: '分钟前',
    hoursAgo: '小时前',
    daysAgo: '天前',
    never: '从未同步',
    dateFormat: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  },
  en: {
    justNow: 'Just now',
    minutesAgo: 'minutes ago',
    hoursAgo: 'hours ago',
    daysAgo: 'days ago',
    never: 'Never synced',
    dateFormat: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  }
}

/**
 * 通用的时间格式化Hook
 * @param {number|string} timestamp - 时间戳
 * @param {string} locale - 语言环境 ('zh' | 'en')
 * @param {object} options - 格式化选项
 * @returns {string} 格式化后的时间字符串
 */
export const useTimeFormat = (timestamp, locale = 'zh', options = {}) => {
  const config = TIME_FORMAT_CONFIG[locale] || TIME_FORMAT_CONFIG.zh
  
  return useMemo(() => {
    if (!timestamp) return config.never
    
    const now = new Date()
    const targetTime = new Date(timestamp)
    const diffMs = now - targetTime
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // 自定义阈值
    const { 
      showJustNow = true,
      showMinutes = true,
      showHours = true,
      showDays = true,
      maxDays = 7,
      dateFormat = config.dateFormat
    } = options

    if (showJustNow && diffMinutes < 1) return config.justNow
    if (showMinutes && diffMinutes < 60) return `${diffMinutes}${config.minutesAgo}`
    if (showHours && diffHours < 24) return `${diffHours}${config.hoursAgo}`
    if (showDays && diffDays < maxDays) return `${diffDays}${config.daysAgo}`
    
    // 超过阈值显示具体日期
    return targetTime.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', dateFormat)
  }, [timestamp, locale, options])
}

/**
 * 相对时间格式化Hook（专门用于显示"多久之前"）
 */
export const useRelativeTime = (timestamp, locale = 'zh') => {
  return useTimeFormat(timestamp, locale, {
    showJustNow: true,
    showMinutes: true,
    showHours: true,
    showDays: true,
    maxDays: 7
  })
}

/**
 * 绝对时间格式化Hook（显示具体日期时间）
 */
export const useAbsoluteTime = (timestamp, locale = 'zh') => {
  return useTimeFormat(timestamp, locale, {
    showJustNow: false,
    showMinutes: false,
    showHours: false,
    showDays: false
  })
}

/**
 * 智能时间格式化Hook（根据时间差自动选择显示方式）
 */
export const useSmartTime = (timestamp, locale = 'zh') => {
  return useTimeFormat(timestamp, locale, {
    showJustNow: true,
    showMinutes: true,
    showHours: true,
    showDays: true,
    maxDays: 30 // 30天内显示相对时间，超过显示绝对时间
  })
}

/**
 * 最后活跃时间格式化Hook（专门用于显示用户最后活跃时间）
 */
export const useLastActiveTime = (timestamp, locale = 'zh') => {
  const config = TIME_FORMAT_CONFIG[locale] || TIME_FORMAT_CONFIG.zh
  
  return useMemo(() => {
    if (!timestamp) return config.never
    
    const now = new Date()
    const lastActiveTime = new Date(timestamp)
    const diffMs = now - lastActiveTime
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) {
      return '刚刚活跃'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`
    } else {
      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) {
        return `${diffHours}小时前`
      } else {
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays}天前`
      }
    }
  }, [timestamp, locale])
}
