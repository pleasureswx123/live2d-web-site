import React from 'react'
import FileUploadButton from './FileUploadButton'
import FilePreview from './FilePreview'
import FileDropZone from './FileDropZone'
import { useFileUploadStore } from '../../stores/fileUploadStore'
import { cn } from '../../lib/utils'

/**
 * 完整的文件上传组件
 * 包含按钮、拖拽区域和预览功能
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.mode - 显示模式 ('button' | 'dropzone' | 'both')
 * @param {string} props.className - 额外的CSS类名
 * @param {string} props.buttonVariant - 按钮样式变体
 * @param {string} props.buttonSize - 按钮大小
 * @param {boolean} props.showPreview - 是否显示预览
 * @param {string} props.previewPosition - 预览位置 ('inline' | 'floating')
 * @param {boolean} props.disabled - 是否禁用
 * @param {string[]} props.acceptedTypes - 接受的文件类型
 * @param {number} props.maxFileSize - 最大文件大小
 * @param {boolean} props.allowMultiple - 是否允许多选
 * @param {Function} props.onFileSelect - 文件选择回调
 * @param {Function} props.onFileRemove - 文件移除回调
 * @param {Function} props.onError - 错误回调
 * @param {Function} props.onUpload - 上传函数
 * @param {boolean} props.autoUpload - 是否自动上传
 * @param {React.ReactNode} props.children - 自定义内容
 */
const FileUploadComplete = ({
  mode = 'button',
  className,
  buttonVariant = 'outline',
  buttonSize = 'default',
  showPreview = true,
  previewPosition = 'inline',
  disabled = false,
  acceptedTypes,
  maxFileSize,
  allowMultiple = false,
  onFileSelect,
  onFileRemove,
  onError,
  onUpload,
  autoUpload = false,
  children,
  ...props
}) => {
  const {
    files,
    ui,
    startUpload,
    updateConfig
  } = useFileUploadStore()

  // 更新配置
  React.useEffect(() => {
    const updates = {}
    if (acceptedTypes) updates.acceptedTypes = acceptedTypes
    if (maxFileSize) updates.maxFileSize = maxFileSize
    if (allowMultiple !== undefined) updates.allowMultiple = allowMultiple
    if (autoUpload !== undefined) updates.autoUpload = autoUpload
    
    if (Object.keys(updates).length > 0) {
      updateConfig(updates)
    }
  }, [acceptedTypes, maxFileSize, allowMultiple, autoUpload, updateConfig])

  // 处理文件选择
  const handleFileSelect = (file) => {
    if (onFileSelect) {
      onFileSelect(file)
    }

    // 如果启用自动上传且提供了上传函数
    if (autoUpload && onUpload) {
      handleUpload()
    }
  }

  // 处理文件移除
  const handleFileRemove = () => {
    if (onFileRemove) {
      onFileRemove()
    }
  }

  // 处理错误
  const handleError = (message, type) => {
    if (onError) {
      onError(message, type)
    }
  }

  // 处理上传
  const handleUpload = async () => {
    if (!onUpload || !files.current) return

    try {
      await startUpload(onUpload)
    } catch (error) {
      console.error('上传失败:', error)
    }
  }

  // 渲染上传界面
  const renderUploadInterface = () => {
    switch (mode) {
      case 'dropzone':
        return (
          <FileDropZone
            disabled={disabled}
            onFileSelect={handleFileSelect}
            onError={handleError}
            className={className}
            {...props}
          />
        )
      
      case 'both':
        return (
          <div className={cn("space-y-4", className)}>
            <FileDropZone
              disabled={disabled}
              onFileSelect={handleFileSelect}
              onError={handleError}
              {...props}
            />
            <div className="flex justify-center">
              <FileUploadButton
                variant={buttonVariant}
                size={buttonSize}
                disabled={disabled}
                onFileSelect={handleFileSelect}
                onError={handleError}
              >
                或点击选择文件
              </FileUploadButton>
            </div>
          </div>
        )
      
      case 'button':
      default:
        return (
          <FileUploadButton
            variant={buttonVariant}
            size={buttonSize}
            className={className}
            disabled={disabled}
            onFileSelect={handleFileSelect}
            onError={handleError}
            {...props}
          />
        )
    }
  }

  return (
    <div className="file-upload-complete">
      {children || (
        <>
          {/* 上传界面 */}
          {renderUploadInterface()}

          {/* 文件预览 */}
          {showPreview && (
            <div className={cn(
              mode === 'button' ? "mt-2" : "mt-4"
            )}>
              <FilePreview
                position={previewPosition}
                onRemove={handleFileRemove}
                showUploadStatus={!!onUpload}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default FileUploadComplete
