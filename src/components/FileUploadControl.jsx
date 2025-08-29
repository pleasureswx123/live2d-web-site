import React from 'react'
import {Paperclip} from 'lucide-react'
import {FileUploadButton} from './FileUpload'
import { useFileUploadStore } from '../stores/fileUploadStore'

/**
 * 文件上传控制组件
 * 专门用于聊天界面中的文件上传功能，包含悬停提示
 */
const FileUploadControl = ({
  enableFileUpload = false,
  isSending = false,
  isUploading = false,
  className = ""
}) => {
  const {selectFile} = useFileUploadStore()
  if (!enableFileUpload) {
    return null
  }

  const isDisabled = isSending || isUploading

  const handleFileSelect = (file) => {
    console.log('📎 选择文件:', file.name)
    selectFile(file)
  }

  return (
    <div className={`relative group ${className}`}>
      <FileUploadButton
        onFileSelect={handleFileSelect}
        disabled={isDisabled}
      >
        <div className={`p-2 rounded-lg transition-all duration-200 ${
          isDisabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 cursor-pointer'
        }`}>
          <Paperclip className="w-4 h-4" />
        </div>
      </FileUploadButton>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        添加附件
      </div>
    </div>
  )
}

export default FileUploadControl
