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

  // 保留原始 File 对象，避免被代理/序列化破坏
  const originalFileRef = React.useRef(null)

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

  // 监听文件选择事件（确保向外抛出原始 File 对象）
  React.useEffect(() => {
    const handleFileSelected = (event) => {
      // store 中通过 CustomEvent 派发的是 fileObject；其中 fileObject.file 才是原始 File
      const payload = event?.detail?.file
      const rawFile = payload instanceof File ? payload : payload?.file
      if (onFileSelect && rawFile) {
        onFileSelect(rawFile)
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
      // 保存原始 File 引用，供 URL.createObjectURL 与 FormData.append 使用
      originalFileRef.current = file
      // 仅向 store 存入原始 File 以及只读元数据（store 会保留引用，不要对其做 JSON 序列化）
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
