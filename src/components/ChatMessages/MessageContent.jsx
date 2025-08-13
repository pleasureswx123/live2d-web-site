import React from 'react'
import { cn } from '../../lib/utils'
import FileAttachment from './FileAttachment'

/**
 * 消息内容组件
 * 处理消息文本格式化和附件显示
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.content - 消息内容
 * @param {Array} props.attachments - 附件列表
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.isStreaming - 是否正在流式输出
 * @param {Function} props.onAttachmentClick - 附件点击回调
 * @param {Function} props.onAttachmentDownload - 附件下载回调
 */
const MessageContent = ({
  content,
  attachments = [],
  className,
  isStreaming = false,
  onAttachmentClick,
  onAttachmentDownload,
  ...props
}) => {
  // 处理HTML内容的安全渲染
  const createMarkup = () => {
    return { __html: content }
  }

  // 处理附件点击
  const handleAttachmentClick = (attachment) => {
    if (onAttachmentClick) {
      onAttachmentClick(attachment)
    } else {
      // 默认行为：如果是图片，在新窗口打开
      if (attachment.type.startsWith('image/')) {
        window.open(attachment.url, '_blank')
      }
    }
  }

  // 处理附件下载
  const handleAttachmentDownload = (attachment) => {
    if (onAttachmentDownload) {
      onAttachmentDownload(attachment)
    }
  }

  return (
    <div className={cn('message-content space-y-3', className)} {...props}>
      {/* 附件显示 */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <FileAttachment
              key={attachment.id}
              attachment={attachment}
              onClick={handleAttachmentClick}
              onDownload={handleAttachmentDownload}
              size="md"
            />
          ))}
        </div>
      )}

      {/* 文本内容 */}
      {content && (
        <div
          className={cn(
            'prose prose-sm max-w-none',
            'prose-pre:bg-muted prose-pre:border prose-pre:rounded-md prose-pre:p-3',
            'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
            'prose-code:before:content-none prose-code:after:content-none',
            isStreaming && 'animate-pulse'
          )}
          dangerouslySetInnerHTML={createMarkup()}
        />
      )}

      {/* 流式输出指示器 */}
      {isStreaming && (
        <div className="flex items-center space-x-1 text-muted-foreground">
          <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
          <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      )}

      {/* 自定义样式 */}
      <style jsx>{`
        .message-content pre {
          background-color: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
          border-radius: 0.375rem;
          padding: 0.75rem;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }

        .message-content code {
          background-color: hsl(var(--muted));
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
          font-size: 0.875rem;
        }

        .message-content pre code {
          background-color: transparent;
          padding: 0;
          border-radius: 0;
        }

        .message-content p {
          margin: 0.5rem 0;
        }

        .message-content p:first-child {
          margin-top: 0;
        }

        .message-content p:last-child {
          margin-bottom: 0;
        }

        .message-content br {
          line-height: 1.5;
        }

        .message-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
        }

        .message-content blockquote {
          border-left: 4px solid hsl(var(--border));
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }

        .message-content ul, .message-content ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .message-content li {
          margin: 0.25rem 0;
        }

        .message-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }

        .message-content th, .message-content td {
          border: 1px solid hsl(var(--border));
          padding: 0.5rem;
          text-align: left;
        }

        .message-content th {
          background-color: hsl(var(--muted));
          font-weight: 600;
        }

        .message-content a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }

        .message-content a:hover {
          text-decoration: none;
        }
      `}</style>
    </div>
  )
}

export default MessageContent
