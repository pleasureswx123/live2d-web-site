import { create } from 'zustand'

// 文件上传状态管理store
export const useFileUploadStore = create((set, get) => ({
  // 文件状态
  files: {
    current: null,        // 当前选中的文件
    history: [],          // 文件历史记录（最近10个）
    queue: []             // 上传队列（多文件支持）
  },

  // UI状态
  ui: {
    previewVisible: false,
    isDragging: false,
    isUploading: false,
    uploadProgress: 0,
    showHistory: false
  },

  // 配置
  config: {
    acceptedTypes: ['image/*', '.pdf', '.txt', '.doc', '.docx'],
    maxFileSize: 100 * 1024 * 1024, // 10MB
    allowMultiple: false,
    autoUpload: false,
    enableHistory: true
  },

  // 错误状态
  error: {
    message: '',
    type: '',
    timestamp: null
  },

  // 选择文件
  selectFile: (file) => {
    const { validateFile, addToHistory, clearError } = get()

    // 验证文件
    const validation = validateFile(file)
    if (!validation.isValid) {
      set({
        error: {
          message: validation.error,
          type: 'validation',
          timestamp: Date.now()
        }
      })
      return false
    }

    // 清除之前的错误
    clearError()

    // 创建文件对象
    const fileObject = {
      id: Date.now().toString(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      preview: null,
      uploadStatus: 'pending', // pending, uploading, completed, failed
      uploadProgress: 0,
      timestamp: Date.now()
    }

    // 如果是图片，创建预览URL
    if (file.type.startsWith('image/')) {
      fileObject.preview = URL.createObjectURL(file)
    }

    set((state) => ({
      files: {
        ...state.files,
        current: fileObject
      },
      ui: {
        ...state.ui,
        previewVisible: true
      }
    }))

    // 添加到历史记录
    if (get().config.enableHistory) {
      addToHistory(fileObject)
    }

    // 触发文件选择事件
    // const event = new CustomEvent('fileSelected', {
    //   detail: { file: fileObject }
    // })
    // window.dispatchEvent(event)

    return true
  },

  // 移除当前文件
  removeFile: () => {
    const { files } = get()

    // 释放预览URL
    if (files.current?.preview) {
      URL.revokeObjectURL(files.current.preview)
    }

    set((state) => ({
      files: {
        ...state.files,
        current: null
      },
      ui: {
        ...state.ui,
        previewVisible: false,
        uploadProgress: 0
      }
    }))

    // 触发文件移除事件
    const event = new CustomEvent('fileRemoved')
    window.dispatchEvent(event)
  },

  // 清除所有文件
  clearFiles: () => {
    const { files } = get()

    // 释放所有预览URL
    if (files.current?.preview) {
      URL.revokeObjectURL(files.current.preview)
    }

    files.queue.forEach(fileObj => {
      if (fileObj.preview) {
        URL.revokeObjectURL(fileObj.preview)
      }
    })

    set({
      files: {
        current: null,
        history: get().files.history, // 保留历史记录
        queue: []
      },
      ui: {
        ...get().ui,
        previewVisible: false,
        isUploading: false,
        uploadProgress: 0
      }
    })
  },

  // 验证文件
  validateFile: (file) => {
    const { config } = get()

    // 检查文件大小
    if (file.size > config.maxFileSize) {
      return {
        isValid: false,
        error: `文件大小超过限制 (${formatFileSize(config.maxFileSize)})`
      }
    }

    // 检查文件类型
    const isTypeAllowed = config.acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        // 扩展名检查
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      } else if (type.includes('*')) {
        // MIME类型通配符检查
        const baseType = type.split('/')[0]
        return file.type.startsWith(baseType)
      } else {
        // 精确MIME类型检查
        return file.type === type
      }
    })

    if (!isTypeAllowed) {
      return {
        isValid: false,
        error: `不支持的文件类型。支持的类型: ${config.acceptedTypes.join(', ')}`
      }
    }

    return { isValid: true }
  },

  // 添加到历史记录
  addToHistory: (fileObject) => {
    set((state) => {
      const newHistory = [
        { ...fileObject, id: `history_${fileObject.id}` },
        ...state.files.history
      ].slice(0, 10) // 只保留最近10个

      return {
        files: {
          ...state.files,
          history: newHistory
        }
      }
    })
  },

  // 从历史记录选择文件
  selectFromHistory: (historyItem) => {
    // 创建新的文件对象
    const fileObject = {
      ...historyItem,
      id: Date.now().toString(),
      uploadStatus: 'pending',
      uploadProgress: 0,
      timestamp: Date.now()
    }

    set((state) => ({
      files: {
        ...state.files,
        current: fileObject
      },
      ui: {
        ...state.ui,
        previewVisible: true,
        showHistory: false
      }
    }))
  },

  // 更新UI状态
  updateUIState: (updates) => {
    set((state) => ({
      ui: {
        ...state.ui,
        ...updates
      }
    }))
  },

  // 更新配置
  updateConfig: (updates) => {
    set((state) => ({
      config: {
        ...state.config,
        ...updates
      }
    }))
  },

  // 设置错误
  setError: (message, type = 'general') => {
    set({
      error: {
        message,
        type,
        timestamp: Date.now()
      }
    })

    // 触发错误事件
    const event = new CustomEvent('fileUploadError', {
      detail: { message, type }
    })
    window.dispatchEvent(event)
  },

  // 清除错误
  clearError: () => {
    set({
      error: {
        message: '',
        type: '',
        timestamp: null
      }
    })
  },

  // 开始上传
  startUpload: async (uploadFunction) => {
    const { files } = get()

    if (!files.current) {
      get().setError('没有选择文件', 'upload')
      return false
    }

    set((state) => ({
      ui: {
        ...state.ui,
        isUploading: true,
        uploadProgress: 0
      },
      files: {
        ...state.files,
        current: {
          ...state.files.current,
          uploadStatus: 'uploading'
        }
      }
    }))

    try {
      // 调用上传函数
      const result = await uploadFunction(files.current.file, (progress) => {
        // 更新上传进度
        set((state) => ({
          ui: {
            ...state.ui,
            uploadProgress: progress
          },
          files: {
            ...state.files,
            current: {
              ...state.files.current,
              uploadProgress: progress
            }
          }
        }))
      })

      // 上传成功
      set((state) => ({
        ui: {
          ...state.ui,
          isUploading: false,
          uploadProgress: 100
        },
        files: {
          ...state.files,
          current: {
            ...state.files.current,
            uploadStatus: 'completed',
            uploadResult: result
          }
        }
      }))

      // 触发上传成功事件
      // const event = new CustomEvent('fileUploadSuccess', {
      //   detail: { file: files.current, result }
      // })
      // window.dispatchEvent(event)

      return result

    } catch (error) {
      // 上传失败
      set((state) => ({
        ui: {
          ...state.ui,
          isUploading: false,
          uploadProgress: 0
        },
        files: {
          ...state.files,
          current: {
            ...state.files.current,
            uploadStatus: 'failed',
            uploadError: error.message
          }
        }
      }))

      get().setError(`上传失败: ${error.message}`, 'upload')
      return false
    }
  },

  // 处理文件上传到服务器
  uploadFileToServer: async () => {
    const { files, startUpload } = get()

    if (!files.current) {
      get().setError('没有选择文件', 'upload')
      return { success: false, url: null }
    }

    try {
      const uploadFunction = async (file, progressCallback) => {
        const formData = new FormData()
        formData.append('file', file)
        
        const endpoint = file.type.startsWith('image/') ? '/upload/image' : '/upload/file'
        
        const response = await fetch(`http://localhost:8000${endpoint}`, {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        
        if (result.success) {
          return {
            url: `http://localhost:8000${result.file_url}`,
            ...result
          }
        } else {
          throw new Error(result.error || '上传失败')
        }
      }

      const result = await startUpload(uploadFunction)
      
      if (result && result.url) {
        console.log('✅ 文件上传成功:', result.url)
        return { success: true, url: result.url }
      } else {
        throw new Error('上传结果无效')
      }
      
    } catch (error) {
      console.error('❌ 文件上传失败:', error)
      return { success: false, url: null, error: error.message }
    }
  },

  // 获取当前文件信息
  getCurrentFile: () => {
    const { files } = get()
    return files.current
  },

  // 获取文件信息
  getFileInfo: () => {
    const { files } = get()
    if (!files.current) return null

    return {
      name: files.current.name,
      size: formatFileSize(files.current.size),
      type: files.current.type,
      isImage: files.current.type.startsWith('image/'),
      preview: files.current.preview,
      uploadStatus: files.current.uploadStatus,
      uploadProgress: files.current.uploadProgress
    }
  },

  // 重置所有状态
  reset: () => {
    const { clearFiles } = get()
    clearFiles()

    set({
      ui: {
        previewVisible: false,
        isDragging: false,
        isUploading: false,
        uploadProgress: 0,
        showHistory: false
      },
      error: {
        message: '',
        type: '',
        timestamp: null
      }
    })
  }
}))

// 工具函数：格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default useFileUploadStore
