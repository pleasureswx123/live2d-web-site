import React, { useEffect, useCallback } from 'react'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useChatMessagesStore } from '../stores/chatMessagesStore'

import { useFileUploadStore } from '../stores/fileUploadStore'
import { useASRStore } from '../stores/asrStore'
import { useTTSStore } from '../stores/ttsStore'
import { useSystemControlStore } from '../stores/systemControlStore'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { FileUploadButton, FilePreview } from './FileUpload'

import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Paperclip, Mic } from 'lucide-react'
import ChatStatusBar from './ChatStatusBar'
import SendButton from './SendButton'

/**
 * 完全可用的主聊天界面组件
 * 确保所有功能都能正常工作
 */
const WorkingChatInterface = ({
  className = '',
  enableFileUpload = true,
  enableASR = true,
  maxMessageLength = 1000,
  placeholder = "发送消息给悠悠...",
  ...props
}) => {

  // WebSocket和Stores
  const { sendMessage, connectionStatus } = useWebSocket()
  const {messages, addUserMessage, scrollToBottom, showSearchIndicator} = useChatMessagesStore()
  const {files, ui: fileUI, selectFile, removeFile, startUpload, getCurrentFile} = useFileUploadStore()
  const {
    status: recording,
    recognition,
    connection: asrConnection,
    textarea,
    spaceKey,
    startSpaceKeyASR,
    stopSpaceKeyASR,
    setIsComposing,
    setIsSending,
    clearMessage,
    getCurrentMessage,
    setTextareaRef,
    autoResizeTextarea,
    handleInputChange,
    startSpaceKeyPress,
    endSpaceKeyPress,
    canStartASR,
    getIsConnected
  } = useASRStore()

  // 稳定的ref回调函数
  const textareaRefCallback = useCallback((ref) => {
    setTextareaRef(ref)
  }, [setTextareaRef])

  // 获取当前选中的文件
  const selectedFile = files.current
  const isUploading = fileUI.isUploading

  // 搜索关键词配置
  const searchKeywords = ['搜索', '查找', '查询', '最新', '现在', '今天', '新闻', '什么是', '怎么样', '如何']
  const timeKeywords = ['现在', '今天', '几号', '时间', '日期']
  const newsKeywords = ['新闻', '最新', '热点', '时事']

  // 检测是否需要搜索
  const shouldTriggerSearch = (text) => {
    if (!useSystemControlStore.getState().isSearchEnabled || !text) return false

    const hasSearchKeyword = searchKeywords.some(keyword => text.includes(keyword))
    const isTimeQuery = timeKeywords.some(keyword => text.includes(keyword))
    const isNewsQuery = newsKeywords.some(keyword => text.includes(keyword))

    return hasSearchKeyword || isTimeQuery || isNewsQuery
  }

  // 停止所有TTS音频
  const stopAllTTSAudio = () => {
    console.log('🛑 打断所有TTS播放')
    useTTSStore.getState().stopAllAudio()
    useTTSStore.getState().clearAudioQueue()
  }

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !textarea.isComposing) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 处理文件选择
  const handleFileSelect = (file) => {
    console.log('📎 选择文件:', file.name)
    selectFile(file)
  }

  // 处理文件上传
  const handleFileUpload = async () => {
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

      const { url, success } = await startUpload(uploadFunction)
      if (success && !!url) {
        console.log('✅ 文件上传成功:', url)
        return url
      }
    } catch (error) {
      console.error('❌ 文件上传失败:', error)
      throw error
    }
  }

  // 发送消息
  const handleSendMessage = useCallback(async () => {
    // 使用 store 获取最新的 message 值，避免闭包陷阱
    const trimmedMessage = getCurrentMessage().trim()

    const currentFile = getCurrentFile()

    // 验证消息内容
    if (!trimmedMessage && !currentFile) {
      return
    }

    // 检查连接状态
    if (!getIsConnected()) {
      console.error('聊天错误:', '连接已断开，请等待重连...')
      return
    }

    setIsSending(true)

    try {
      // 打断当前TTS播放
      stopAllTTSAudio()

      // 准备消息数据
      const messageData = {
        type: 'chat',
        content: trimmedMessage || ''
      }

      // 检测搜索需求
      if (shouldTriggerSearch(trimmedMessage)) {
        messageData.search_query = trimmedMessage
        showSearchIndicator(trimmedMessage)
      }

      // 处理文件上传
      if (currentFile) {
        console.log('📎 处理文件上传:', currentFile.file.name)
        try {
          const fileUrl = await handleFileUpload()
          if (fileUrl) {
            messageData.image_url = fileUrl
          }
        } catch (error) {
          console.error('文件上传失败，继续发送文字消息:', error)
        }
      }

      // 显示用户消息
      addUserMessage(trimmedMessage, currentFile?.file)

      // 发送WebSocket消息
      const success = sendMessage(messageData)
      if (!success) {
        throw new Error('WebSocket消息发送失败')
      }

      // 清空输入
      clearMessage()
      if (currentFile) {
        removeFile()
      }
      autoResizeTextarea()

      // 滚动到底部
      setTimeout(scrollToBottom, 100)
      console.log('✅ 消息已发送')
    } catch (error) {
      console.error('❌ 发送消息失败:', error)
    } finally {
      setIsSending(false)
    }
  }, [addUserMessage, removeFile, autoResizeTextarea, scrollToBottom, getCurrentMessage, clearMessage, setIsSending])

  // 检查是否在输入框中
  const isInInputElement = () => {
    const activeElement = document.activeElement
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    )
  }

  // 全局键盘事件监听（长按空格键ASR）
  useEffect(() => {
    if (!enableASR || !asrConnection.isConnected) {
      console.log('🎤 ASR未启用或未连接，跳过键盘事件监听')
      return
    }

    const handleGlobalKeyDown = (event) => {
      // 只处理空格键且非重复事件
      if (event.code === 'Space' && !event.repeat) {
        // 检查是否在输入框中
        if (!isInInputElement()) {
          event.preventDefault()
          // 开始长按空格键ASR
          if (canStartASR()) {
            console.log('🎤 开始长按空格键ASR')
            startSpaceKeyPress()
            // 停止所有TTS音频
            stopAllTTSAudio();
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
  }, [enableASR, asrConnection.isConnected, canStartASR, startSpaceKeyPress, startSpaceKeyASR, spaceKey.isPressed, endSpaceKeyPress, stopSpaceKeyASR])

  // 监听ASR自动发送事件
  useEffect(() => {
    const handleASRAutoSend = (event) => {
      console.log('🎤 收到ASR自动发送事件:', event.detail)
      setTimeout(() => {
        handleSendMessage()
      }, 100)
    }

    window.addEventListener('asrAutoSend', handleASRAutoSend)

    return () => {
      window.removeEventListener('asrAutoSend', handleASRAutoSend)
    }
  }, [handleSendMessage])

  // 组件挂载时的初始化
  useEffect(() => {
    autoResizeTextarea()
  }, [autoResizeTextarea])


  // 监听消息变化，自动滚动
  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

  return (
    <div
      className={`working-chat-interface flex flex-col h-full bg-background ${className}`}
      {...props}
    >
      {/* 聊天头部 */}
      <div className="flex-shrink-0 border-b">
        <ChatHeader />
      </div>

      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages className="h-full" />
      </div>

      {/* 输入区域 */}
      <div className="flex-shrink-0 border-t bg-background">
        <div className="p-4 space-y-3">
          {/* 文件预览 */}
          {selectedFile && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
              <FilePreview
                file={selectedFile}
                onRemove={removeFile}
              />
            </div>
          )}



          {/* 重构的输入框区域 */}
          <div className="relative">
            {/* 主输入容器 */}
            <div className={`relative bg-white border rounded-xl shadow-sm transition-all duration-200 ${
              recording.isSpaceKeyActive || spaceKey.isPressed
                ? 'border-red-300 shadow-red-100'
                : 'border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:shadow-blue-100'
            }`}>

              {/* 录音状态覆盖层 */}
              {(recording.isSpaceKeyActive || spaceKey.isPressed) && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl flex items-center justify-center z-20 backdrop-blur-sm">
                  <div className="flex items-center space-x-4 text-red-600">
                    {/* 动态波形 */}
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-red-500 rounded-full"
                          style={{
                            height: `${16 + Math.sin(i * 0.5) * 6}px`,
                            animation: `wave 1.5s ease-in-out infinite`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                    <style>{`
                      @keyframes wave {
                        0%, 100% { transform: scaleY(1); }
                        50% { transform: scaleY(1.8); }
                      }
                    `}</style>
                    <div className="text-center">
                      <div className="font-semibold text-sm">正在录音</div>
                      <div className="text-xs opacity-75">松开空格键结束</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 输入框内容区域 */}
              <div className="flex items-end p-3 space-x-2 sm:space-x-3">
                {/* 左侧工具栏 */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {/* 文件上传按钮 */}
                  {enableFileUpload && (
                    <div className="relative group">
                      <FileUploadButton
                        onFileSelect={handleFileSelect}
                        disabled={textarea.isSending || isUploading}
                      >
                        <div className={`p-2 rounded-lg transition-all duration-200 ${
                          textarea.isSending || isUploading
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
                  )}

                  {/* ASR状态指示器 */}
                  {enableASR && (
                    <div className="relative group">
                      <div className={`p-2 rounded-lg transition-all duration-200 ${
                        recording.isSpaceKeyActive || spaceKey.isPressed
                          ? 'bg-red-100 text-red-600'
                          : asrConnection.isConnected
                          ? 'bg-green-50 text-green-600'
                          : 'bg-orange-50 text-orange-600'
                      }`}>
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {recording.isSpaceKeyActive || spaceKey.isPressed
                          ? '正在录音'
                          : asrConnection.isConnected
                          ? '语音识别就绪'
                          : '语音识别未连接'
                        }
                      </div>
                    </div>
                  )}
                </div>

                {/* 主输入区域 */}
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRefCallback}
                    value={textarea.message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    placeholder={placeholder}
                    maxLength={maxMessageLength}
                    rows={1}
                    className="w-full min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus:outline-none focus:ring-0 placeholder:text-gray-400 text-gray-900"
                    disabled={textarea.isSending}
                  />

                  {/* 字符计数和识别结果 */}
                  <div className="absolute bottom-1 right-1 flex items-center space-x-2">
                    {/* 实时识别结果预览 */}
                    {recognition.currentText && (recording.isSpaceKeyActive || spaceKey.isPressed) && (
                      <div className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md max-w-32 truncate">
                        {recognition.currentText}
                      </div>
                    )}

                    {/* 字符计数 */}
                    <div className={`text-xs transition-colors ${
                      textarea.message.length > maxMessageLength * 0.9
                        ? 'text-red-500'
                        : textarea.message.length > maxMessageLength * 0.7
                        ? 'text-orange-500'
                        : 'text-gray-400'
                    }`}>
                      {textarea.message.length}/{maxMessageLength}
                    </div>
                  </div>
                </div>

                {/* 发送按钮 */}
                <SendButton
                  onClick={handleSendMessage}
                  disabled={(!textarea.message.trim() && !selectedFile) || textarea.isSending || connectionStatus !== 'connected'}
                  isSending={textarea.isSending}
                />
              </div>
            </div>

            {/* 底部状态栏 */}
            <ChatStatusBar
              connectionStatus={connectionStatus}
              enableASR={enableASR}
              isRecording={recording.isSpaceKeyActive || spaceKey.isPressed}
            />
          </div>


        </div>
      </div>
    </div>
  )
}

export default WorkingChatInterface
