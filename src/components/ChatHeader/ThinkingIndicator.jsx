import React from 'react'
import { useChatHeaderStore } from '../../stores/chatHeaderStore'
import { cn } from '../../lib/utils'
import { Brain, BrainCircuit, Zap } from 'lucide-react'

/**
 * 思考指示器组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.clickable - 是否可点击切换
 * @param {boolean} props.showIcon - 是否显示图标
 * @param {string} props.variant - 样式变体 ('default' | 'compact' | 'minimal')
 * @param {Function} props.onToggle - 切换回调
 */
const ThinkingIndicator = ({
  className,
  clickable = true,
  showIcon = true,
  variant = 'default',
  onToggle,
  ...props
}) => {
  const {
    thinking,
    toggleThinkingMode
  } = useChatHeaderStore()

  // 处理点击切换
  const handleClick = () => {
    if (!clickable) return

    toggleThinkingMode()
    
    if (onToggle) {
      onToggle(!thinking.enabled)
    }
  }

  // 监听思考模式变化事件
  React.useEffect(() => {
    const handleThinkingModeChanged = (event) => {
      console.log('思考模式已变更:', event.detail.enabled)
    }

    window.addEventListener('thinkingModeChanged', handleThinkingModeChanged)

    return () => {
      window.removeEventListener('thinkingModeChanged', handleThinkingModeChanged)
    }
  }, [])

  // 获取图标
  const getIcon = () => {
    if (!showIcon) return null

    if (thinking.isActive) {
      return <BrainCircuit className="w-4 h-4 animate-pulse text-blue-500" />
    }
    
    if (thinking.enabled) {
      return <Brain className="w-4 h-4 text-green-500" />
    }
    
    return <Zap className="w-4 h-4 text-gray-400" />
  }

  // 获取状态文本
  const getStatusText = () => {
    if (thinking.isActive) {
      return '正在思考...'
    }
    
    return thinking.indicator
  }

  // 获取样式类
  const getVariantClass = () => {
    switch (variant) {
      case 'compact':
        return 'px-2 py-1 text-xs'
      case 'minimal':
        return 'p-1 text-xs'
      case 'default':
      default:
        return 'px-3 py-1.5 text-sm'
    }
  }

  // 获取状态样式
  const getStatusClass = () => {
    if (thinking.isActive) {
      return 'bg-blue-50 text-blue-700 border-blue-200'
    }
    
    if (thinking.enabled) {
      return 'bg-green-50 text-green-700 border-green-200'
    }
    
    return 'bg-gray-50 text-gray-600 border-gray-200'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center space-x-2 border rounded-md transition-all duration-200',
        getVariantClass(),
        getStatusClass(),
        clickable && 'cursor-pointer hover:shadow-sm',
        !clickable && 'cursor-default',
        className
      )}
      onClick={handleClick}
      title={clickable ? '点击切换思考模式' : undefined}
      {...props}
    >
      {getIcon()}
      <span className="font-medium">{getStatusText()}</span>
      
      {/* 思考动画指示器 */}
      {thinking.isActive && (
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ThinkingIndicator
