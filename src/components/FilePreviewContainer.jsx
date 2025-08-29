import React from 'react'
import {FilePreview} from './FileUpload'
import { useFileUploadStore } from '../stores/fileUploadStore'

/**
 * 文件预览容器组件
 * 专门用于聊天界面中的文件预览功能
 */
const FilePreviewContainer = ({
  selectedFile,
  className = ""
}) => {
  const {removeFile} = useFileUploadStore()

  if (!selectedFile) {
    return null
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 ${className}`}>
      <FilePreview
        file={selectedFile}
        onRemove={removeFile}
      />
    </div>
  )
}

export default FilePreviewContainer
