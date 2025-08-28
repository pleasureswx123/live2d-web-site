import React from 'react'

/**
 * 字符计数器组件
 * 显示当前字符数和最大字符数，并根据使用量改变颜色
 */
const CharacterCounter = ({ 
  currentLength,
  maxLength,
  className = ''
}) => {
  const getColorClass = () => {
    if (currentLength > maxLength * 0.9) {
      return 'text-red-500'
    }
    if (currentLength > maxLength * 0.7) {
      return 'text-orange-500'
    }
    return 'text-gray-400'
  }

  return (
    <div className={`text-xs transition-colors ${getColorClass()} ${className}`}>
      {currentLength}/{maxLength}
    </div>
  )
}

export default CharacterCounter
