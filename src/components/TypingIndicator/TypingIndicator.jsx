import React from 'react'
import { useTypingIndicatorStore } from '../../stores/typingIndicatorStore'
import { cn } from '../../lib/utils'
import TypingDots from './TypingDots'
import TypingUser from './TypingUser'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

/**
 * 打字指示器主组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外的CSS类名
 * @param {string} props.position - 显示位置 ('bottom' | 'inline' | 'floating')
 * @param {boolean} props.showMultipleUsers - 是否显示多用户
 * @param {boolean} props.showAvatar - 是否显示头像
 * @param {boolean} props.showUserName - 是否显示用户名
 * @param {string} props.variant - 样式变体 ('default' | 'compact' | 'minimal')
 * @param {string} props.size - 组件大小 ('sm' | 'md' | 'lg')
 * @param {React.ReactNode} props.children - 自定义内容
 * @param {Function} props.onUserRemove - 用户移除回调
 */
const TypingIndicator = ({
  className,
  position,
  showMultipleUsers = true,
  showAvatar,
  showUserName,
  variant = 'default',
  size = 'md',
  children,
  onUserRemove,
  ...props
}) => {
  const {
    ui,
    typingUsers,
    config,
    animation,
    getTypingText,
    hideTyping
  } = useTypingIndicatorStore()

  // 如果不可见或没有用户在输入，返回null
  if (!ui.isVisible || typingUsers.length === 0) {
    return null
  }

  // 使用传入的props或store中的配置
  const finalPosition = position || ui.position
  const finalShowAvatar = showAvatar !== undefined ? showAvatar : config.showAvatar
  const finalShowUserName = showUserName !== undefined ? showUserName : config.showUserName

  // 处理用户移除
  const handleUserRemove = (userId) => {
    if (onUserRemove) {
      onUserRemove(userId)
    } else {
      hideTyping(userId)
    }
  }

  // 获取位置样式
  const getPositionClass = () => {
    switch (finalPosition) {
      case 'floating':
        return 'fixed bottom-4 left-4 z-50 shadow-lg'
      case 'inline':
        return 'relative'
      case 'bottom':
      default:
        return 'relative'
    }
  }

  // 获取变体样式
  const getVariantClass = () => {
    switch (variant) {
      case 'compact':
        return 'p-2 bg-muted/50 border border-border rounded-md'
      case 'minimal':
        return 'p-1'
      case 'default':
      default:
        return 'p-3 bg-background border border-border rounded-lg shadow-sm'
    }
  }

  // 获取大小样式
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-xs'
      case 'lg':
        return 'text-base'
      case 'md':
      default:
        return 'text-sm'
    }
  }

  // 渲染单用户模式
  const renderSingleUser = () => {
    const user = typingUsers[0]
    
    return (
      <div className="flex items-center space-x-3">
        {/* 头像 */}
        {finalShowAvatar && (
          <Avatar className={cn(
            size === 'sm' ? 'w-6 h-6' : 
            size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'
          )}>
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="text-xs font-medium">
              {user.avatar || user.name?.[0]?.toUpperCase() || 'AI'}
            </AvatarFallback>
          </Avatar>
        )}

        {/* 打字动画和文本 */}
        <div className="flex items-center space-x-2">
          <TypingDots
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
            style={animation.style}
            speed={animation.speed}
            color="muted"
          />
          
          {(finalShowUserName || config.customMessage) && (
            <span className="text-muted-foreground">
              {getTypingText()}
            </span>
          )}
        </div>
      </div>
    )
  }

  // 渲染多用户模式
  const renderMultipleUsers = () => {
    return (
      <div className="space-y-2">
        {/* 标题 */}
        <div className="text-xs text-muted-foreground font-medium">
          {typingUsers.length} 人正在输入
        </div>
        
        {/* 用户列表 */}
        <div className="space-y-1">
          {typingUsers.map(user => (
            <TypingUser
              key={user.id}
              user={user}
              showAvatar={finalShowAvatar}
              showName={finalShowUserName}
              avatarSize={size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'}
              dotSize={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
              onRemove={handleUserRemove}
            />
          ))}
        </div>
      </div>
    )
  }

  // 渲染内容
  const renderContent = () => {
    if (children) {
      return children
    }

    if (showMultipleUsers && typingUsers.length > 1) {
      return renderMultipleUsers()
    }

    return renderSingleUser()
  }

  return (
    <div
      className={cn(
        'typing-indicator transition-all duration-300 ease-in-out',
        getPositionClass(),
        getVariantClass(),
        getSizeClass(),
        className
      )}
      {...props}
    >
      {renderContent()}
    </div>
  )
}

export default TypingIndicator
