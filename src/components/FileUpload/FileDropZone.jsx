import React from 'react'
import { useFileUploadStore } from '../../stores/fileUploadStore'
import { cn } from '../../lib/utils'
import { Upload, FileText, Image } from 'lucide-react'

/**
 * 文件拖拽上传区域组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外的CSS类名
 * @param {React.ReactNode} props.children - 子组件
 * @param {boolean} props.disabled - 是否禁用
 * @param {Function} props.onFileSelect - 文件选择回调
 * @param {Function} props.onError - 错误回调
 * @param {string} props.text - 提示文本
 * @param {string} props.subText - 副提示文本
 * @param {boolean} props.showFileTypes - 是否显示支持的文件类型
 */
const FileDropZone = ({
  className,
  children,
  disabled = false,
  onFileSelect,
  onError,
  text = "拖拽文件到此处或点击选择",
  subText = "支持图片、PDF、文档等格式",
  showFileTypes = true,
  ...props
}) => {
  const {
    selectFile,
    updateUIState,
    ui,
    config,
    error
  } = useFileUploadStore()

  const fileInputRef = React.useRef(null)

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

  // 处理拖拽进入
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!disabled) {
      updateUIState({ isDragging: true })
    }
  }

  // 处理拖拽离开
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 只有当离开整个拖拽区域时才设置为false
    if (!e.currentTarget.contains(e.relatedTarget)) {
      updateUIState({ isDragging: false })
    }
  }

  // 处理拖拽悬停
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // 处理文件放置
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    updateUIState({ isDragging: false })
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0] // 目前只支持单文件
      selectFile(file)
    }
  }

  // 处理点击选择文件
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // 处理文件输入变化
  const handleFileChange = (event) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      selectFile(file)
    }
    
    // 清空input值
    event.target.value = ''
  }

  // 获取支持的文件类型显示
  const getFileTypesDisplay = () => {
    const types = config.acceptedTypes.map(type => {
      if (type === 'image/*') return '图片'
      if (type === '.pdf') return 'PDF'
      if (type === '.txt') return '文本'
      if (type === '.doc' || type === '.docx') return 'Word文档'
      return type
    })
    
    return types.join('、')
  }

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
        ui.isDragging 
          ? "border-primary bg-primary/5 scale-105" 
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed",
        error.message && error.type === 'validation' && "border-destructive bg-destructive/5",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      {...props}
    >
      {children || (
        <div className="space-y-4">
          {/* 图标 */}
          <div className="flex justify-center">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
              ui.isDragging ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <Upload className="w-8 h-8" />
            </div>
          </div>

          {/* 主要文本 */}
          <div>
            <p className="text-lg font-medium text-foreground">
              {text}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {subText}
            </p>
          </div>

          {/* 支持的文件类型 */}
          {showFileTypes && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                支持的格式: {getFileTypesDisplay()}
              </p>
              
              {/* 文件类型图标 */}
              <div className="flex justify-center space-x-4">
                {config.acceptedTypes.includes('image/*') && (
                  <div className="flex flex-col items-center space-y-1">
                    <Image className="w-6 h-6 text-blue-500" />
                    <span className="text-xs text-muted-foreground">图片</span>
                  </div>
                )}
                
                {(config.acceptedTypes.includes('.pdf') || 
                  config.acceptedTypes.includes('.txt') || 
                  config.acceptedTypes.includes('.doc') || 
                  config.acceptedTypes.includes('.docx')) && (
                  <div className="flex flex-col items-center space-y-1">
                    <FileText className="w-6 h-6 text-green-500" />
                    <span className="text-xs text-muted-foreground">文档</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 文件大小限制 */}
          <p className="text-xs text-muted-foreground">
            最大文件大小: {formatFileSize(config.maxFileSize)}
          </p>

          {/* 错误信息 */}
          {error.message && (
            <p className="text-sm text-destructive">
              {error.message}
            </p>
          )}
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={config.acceptedTypes.join(',')}
        multiple={config.allowMultiple}
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* 拖拽覆盖层 */}
      {ui.isDragging && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-lg flex items-center justify-center">
          <div className="text-primary font-medium">
            松开鼠标上传文件
          </div>
        </div>
      )}
    </div>
  )
}

// 工具函数：格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default FileDropZone
