import React from 'react'
import ChatTextarea from './ChatTextarea'
import SendButton from './SendButton'
import ASRControlIndicator from './ASRControlIndicator'
import FileUploadControl from './FileUploadControl'
import RecordingOverlay from './RecordingOverlay'
import ChatStatusBar from './ChatStatusBar'
import FilePreviewContainer from './FilePreviewContainer'

/**
 * 聊天输入区域组件
 * 包含文件预览、输入框、工具栏和状态栏
 */
const ChatInputArea = ({
  // 文件相关
  selectedFile,
  enableFileUpload = true,
  isUploading = false,
  
  // ASR相关
  enableASR = true,
  isRecording = false,
  connectionStatus = 'disconnected',
  
  // 输入相关
  placeholder = "发送消息给悠悠...",
  maxMessageLength = 1000,
  isSending = false,
  message = "",
  
  // 回调函数
  onSendMessage,
  className = ""
}) => {
  return (
    <div className={`flex-shrink-0 border-t bg-background ${className}`}>
      <div className="p-4 space-y-3">
        {/* 文件预览容器 */}
        <FilePreviewContainer selectedFile={selectedFile} />

        {/* 输入框区域 */}
        <div className="relative">
          {/* 主输入容器 */}
          <div className={`relative bg-white border rounded-xl shadow-sm transition-all duration-200 ${
            isRecording
              ? 'border-red-300 shadow-red-100'
              : 'border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:shadow-blue-100'
          }`}>

            {/* 录音状态覆盖层 */}
            <RecordingOverlay isRecording={isRecording} />

            {/* 输入框内容区域 */}
            <div className="flex items-end p-3 space-x-2 sm:space-x-3">
              {/* 左侧工具栏 */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* 文件上传控制 */}
                <FileUploadControl
                  enableFileUpload={enableFileUpload}
                  isSending={isSending}
                  isUploading={isUploading}
                />

                {/* ASR控制指示器 */}
                <ASRControlIndicator
                  connectionStatus={connectionStatus}
                  enableASR={enableASR}
                  isRecording={isRecording}
                />
              </div>

              {/* 主输入区域 */}
              <ChatTextarea
                placeholder={placeholder}
                maxMessageLength={maxMessageLength}
                onSendMessage={onSendMessage}
              />

              {/* 发送按钮 */}
              <SendButton
                onClick={onSendMessage}
                disabled={(!message.trim() && !selectedFile) || isSending || connectionStatus !== 'connected'}
                isSending={isSending}
              />
            </div>
          </div>

          {/* 底部状态栏 */}
          <ChatStatusBar
            connectionStatus={connectionStatus}
            enableASR={enableASR}
            isRecording={isRecording}
          />
        </div>
      </div>
    </div>
  )
}

export default ChatInputArea
