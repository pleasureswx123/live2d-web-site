import React, { useMemo } from 'react'

/**
 * 字符计数器组件
 * 显示当前字符数和最大字符数，并根据使用量改变颜色
 */
const CharacterCounter = React.memo(({ 
  currentLength,
  maxLength,
  className = ''
}) => {
  // 使用 useMemo 优化颜色计算
  const colorClass = useMemo(() => {
    if (currentLength > maxLength * 0.9) {
      return 'text-red-500'
    }
    if (currentLength > maxLength * 0.7) {
      return 'text-orange-500'
    }
    return 'text-gray-400'
  }, [currentLength, maxLength])

  // 使用 useMemo 优化容器类名
  const containerClassName = useMemo(() => {
    return `text-xs transition-colors ${colorClass} ${className}`
  }, [colorClass, className])

  return (
    <div className={containerClassName}>
      {currentLength}/{maxLength}
    </div>
  )
})

// 设置显示名称，便于调试
CharacterCounter.displayName = 'CharacterCounter'

export default CharacterCounter
