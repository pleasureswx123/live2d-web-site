import React, {useEffect, useCallback} from 'react'
import {useASRStore} from '../stores/asrStore'
import {useFileUploadStore} from '../stores/fileUploadStore'
import {useTTSStore} from '../stores/ttsStore'
import ChatTextarea from './ChatTextarea'
import SendButton from './SendButton'
import ASRControlIndicator from './ASRControlIndicator'
import FileUploadControl from './FileUploadControl'
import RecordingOverlay from './RecordingOverlay'
import ChatStatusBar from './ChatStatusBar'
import FilePreviewContainer from './FilePreviewContainer'
import {useWebSocket} from "@/contexts/WebSocketContext.jsx";

/**
 * 聊天输入区域组件
 * 包含文件预览、输入框、工具栏和状态栏
 */
const ChatInputArea = ({
  // 配置相关
  enableFileUpload = true,
  enableASR = true,
  placeholder = "发送消息给悠悠...",
  maxMessageLength = 1000,
  onSendMessage,
  className = ""
}) => {
  // 从stores获取状态
  const {
    textarea,
    status: recording,
    spaceKey,
    getIsConnected,
  } = useASRStore()
  const { files, ui: fileUI } = useFileUploadStore()

  const { connectionStatus } = useWebSocket()

  // 计算派生状态
  const selectedFile = files.current
  const isUploading = fileUI.isUploading
  const isRecording = recording.isSpaceKeyActive || spaceKey.isPressed
  const isSending = textarea.isSending
  const message = textarea.message

  // 检查是否在输入框中
  const isInInputElement = useCallback(() => {
    const activeElement = document.activeElement
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    )
  }, [])

  // 全局键盘事件监听（长按空格键ASR）
  useEffect(() => {
    if (!enableASR) {
      console.log('🎤 ASR未启用或未连接，跳过键盘事件监听')
      return
    }
    const handleGlobalKeyDown = (event) => {
      // 只处理空格键且非重复事件
      if (event.code === 'Space' && !event.repeat && getIsConnected()) {
        // 检查是否在输入框中
        if (!isInInputElement()) {
          event.preventDefault()
          const {canStartASR, startSpaceKeyPress, startSpaceKeyASR} = useASRStore.getState();
          // 开始长按空格键ASR
          if (canStartASR()) {
            console.log('🎤 开始长按空格键ASR')
            startSpaceKeyPress()
            // 停止所有TTS音频
            useTTSStore.getState().stopAllTTSAudio()
            // 开始长按空格键ASR
            startSpaceKeyASR()
            console.log('正在录音，松开空格键结束')
          }
        }
      }
    }
    const handleGlobalKeyUp = (event) => {
      if (event.code === 'Space') {
        // 检查是否在输入框中
        if (!isInInputElement()) {
          event.preventDefault()
          // 结束长按空格键ASR
          const {endSpaceKeyPress, stopSpaceKeyASR, spaceKey} = useASRStore.getState();
          if (spaceKey.isPressed) {
            console.log('🎤 结束长按空格键ASR')
            const duration = endSpaceKeyPress()
            // 停止长按空格键ASR
            stopSpaceKeyASR()
            console.log(`录音完成 (${(duration / 1000).toFixed(1)}秒)`, 'success')
          }
        }
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    document.addEventListener('keyup', handleGlobalKeyUp)
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
      document.removeEventListener('keyup', handleGlobalKeyUp)
    }
  }, [enableASR, isInInputElement])

  // 监听ASR自动发送事件
  useEffect(() => {
    const handleASRAutoSend = (event) => {
      console.log('🎤 收到ASR自动发送事件:', event.detail)
      setTimeout(() => {
        onSendMessage()
      }, 100)
    }
    window.addEventListener('asrAutoSend', handleASRAutoSend)
    return () => {
      window.removeEventListener('asrAutoSend', handleASRAutoSend)
    }
  }, [onSendMessage])
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
