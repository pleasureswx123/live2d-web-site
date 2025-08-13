import React from 'react'
import { useFileUploadStore } from '../../stores/fileUploadStore'
import { cn } from '../../lib/utils'
import { X, File, Image, FileText, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

/**
 * 文件预览组件
 * 显示选中文件的预览信息
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.showRemoveButton - 是否显示移除按钮
 * @param {boolean} props.showUploadStatus - 是否显示上传状态
 * @param {Function} props.onRemove - 移除文件回调
 * @param {Function} props.onDownload - 下载文件回调
 * @param {string} props.position - 显示位置 ('inline' | 'floating')
 */
const FilePreview = ({
  className,
  showRemoveButton = true,
  showUploadStatus = true,
  onRemove,
  onDownload,
  position = 'inline',
  ...props
}) => {
  const {
    files,
    ui,
    removeFile,
    getFileInfo
  } = useFileUploadStore()

  // 如果没有文件或不显示预览，返回null
  if (!files.current || !ui.previewVisible) {
    return null
  }

  const fileInfo = getFileInfo()
  if (!fileInfo) return null

  // 处理移除文件
  const handleRemove = () => {
    removeFile()
    if (onRemove) {
      onRemove()
    }
  }

  // 处理下载文件
  const handleDownload = () => {
    if (files.current?.file) {
      const url = URL.createObjectURL(files.current.file)
      const a = document.createElement('a')
      a.href = url
      a.download = files.current.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      if (onDownload) {
        onDownload(files.current)
      }
    }
  }

  // 获取文件类型图标
  const getFileIcon = () => {
    const { type } = files.current
    
    if (type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />
    } else if (type.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />
    } else if (type.includes('text') || type.includes('doc')) {
      return <FileText className="w-5 h-5 text-green-500" />
    } else {
      return <File className="w-5 h-5 text-gray-500" />
    }
  }

  // 获取上传状态图标和颜色
  const getUploadStatusInfo = () => {
    switch (fileInfo.uploadStatus) {
      case 'uploading':
        return {
          icon: <Upload className="w-4 h-4 animate-pulse" />,
          color: 'bg-blue-500',
          text: '上传中'
        }
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-green-500',
          text: '已完成'
        }
      case 'failed':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'bg-red-500',
          text: '失败'
        }
      default:
        return {
          icon: null,
          color: 'bg-gray-500',
          text: '待上传'
        }
    }
  }

  const uploadStatus = getUploadStatusInfo()

  // 浮动样式
  const floatingStyles = position === 'floating' ? 
    'fixed top-4 right-4 z-50 shadow-lg' : ''

  return (
    <div
      className={cn(
        "flex items-center space-x-3 p-3 bg-background border rounded-lg",
        floatingStyles,
        className
      )}
      {...props}
    >
      {/* 文件预览/图标 */}
      <div className="flex-shrink-0">
        {fileInfo.isImage && fileInfo.preview ? (
          <div className="relative">
            <img
              src={fileInfo.preview}
              alt={fileInfo.name}
              className="w-12 h-12 object-cover rounded border"
            />
            {/* 上传状态覆盖层 */}
            {showUploadStatus && fileInfo.uploadStatus === 'uploading' && (
              <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                <div className="text-white text-xs">
                  {fileInfo.uploadProgress}%
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
            {getFileIcon()}
          </div>
        )}
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-foreground truncate">
            {fileInfo.name}
          </p>
          
          {/* 上传状态徽章 */}
          {showUploadStatus && (
            <Badge
              variant={fileInfo.uploadStatus === 'completed' ? 'default' : 
                      fileInfo.uploadStatus === 'failed' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              <span className="flex items-center space-x-1">
                {uploadStatus.icon}
                <span>{uploadStatus.text}</span>
              </span>
            </Badge>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          {fileInfo.size}
        </p>
        
        {/* 上传进度条 */}
        {showUploadStatus && fileInfo.uploadStatus === 'uploading' && (
          <div className="mt-2">
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${fileInfo.uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* 错误信息 */}
        {fileInfo.uploadStatus === 'failed' && files.current.uploadError && (
          <p className="text-xs text-destructive mt-1">
            {files.current.uploadError}
          </p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center space-x-1">
        {/* 下载按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleDownload}
          title="下载文件"
        >
          <Download className="w-4 h-4" />
        </Button>

        {/* 移除按钮 */}
        {showRemoveButton && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            title="移除文件"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default FilePreview
