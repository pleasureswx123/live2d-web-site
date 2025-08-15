import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useChatMessagesStore } from '../stores/chatMessagesStore'
import { useTypingIndicatorStore } from '../stores/typingIndicatorStore'
import { useFileUploadStore } from '../stores/fileUploadStore'
import { useASRStore } from '../stores/asrStore'
import { useSystemControlStore } from '../stores/systemControlStore'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { FileUploadButton, FilePreview } from './FileUpload'

import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Send, Paperclip, Mic, MicOff } from 'lucide-react'

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
  onError,
  onNotification,
  ...props
}) => {
  const { toggleSearch: enableSearch} = useSystemControlStore();
  // 状态管理
  const [message, setMessage] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Refs
  const textareaRef = useRef(null)
  const chatContainerRef = useRef(null)

  // WebSocket和Stores
  const { sendMessage, connectionStatus, wsRef } = useWebSocket()
  const {
    messages,
    addUserMessage,
    scrollToBottom,
    showSearchIndicator
  } = useChatMessagesStore()
  const { isVisible: isTypingVisible } = useTypingIndicatorStore()
  const {
    files,
    ui: fileUI,
    selectFile,
    removeFile,
    startUpload
  } = useFileUploadStore()
  const {
    recording,
    recognition,
    ui: asrUI,
    connection: asrConnection,
    startSpaceKeyASR,
    stopSpaceKeyASR,
    updateConnectionFromContext
  } = useASRStore()

  // 获取当前选中的文件
  const selectedFile = files.current
  const isUploading = fileUI.isUploading

  // 搜索关键词配置
  const searchKeywords = ['搜索', '查找', '查询', '最新', '现在', '今天', '新闻', '什么是', '怎么样', '如何']
  const timeKeywords = ['现在', '今天', '几号', '时间', '日期']
  const newsKeywords = ['新闻', '最新', '热点', '时事']

  // 检测是否需要搜索
  const shouldTriggerSearch = (text) => {
    if (!enableSearch || !text) return false

    const hasSearchKeyword = searchKeywords.some(keyword => text.includes(keyword))
    const isTimeQuery = timeKeywords.some(keyword => text.includes(keyword))
    const isNewsQuery = newsKeywords.some(keyword => text.includes(keyword))

    return hasSearchKeyword || isTimeQuery || isNewsQuery
  }

  // 停止所有TTS音频
  const stopAllTTSAudio = () => {
    console.log('🛑 打断所有TTS播放')
    window.dispatchEvent(new CustomEvent('stopAllTTS'))
    window.dispatchEvent(new CustomEvent('clearAudioQueue'))
  }

  // 自动调整textarea高度
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }

  // 处理输入变化
  const handleInputChange = (e) => {
    setMessage(e.target.value)
    autoResizeTextarea()
  }

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 处理文件选择
  const handleFileSelect = (file) => {
    console.log('📎 选择文件:', file.name)
    selectFile(file)
    if (onNotification) {
      onNotification(`已选择文件: ${file.name}`, 'info')
    }
  }

  // 处理文件上传
  const handleFileUpload = async (file) => {
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

      const success = await startUpload(uploadFunction)

      if (success && files.current?.uploadResult?.url) {
        console.log('✅ 文件上传成功:', files.current.uploadResult.url)
        return files.current.uploadResult.url
      }
    } catch (error) {
      console.error('❌ 文件上传失败:', error)
      if (onError) onError('文件上传失败')
      throw error
    }
  }

  // 发送消息
  const handleSendMessage = async () => {
    const trimmedMessage = message.trim()

    // 验证消息内容
    if (!trimmedMessage && !selectedFile) {
      return
    }

    // 检查连接状态
    if (connectionStatus !== 'connected') {
      if (onError) onError('连接已断开，请等待重连...')
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
      if (selectedFile) {
        try {
          const fileUrl = await handleFileUpload(selectedFile.file)
          if (fileUrl) {
            messageData.image_url = fileUrl
          }
        } catch (error) {
          console.error('文件上传失败，继续发送文字消息:', error)
        }
      }

      // 显示用户消息
      addUserMessage(trimmedMessage, selectedFile?.file)

      // 发送WebSocket消息
      const success = sendMessage(messageData)
      if (!success) {
        throw new Error('WebSocket消息发送失败')
      }

      // 清空输入
      setMessage('')
      if (selectedFile) {
        removeFile()
      }
      autoResizeTextarea()

      // 滚动到底部
      setTimeout(scrollToBottom, 100)

      if (onNotification) {
        onNotification('消息已发送', 'success')
      }

    } catch (error) {
      console.error('❌ 发送消息失败:', error)
      if (onError) onError('发送消息失败')
    } finally {
      setIsSending(false)
    }
  }

  // 处理ASR模式切换
  // 长按空格键ASR状态
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [spaceKeyStartTime, setSpaceKeyStartTime] = useState(null)

  // 处理长按空格键ASR
  const handleSpaceKeyDown = useCallback(() => {
    if (isSpacePressed || recording.isSpaceKeyASRActive || isSending) return

    setIsSpacePressed(true)
    setSpaceKeyStartTime(Date.now())

    // 停止所有TTS音频
    stopAllTTSAudio()

    // 开始长按空格键ASR
    startSpaceKeyASR()

    if (onNotification) {
      onNotification('开始语音识别，松开空格键结束', 'info')
    }
  }, [isSpacePressed, recording.isSpaceKeyASRActive, isSending, startSpaceKeyASR, stopAllTTSAudio, onNotification])

  const handleSpaceKeyUp = useCallback(() => {
    if (!isSpacePressed) return

    setIsSpacePressed(false)
    const duration = spaceKeyStartTime ? Date.now() - spaceKeyStartTime : 0
    setSpaceKeyStartTime(null)

    // 停止长按空格键ASR
    stopSpaceKeyASR()

    if (onNotification) {
      onNotification(`语音识别完成 (${(duration / 1000).toFixed(1)}秒)`, 'success')
    }
  }, [isSpacePressed, spaceKeyStartTime, stopSpaceKeyASR, onNotification])

  // 全局键盘事件监听（长按空格键ASR）
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      // 只在空格键且不在输入框中时处理
      if (event.code === 'Space' && !event.repeat && enableASR && asrConnection.isConnected) {
        // 检查是否在输入框或其他可编辑元素中
        const activeElement = document.activeElement
        const isInInput = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true'
        )

        if (!isInInput) {
          event.preventDefault()
          handleSpaceKeyDown()
        }
      }
    }

    const handleGlobalKeyUp = (event) => {
      if (event.code === 'Space' && enableASR) {
        const activeElement = document.activeElement
        const isInInput = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true'
        )

        if (!isInInput) {
          event.preventDefault()
          handleSpaceKeyUp()
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    document.addEventListener('keyup', handleGlobalKeyUp)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
      document.removeEventListener('keyup', handleGlobalKeyUp)
    }
  }, [enableASR, asrConnection.isConnected, handleSpaceKeyDown, handleSpaceKeyUp])

  // 同步WebSocket连接状态到ASR Store
  useEffect(() => {
    if (updateConnectionFromContext) {
      updateConnectionFromContext(wsRef, connectionStatus)
    }
  }, [connectionStatus, wsRef, updateConnectionFromContext])

  // 监听ASR事件并集成到输入框
  useEffect(() => {
    const handleASRInputUpdate = (event) => {
      const { text, mode } = event.detail
      console.log('🎤 ASR输入更新:', text, mode)

      // 直接更新输入框内容
      if (text && text.trim()) {
        setMessage(text.trim())
        // 自动调整输入框高度
        setTimeout(autoResizeTextarea, 0)
      }
    }

    const handleASRResult = (event) => {
      const { text, mode } = event.detail
      console.log('🎤 ASR最终结果:', text, 'mode:', mode)

      if (text && text.trim()) {
        // 设置输入框内容
        setMessage(text.trim())
        setTimeout(autoResizeTextarea, 0)

        // 长按空格键模式的最终结果，不自动发送，让用户确认
        if (mode === 'spacekey_final' || mode === 'continuous_final') {
          console.log('🎤 语音识别完成，等待用户确认发送')
          if (onNotification) {
            onNotification('语音识别完成，请确认后发送', 'info')
          }
        }
      }
    }

    const handleASRError = (event) => {
      const { error, originalError, mode } = event.detail
      console.error('❌ ASR错误:', error, 'mode:', mode)
      if (onError) onError(`语音识别错误: ${error}`)
    }

    const handleASRStopped = (event) => {
      const { finalText, mode } = event.detail
      console.log('🎤 ASR已停止, mode:', mode, 'finalText:', finalText)

      // 使用服务器提供的最终文本，如果没有则使用当前识别文本
      let textToUse = finalText
      if (!textToUse && recognition.currentText && recognition.currentText.trim()) {
        textToUse = recognition.currentText.trim()
        console.log('🎤 使用当前识别文本:', textToUse)
      }

      if (textToUse) {
        setMessage(textToUse)
        setTimeout(autoResizeTextarea, 0)

        if (onNotification) {
          onNotification('语音识别已停止，请确认内容后发送', 'info')
        }
      }
    }

    const handleASRServerStarted = (event) => {
      const { mode } = event.detail
      console.log('🎤 服务器确认ASR已启动, mode:', mode)
      if (onNotification) {
        onNotification('语音识别服务已启动', 'success')
      }
    }

    // 注册事件监听器
    window.addEventListener('asrInputUpdate', handleASRInputUpdate)
    window.addEventListener('asrResult', handleASRResult)
    window.addEventListener('asrServerError', handleASRError)
    window.addEventListener('asrServerStopped', handleASRStopped)
    window.addEventListener('asrServerStarted', handleASRServerStarted)

    return () => {
      window.removeEventListener('asrInputUpdate', handleASRInputUpdate)
      window.removeEventListener('asrResult', handleASRResult)
      window.removeEventListener('asrServerError', handleASRError)
      window.removeEventListener('asrServerStopped', handleASRStopped)
      window.removeEventListener('asrServerStarted', handleASRServerStarted)
    }
  }, [recording.isSpaceKeyASRActive, onError])

  // 组件挂载时的初始化
  useEffect(() => {
    autoResizeTextarea()
  }, [])

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
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-hidden"
      >
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
              recording.isSpaceKeyASRActive || isSpacePressed
                ? 'border-red-300 shadow-red-100'
                : 'border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:shadow-blue-100'
            }`}>

              {/* 录音状态覆盖层 */}
              {(recording.isSpaceKeyASRActive || isSpacePressed) && (
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
                    <style jsx>{`
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
                        disabled={isSending || isUploading}
                      >
                        <div className={`p-2 rounded-lg transition-all duration-200 ${
                          isSending || isUploading
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
                        recording.isSpaceKeyASRActive || isSpacePressed
                          ? 'bg-red-100 text-red-600'
                          : asrConnection.isConnected
                          ? 'bg-green-50 text-green-600'
                          : 'bg-orange-50 text-orange-600'
                      }`}>
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {recording.isSpaceKeyASRActive || isSpacePressed
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
                    ref={textareaRef}
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    placeholder={placeholder}
                    maxLength={maxMessageLength}
                    rows={1}
                    className="w-full min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus:outline-none focus:ring-0 placeholder:text-gray-400 text-gray-900"
                    disabled={isSending}
                  />

                  {/* 字符计数和识别结果 */}
                  <div className="absolute bottom-1 right-1 flex items-center space-x-2">
                    {/* 实时识别结果预览 */}
                    {recognition.currentText && (recording.isSpaceKeyASRActive || isSpacePressed) && (
                      <div className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md max-w-32 truncate">
                        {recognition.currentText}
                      </div>
                    )}

                    {/* 字符计数 */}
                    <div className={`text-xs transition-colors ${
                      message.length > maxMessageLength * 0.9
                        ? 'text-red-500'
                        : message.length > maxMessageLength * 0.7
                        ? 'text-orange-500'
                        : 'text-gray-400'
                    }`}>
                      {message.length}/{maxMessageLength}
                    </div>
                  </div>
                </div>

                {/* 发送按钮 */}
                <div className="relative group">
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!message.trim() && !selectedFile) || isSending || connectionStatus !== 'connected'}
                    className={`p-2.5 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      (!message.trim() && !selectedFile) || isSending || connectionStatus !== 'connected'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:scale-100'
                        : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {isSending ? '发送中...' : '发送消息'}
                  </div>
                </div>
              </div>
            </div>

            {/* 底部状态栏 */}
            <div className="flex items-center justify-between mt-2 px-1">
              {/* 左侧状态信息 */}
              <div className="flex items-center space-x-4 text-xs">
                {/* 连接状态 */}
                <div className="flex items-center space-x-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-green-500'
                      : connectionStatus === 'connecting'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-red-500'
                  }`} />
                  <span className={`${
                    connectionStatus === 'connected'
                      ? 'text-green-600'
                      : connectionStatus === 'connecting'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {connectionStatus === 'connected'
                      ? '已连接'
                      : connectionStatus === 'connecting'
                      ? '连接中...'
                      : '连接断开'
                    }
                  </span>
                </div>

                {/* ASR状态 */}
                {enableASR && (
                  <div className="flex items-center space-x-1.5">
                    <div className={`w-2 h-2 rounded-full ${
                      recording.isSpaceKeyASRActive || isSpacePressed
                        ? 'bg-red-500 animate-pulse'
                        : asrConnection.isConnected
                        ? 'bg-green-500'
                        : 'bg-gray-400'
                    }`} />
                    <span className={`${
                      recording.isSpaceKeyASRActive || isSpacePressed
                        ? 'text-red-600'
                        : asrConnection.isConnected
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}>
                      {recording.isSpaceKeyASRActive || isSpacePressed
                        ? '录音中'
                        : asrConnection.isConnected
                        ? '语音就绪'
                        : '语音未连接'
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* 右侧快捷键提示 */}
              <div className="hidden sm:flex items-center space-x-3 text-xs text-gray-500">
                {enableASR && asrConnection.isConnected && (
                  <div className="flex items-center space-x-1.5">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Space</kbd>
                    <span>长按语音输入</span>
                  </div>
                )}
                <div className="flex items-center space-x-1.5">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">↵</kbd>
                  <span>发送</span>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}

export default WorkingChatInterface
