import React from 'react'
import { cn } from '../../lib/utils'
import { Download, File, Image, FileText, Video, Music } from 'lucide-react'
import { Button } from '../ui/button'

/**
 * 文件附件组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.attachment - 附件信息
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.showDownload - 是否显示下载按钮
 * @param {string} props.size - 显示大小 ('sm' | 'md' | 'lg')
 * @param {Function} props.onDownload - 下载回调
 * @param {Function} props.onClick - 点击回调
 */
const FileAttachment = ({
  attachment,
  className,
  showDownload = true,
  size = 'md',
  onDownload,
  onClick,
  ...props
}) => {
  // 获取文件类型图标
  const getFileIcon = () => {
    const { type } = attachment
    
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4 text-blue-500" />
    } else if (type.startsWith('video/')) {
      return <Video className="w-4 h-4 text-purple-500" />
    } else if (type.startsWith('audio/')) {
      return <Music className="w-4 h-4 text-green-500" />
    } else if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
      return <FileText className="w-4 h-4 text-red-500" />
    } else {
      return <File className="w-4 h-4 text-gray-500" />
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // 处理下载
  const handleDownload = (e) => {
    e.stopPropagation()
    
    if (onDownload) {
      onDownload(attachment)
    } else {
      // 默认下载行为
      const link = document.createElement('a')
      link.href = attachment.url
      link.download = attachment.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // 处理点击
  const handleClick = () => {
    if (onClick) {
      onClick(attachment)
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

  // 如果是图片，显示图片预览
  if (attachment.type.startsWith('image/')) {
    return (
      <div
        className={cn(
          'relative group cursor-pointer',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className={cn(
            'rounded-lg border object-cover',
            size === 'sm' ? 'max-w-32 max-h-32' :
            size === 'lg' ? 'max-w-80 max-h-80' :
            'max-w-64 max-h-64'
          )}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'block'
          }}
        />
        
        {/* 图片加载失败时的备用显示 */}
        <div
          className="hidden p-4 border rounded-lg bg-muted text-center"
          style={{ display: 'none' }}
        >
          <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">图片加载失败</div>
          <div className="text-xs text-muted-foreground">{attachment.name}</div>
        </div>

        {/* 悬浮操作按钮 */}
        {showDownload && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-none"
              onClick={handleDownload}
              title="下载图片"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* 图片信息 */}
        <div className="mt-1 text-xs text-muted-foreground">
          {attachment.name} ({formatFileSize(attachment.size)})
        </div>
      </div>
    )
  }

  // 其他文件类型显示
  return (
    <div
      className={cn(
        'flex items-center space-x-3 p-3 border rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer',
        getSizeClass(),
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {/* 文件图标 */}
      <div className="flex-shrink-0">
        {getFileIcon()}
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">
          {attachment.name}
        </div>
        <div className="text-muted-foreground">
          {formatFileSize(attachment.size)}
        </div>
      </div>

      {/* 下载按钮 */}
      {showDownload && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleDownload}
          title="下载文件"
        >
          <Download className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}

export default FileAttachment
