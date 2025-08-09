import { useCallback } from 'react'
import { useSystemStore } from '../stores/systemStore'

// 文件上传API Hook (基于test.html分析)
export const useFileAPI = () => {
  const { addError, addNotification } = useSystemStore()

  // API基础URL
  const API_BASE = 'http://localhost:8000'

  // 上传文件
  const uploadFile = useCallback(async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      // 根据文件类型选择端点
      const endpoint = file.type.startsWith('image/') ? '/upload/image' : '/upload/file'
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        const fileUrl = `${API_BASE}${result.file_url}`
        
        addNotification({
          message: `文件上传成功: ${file.name}`,
          type: 'success'
        })
        
        return {
          success: true,
          fileUrl,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        }
      } else {
        throw new Error(result.error || '上传失败')
      }
    } catch (error) {
      console.error('上传文件错误:', error)
      addError({
        message: `文件上传失败: ${file.name}`,
        type: 'upload',
        details: error.message
      })
      
      return {
        success: false,
        error: error.message
      }
    }
  }, [addError, addNotification])

  // 验证文件类型和大小
  const validateFile = useCallback((file, options = {}) => {
    const {
      maxSize = 10 * 1024 * 1024, // 默认10MB
      allowedTypes = ['image/*', 'audio/*', 'video/*', '.pdf', '.doc', '.docx', '.txt']
    } = options

    // 检查文件大小
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      addError({
        message: `文件大小超过限制 (最大${maxSizeMB}MB)`,
        type: 'validation'
      })
      return false
    }

    // 检查文件类型
    const isValidType = allowedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0]
        return file.type.startsWith(baseType)
      } else if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      } else {
        return file.type === type
      }
    })

    if (!isValidType) {
      addError({
        message: `不支持的文件类型: ${file.type}`,
        type: 'validation'
      })
      return false
    }

    return true
  }, [addError])

  // 批量上传文件
  const uploadMultipleFiles = useCallback(async (files, options = {}) => {
    const results = []
    
    for (const file of files) {
      if (validateFile(file, options)) {
        const result = await uploadFile(file)
        results.push(result)
      } else {
        results.push({
          success: false,
          fileName: file.name,
          error: '文件验证失败'
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    
    if (successCount === totalCount) {
      addNotification({
        message: `所有文件上传成功 (${successCount}/${totalCount})`,
        type: 'success'
      })
    } else if (successCount > 0) {
      addNotification({
        message: `部分文件上传成功 (${successCount}/${totalCount})`,
        type: 'warning'
      })
    } else {
      addError({
        message: '所有文件上传失败',
        type: 'upload'
      })
    }
    
    return results
  }, [uploadFile, validateFile, addError, addNotification])

  // 获取文件信息
  const getFileInfo = useCallback((file) => {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      sizeFormatted: formatFileSize(file.size),
      isImage: file.type.startsWith('image/'),
      isAudio: file.type.startsWith('audio/'),
      isVideo: file.type.startsWith('video/'),
      isDocument: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type)
    }
  }, [])

  // 格式化文件大小
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // 创建文件预览URL
  const createPreviewUrl = useCallback((file) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
    }
    return null
  }, [])

  // 清理预览URL
  const revokePreviewUrl = useCallback((url) => {
    if (url) {
      URL.revokeObjectURL(url)
    }
  }, [])

  return {
    uploadFile,
    uploadMultipleFiles,
    validateFile,
    getFileInfo,
    formatFileSize,
    createPreviewUrl,
    revokePreviewUrl
  }
}
