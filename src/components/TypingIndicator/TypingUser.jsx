import React from 'react'
import { useTypingIndicatorStore } from '../../stores/typingIndicatorStore'
import { cn } from '../../lib/utils'
import TypingDots from './TypingDots'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

/**
 * 单个用户打字状态组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.user - 用户信息
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.showAvatar - 是否显示头像
 * @param {boolean} props.showName - 是否显示用户名
 * @param {string} props.avatarSize - 头像大小
 * @param {string} props.dotSize - 动画点大小
 * @param {Function} props.onRemove - 移除回调
 */
const TypingUser = ({
  user,
  className,
  showAvatar,
  showName,
  avatarSize = 'sm',
  dotSize = 'md',
  onRemove,
  ...props
}) => {
  const {
    config,
    animation,
    hideTyping
  } = useTypingIndicatorStore()

  // 使用传入的props或store中的配置
  const finalShowAvatar = showAvatar !== undefined ? showAvatar : config.showAvatar
  const finalShowName = showName !== undefined ? showName : config.showUserName

  // 头像大小样式
  const avatarSizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  // 获取用户类型样式
  const getUserTypeClass = () => {
    switch (user.type) {
      case 'bot':
      case 'ai':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'admin':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'user':
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // 处理移除
  const handleRemove = () => {
    if (onRemove) {
      onRemove(user.id)
    } else {
      hideTyping(user.id)
    }
  }

  // 计算输入时长
  const getTypingDuration = () => {
    if (!user.startTime) return ''
    
    const duration = Math.floor((Date.now() - user.startTime) / 1000)
    if (duration < 60) {
      return `${duration}s`
    } else {
      return `${Math.floor(duration / 60)}m`
    }
  }

  return (
    <div
      className={cn(
        'flex items-center space-x-2 p-2 rounded-lg border transition-all duration-200',
        getUserTypeClass(),
        className
      )}
      {...props}
    >
      {/* 用户头像 */}
      {finalShowAvatar && (
        <Avatar className={avatarSizes[avatarSize]}>
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback className="text-xs font-medium">
            {user.avatar || user.name?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      )}

      {/* 用户信息和动画 */}
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        {/* 用户名 */}
        {finalShowName && (
          <span className="text-xs font-medium truncate">
            {user.name}
          </span>
        )}

        {/* 打字动画 */}
        <TypingDots
          size={dotSize}
          style={animation.style}
          speed={animation.speed}
          color="current"
        />

        {/* 输入时长 */}
        {user.startTime && (
          <span className="text-xs opacity-60 ml-auto">
            {getTypingDuration()}
          </span>
        )}
      </div>

      {/* 移除按钮 */}
      <button
        onClick={handleRemove}
        className="text-xs opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-white/50 rounded"
        title="停止输入状态"
      >
        ×
      </button>
    </div>
  )
}

export default TypingUser
