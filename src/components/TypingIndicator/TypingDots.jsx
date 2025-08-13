import React from 'react'
import { useTypingIndicatorStore } from '../../stores/typingIndicatorStore'
import { cn } from '../../lib/utils'

/**
 * 打字动画点组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外的CSS类名
 * @param {number} props.dotCount - 点的数量
 * @param {string} props.style - 动画样式 ('dots' | 'wave' | 'pulse' | 'bounce')
 * @param {string} props.speed - 动画速度 ('slow' | 'normal' | 'fast')
 * @param {string} props.size - 点的大小 ('sm' | 'md' | 'lg')
 * @param {string} props.color - 点的颜色
 */
const TypingDots = ({
  className,
  dotCount,
  style,
  speed,
  size = 'md',
  color = 'current',
  ...props
}) => {
  const {
    animation,
    getAnimationDuration
  } = useTypingIndicatorStore()

  // 使用传入的props或store中的配置
  const finalDotCount = dotCount || animation.dotCount
  const finalStyle = style || animation.style
  const finalSpeed = speed || animation.speed
  const duration = getAnimationDuration()

  // 点的大小样式
  const sizeStyles = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2'
  }

  // 颜色样式
  const colorStyles = {
    current: 'bg-current',
    primary: 'bg-primary',
    muted: 'bg-muted-foreground',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    gray: 'bg-gray-500'
  }

  // 生成动画延迟
  const getAnimationDelay = (index) => {
    const baseDelay = duration / finalDotCount
    return `${index * baseDelay}ms`
  }

  // 生成动画样式
  const getAnimationStyle = (index) => {
    const delay = getAnimationDelay(index)
    
    return {
      animationDelay: delay,
      animationDuration: `${duration}ms`,
      animationIterationCount: 'infinite',
      animationTimingFunction: 'ease-in-out'
    }
  }

  // 渲染不同样式的动画
  const renderDots = () => {
    const dots = Array.from({ length: finalDotCount }, (_, index) => (
      <div
        key={index}
        className={cn(
          'rounded-full',
          sizeStyles[size],
          colorStyles[color] || colorStyles.current,
          // 动画类名
          {
            'animate-typing-dots': finalStyle === 'dots',
            'animate-typing-wave': finalStyle === 'wave',
            'animate-typing-pulse': finalStyle === 'pulse',
            'animate-typing-bounce': finalStyle === 'bounce'
          }
        )}
        style={getAnimationStyle(index)}
      />
    ))

    return dots
  }

  // 容器样式
  const containerClass = cn(
    'flex items-center space-x-1',
    {
      'space-x-0.5': size === 'sm',
      'space-x-1': size === 'md',
      'space-x-1.5': size === 'lg'
    },
    className
  )

  return (
    <div className={containerClass} {...props}>
      {renderDots()}
      
      {/* 添加CSS动画定义 */}
      <style jsx>{`
        @keyframes typing-dots {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes typing-wave {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-4px);
          }
        }
        
        @keyframes typing-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes typing-bounce {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0) scale(0.8);
          }
          30% {
            opacity: 1;
            transform: translateY(-6px) scale(1);
          }
        }
        
        .animate-typing-dots {
          animation: typing-dots ${duration}ms ease-in-out infinite;
        }
        
        .animate-typing-wave {
          animation: typing-wave ${duration}ms ease-in-out infinite;
        }
        
        .animate-typing-pulse {
          animation: typing-pulse ${duration}ms ease-in-out infinite;
        }
        
        .animate-typing-bounce {
          animation: typing-bounce ${duration}ms ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default TypingDots
