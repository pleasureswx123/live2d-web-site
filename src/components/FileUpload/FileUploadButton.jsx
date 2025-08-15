import React, { useRef } from 'react'
import { Button } from '../ui/button'
import { useFileUploadStore } from '../../stores/fileUploadStore'
import { cn } from '../../lib/utils'
import { Paperclip, Upload, Loader2 } from 'lucide-react'

/**
 * 文件上传按钮组件
 *
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外的CSS类名
 * @param {string} props.variant - 按钮变体样式
 * @param {string} props.size - 按钮大小
 * @param {boolean} props.disabled - 是否禁用
 * @param {string[]} props.acceptedTypes - 接受的文件类型
 * @param {number} props.maxFileSize - 最大文件大小（字节）
 * @param {boolean} props.allowMultiple - 是否允许多选
 * @param {Function} props.onFileSelect - 文件选择回调
 * @param {Function} props.onError - 错误回调
 * @param {React.ReactNode} props.children - 自定义按钮内容
 * @param {string} props.icon - 图标类型 ('paperclip' | 'upload')
 */
const FileUploadButton = ({
  className,
  variant = "outline",
  size = "default",
  disabled = false,
  acceptedTypes,
  maxFileSize,
  allowMultiple = false,
  onFileSelect,
  onError,
  children,
  icon = 'paperclip',
  ...props
}) => {
  const fileInputRef = useRef(null)

  const {
    selectFile,
    updateConfig,
    ui,
    config,
    error
  } = useFileUploadStore()

  // 更新配置
  React.useEffect(() => {
    const updates = {}
    if (acceptedTypes) updates.acceptedTypes = acceptedTypes
    if (maxFileSize) updates.maxFileSize = maxFileSize
    if (allowMultiple !== undefined) updates.allowMultiple = allowMultiple

    if (Object.keys(updates).length > 0) {
      updateConfig(updates)
    }
  }, [acceptedTypes, maxFileSize, allowMultiple, updateConfig])

  // 监听文件选择事件
  React.useEffect(() => {
    const handleFileSelected = (event) => {
      if (onFileSelect) {
        onFileSelect(event.detail.file)
      }
    }

    const handleFileError = (event) => {
      if (onError) {
        onError(event.detail.message, event.detail.type)
      }
    }

    window.addEventListener('fileSelected', handleFileSelected)
    window.addEventListener('fileUploadError', handleFileError)

    return () => {
      window.removeEventListener('fileSelected', handleFileSelected)
      window.removeEventListener('fileUploadError', handleFileError)
    }
  }, [onFileSelect, onError])

  // 处理文件选择
  const handleFileChange = (event) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0] // 目前只支持单文件
      selectFile(file)
    }

    // 清空input值，允许重复选择同一文件
    event.target.value = ''
  }

  // 点击按钮触发文件选择
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // 获取图标组件
  const getIcon = () => {
    if (ui.isUploading) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }

    switch (icon) {
      case 'upload':
        return <Upload className="w-4 h-4" />
      case 'paperclip':
      default:
        return <Paperclip className="w-4 h-4" />
    }
  }

  // 获取按钮文本
  const getButtonText = () => {
    if (ui.isUploading) {
      return `上传中... ${ui.uploadProgress}%`
    }

    // if (children) {
    //   return children
    // }

    return '附件'
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn(
          "relative transition-all duration-200 p-2",
          ui.isUploading && "cursor-not-allowed",
          error.message && error.type === 'validation' && "border-destructive",
          className
        )}
        onClick={handleClick}
        disabled={disabled || ui.isUploading}
        {...props}
      >
        {getIcon()}
        {/*<span className="ml-2">{getButtonText()}</span>*/}

        {/* 上传进度指示器 */}
        {ui.isUploading && (
          <div className="absolute bottom-0 left-0 h-1 bg-primary rounded-b-md transition-all duration-300"
               style={{ width: `${ui.uploadProgress}%` }} />
        )}
      </Button>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={config.acceptedTypes.join(',')}
        multiple={config.allowMultiple}
        onChange={handleFileChange}
      />
    </>
  )
}

export default FileUploadButton
