import React from 'react'
import { cn } from '../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import MessageContent from './MessageContent'
import { Clock, Check, CheckCheck, AlertCircle, MoreHorizontal } from 'lucide-react'
import { Button } from '../ui/button'

/**
 * 单条消息组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.message - 消息对象
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.showAvatar - 是否显示头像
 * @param {boolean} props.showTimestamp - 是否显示时间戳
 * @param {boolean} props.showStatus - 是否显示消息状态
 * @param {boolean} props.showActions - 是否显示操作按钮
 * @param {Function} props.onAvatarClick - 头像点击回调
 * @param {Function} props.onMessageClick - 消息点击回调
 * @param {Function} props.onAttachmentClick - 附件点击回调
 * @param {Function} props.onDelete - 删除消息回调
 * @param {Function} props.onEdit - 编辑消息回调
 * @param {Function} props.onReply - 回复消息回调
 */
const Message = ({
  message,
  className,
  showAvatar = true,
  showTimestamp = true,
  showStatus = true,
  showActions = false,
  onAvatarClick,
  onMessageClick,
  onAttachmentClick,
  onDelete,
  onEdit,
  onReply,
  ...props
}) => {
  const [showActionsMenu, setShowActionsMenu] = React.useState(false)

  // 获取消息类型样式
  const getMessageTypeClass = () => {
    switch (message.type) {
      case 'user':
        return 'message-user'
      case 'bot':
        return 'message-bot'
      case 'system':
        return 'message-system'
      default:
        return ''
    }
  }

  // 获取消息状态图标
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-muted-foreground animate-pulse" />
      case 'sent':
        return <Check className="w-3 h-3 text-muted-foreground" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />
      case 'error':
        return <AlertCircle className="w-3 h-3 text-destructive" />
      default:
        return null
    }
  }

  // 获取消息状态文本
  const getStatusText = () => {
    switch (message.status) {
      case 'sending':
        return '发送中'
      case 'sent':
        return '已发送'
      case 'delivered':
        return '已送达'
      case 'error':
        return '发送失败'
      default:
        return ''
    }
  }

  // 处理头像点击
  const handleAvatarClick = () => {
    if (onAvatarClick) {
      onAvatarClick(message.user)
    }
  }

  // 处理消息点击
  const handleMessageClick = () => {
    if (onMessageClick) {
      onMessageClick(message)
    }
  }

  // 处理删除
  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id)
    }
    setShowActionsMenu(false)
  }

  // 处理编辑
  const handleEdit = () => {
    if (onEdit) {
      onEdit(message)
    }
    setShowActionsMenu(false)
  }

  // 处理回复
  const handleReply = () => {
    if (onReply) {
      onReply(message)
    }
    setShowActionsMenu(false)
  }

  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    const now = new Date()
    const messageTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60))

    if (diffInMinutes < 1) {
      return '刚刚'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}小时前`
    } else {
      return messageTime.toLocaleDateString()
    }
  }

  // 如果是搜索指示器
  if (message.isSearchIndicator) {
    return (
      <div className={cn('message search-indicator', className)} {...props}>
        <div className="message-wrapper flex items-start space-x-3 p-4">
          {showAvatar && (
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                🔍
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="animate-pulse">{message.content}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'message group relative',
        getMessageTypeClass(),
        message.type === 'user' && 'flex justify-end',
        className
      )}
      onClick={handleMessageClick}
      {...props}
    >
      <div
        className={cn(
          'message-wrapper flex items-start space-x-3 max-w-[80%] p-4',
          message.type === 'user' && 'flex-row-reverse space-x-reverse'
        )}
      >
        {/* 头像 */}
        {showAvatar && (
          <Avatar
            className="w-8 h-8 flex-shrink-0 cursor-pointer"
            onClick={handleAvatarClick}
          >
            <AvatarImage src={message.user.avatarUrl} alt={message.user.name} />
            <AvatarFallback className={cn(
              'text-sm font-medium',
              message.type === 'bot' && 'bg-blue-100 text-blue-600',
              message.type === 'user' && 'bg-green-100 text-green-600',
              message.type === 'system' && 'bg-gray-100 text-gray-600'
            )}>
              {message.user.avatar || message.user.name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        )}

        {/* 消息内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 用户名和时间戳 */}
          <div className={cn(
            'flex items-center space-x-2 mb-1',
            message.type === 'user' && 'justify-end'
          )}>
            <span className="text-sm font-medium text-foreground">
              {message.user.name}
            </span>
            
            {showTimestamp && (
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(message.timestamp)}
              </span>
            )}

            {/* 消息类型徽章 */}
            {message.type === 'system' && (
              <Badge variant="secondary" className="text-xs">
                系统
              </Badge>
            )}
          </div>

          {/* 消息内容 */}
          <div
            className={cn(
              'rounded-lg p-3 shadow-sm',
              message.type === 'user' 
                ? 'bg-primary text-primary-foreground ml-auto'
                : 'bg-muted',
              message.type === 'system' && 'bg-yellow-50 border border-yellow-200'
            )}
          >
            <MessageContent
              content={message.content}
              attachments={message.attachments}
              isStreaming={message.isStreaming}
              onAttachmentClick={onAttachmentClick}
            />
          </div>

          {/* 消息状态 */}
          {showStatus && message.status && (
            <div className={cn(
              'flex items-center space-x-1 mt-1 text-xs',
              message.type === 'user' && 'justify-end'
            )}>
              {getStatusIcon()}
              <span className="text-muted-foreground">
                {getStatusText()}
              </span>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        {showActions && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowActionsMenu(!showActionsMenu)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>

              {/* 操作菜单 */}
              {showActionsMenu && (
                <div className="absolute right-0 top-8 bg-background border rounded-md shadow-lg z-10 min-w-24">
                  {onReply && (
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={handleReply}
                    >
                      回复
                    </button>
                  )}
                  {onEdit && message.type === 'user' && (
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={handleEdit}
                    >
                      编辑
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted text-destructive"
                      onClick={handleDelete}
                    >
                      删除
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 点击外部关闭菜单 */}
      {showActionsMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActionsMenu(false)}
        />
      )}
    </div>
  )
}

export default Message
