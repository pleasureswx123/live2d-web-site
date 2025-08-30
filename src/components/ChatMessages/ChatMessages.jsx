import React, { useEffect, useRef } from 'react'
import { useChatMessagesStore } from '@/stores/chatMessagesStore'
import { cn, debounce } from '@/lib/utils'
import Message from './Message'
import SearchIndicator from './SearchIndicator'
import { Button } from '../ui/button'
import { ArrowDown } from 'lucide-react'

/**
 * 聊天消息容器组件
 *
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.showAvatar - 是否显示头像
 * @param {boolean} props.showTimestamp - 是否显示时间戳
 * @param {boolean} props.showStatus - 是否显示消息状态
 * @param {boolean} props.showActions - 是否显示消息操作
 * @param {boolean} props.enableVirtualScroll - 是否启用虚拟滚动
 * @param {Function} props.onMessageClick - 消息点击回调
 * @param {Function} props.onAvatarClick - 头像点击回调
 * @param {Function} props.onAttachmentClick - 附件点击回调
 * @param {Function} props.onMessageDelete - 消息删除回调
 * @param {Function} props.onMessageEdit - 消息编辑回调
 * @param {Function} props.onMessageReply - 消息回复回调
 * @param {React.ReactNode} props.children - 自定义内容
 * @param {React.ReactNode} props.emptyState - 空状态显示
 */
const ChatMessages = ({
  className,
  showAvatar = true,
  showTimestamp = true,
  showStatus = true,
  showActions = false,
  enableVirtualScroll = false,
  onMessageClick,
  onAvatarClick,
  onAttachmentClick,
  onMessageDelete,
  onMessageEdit,
  onMessageReply,
  children,
  emptyState,
  ...props
}) => {
  const containerRef = useRef(null)
  const debouncedCheckScrollRef = useRef(null)
  const autoScrollTimeoutRef = useRef(null)

  const {
    messages,
    ui,
    setContainerRef,
    scrollToBottom,
    checkScrollPosition,
    deleteMessage,
  } = useChatMessagesStore()

  // 设置容器引用
  useEffect(() => {
    setContainerRef(containerRef)
  }, [setContainerRef])

  // 创建防抖的滚动处理函数（只创建一次）
  useEffect(() => {
    debouncedCheckScrollRef.current = debounce(() => {
      checkScrollPosition()
    }, 16) // 约60fps

    return () => {
      if (debouncedCheckScrollRef.current) {
        debouncedCheckScrollRef.current.cancel()
      }
    }
  }, [checkScrollPosition])

  // 监听滚动事件
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      if (debouncedCheckScrollRef.current) {
        debouncedCheckScrollRef.current()
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, []) // 空依赖数组，因为防抖函数通过 ref 访问

  // 监听消息变化，自动滚动
  useEffect(() => {
    if (ui.autoScroll && ui.isScrolledToBottom) {
      // 清理之前的定时器
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current)
      }

      autoScrollTimeoutRef.current = setTimeout(scrollToBottom, 100)
    }

    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current)
      }
    }
  }, [messages.length, ui.autoScroll, ui.isScrolledToBottom, scrollToBottom])

  // 处理消息删除
  const handleMessageDelete = (messageId) => {
    if (onMessageDelete) {
      onMessageDelete(messageId)
    } else {
      deleteMessage(messageId)
    }
  }

  // 处理消息编辑
  const handleMessageEdit = (message) => {
    if (onMessageEdit) {
      onMessageEdit(message)
    }
  }

  // 处理消息回复
  const handleMessageReply = (message) => {
    if (onMessageReply) {
      onMessageReply(message)
    }
  }

  // 处理附件点击
  const handleAttachmentClick = (attachment) => {
    if (onAttachmentClick) {
      onAttachmentClick(attachment)
    } else {
      // 默认行为：图片在新窗口打开，其他文件下载
      if (attachment.type.startsWith('image/')) {
        window.open(attachment.url, '_blank')
      } else {
        const link = document.createElement('a')
        link.href = attachment.url
        link.download = attachment.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  }

  // 渲染空状态
  const renderEmptyState = () => {
    if (emptyState) {
      return emptyState
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          开始对话
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          发送消息开始与AI助手的对话，或者上传文件进行讨论。
        </p>
      </div>
    )
  }

  // 渲染消息列表
  const renderMessages = () => {
    if (enableVirtualScroll && messages.length > 100) {
      return messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          showAvatar={showAvatar}
          showTimestamp={showTimestamp}
          showStatus={showStatus}
          showActions={showActions}
          onMessageClick={onMessageClick}
          onAvatarClick={onAvatarClick}
          onAttachmentClick={handleAttachmentClick}
          onDelete={handleMessageDelete}
          onEdit={handleMessageEdit}
          onReply={handleMessageReply}
        />
      ))
    }

    return messages.map((message) => (
      <Message
        key={message.id}
        message={message}
        showAvatar={showAvatar}
        showTimestamp={showTimestamp}
        showStatus={showStatus}
        showActions={showActions}
        onMessageClick={onMessageClick}
        onAvatarClick={onAvatarClick}
        onAttachmentClick={handleAttachmentClick}
        onDelete={handleMessageDelete}
        onEdit={handleMessageEdit}
        onReply={handleMessageReply}
      />
    ))
  }

  return (
    <div className={cn('chat-messages relative flex flex-col h-full', className)} {...props}>
      {/* 消息容器 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* 消息列表 */}
        {messages.length > 0 ? (
          <div className="space-y-1">
            {renderMessages()}
          </div>
        ) : (
          renderEmptyState()
        )}

        {/* 自定义内容 */}
        {children}
      </div>

      {/* 滚动到底部按钮 */}
      {ui.showScrollButton && (
        <div className="absolute bottom-4 right-4">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full shadow-lg"
            onClick={scrollToBottom}
            title="滚动到底部"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 搜索指示器 */}
      {ui.isSearching && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <SearchIndicator
            query={ui.searchQuery}
            className="bg-background border rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  )
}

export default ChatMessages
