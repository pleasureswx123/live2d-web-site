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
            <FilePreview
              file={selectedFile}
              onRemove={removeFile}
            />
          )}



          {/* 输入框区域 */}
          <div className="flex items-end space-x-2">
            {/* 文件上传按钮 */}
            {enableFileUpload && (
              <FileUploadButton
                onFileSelect={handleFileSelect}
                disabled={isSending || isUploading}
              >
                <Paperclip className="w-4 h-4" />
              </FileUploadButton>
            )}

            {/* 消息输入框 */}
            <div className="flex-1 relative">
              {/* 录音状态覆盖层 */}
              {(recording.isSpaceKeyASRActive || isSpacePressed) && (
                <div className="absolute inset-0 bg-red-50 border-2 border-red-200 rounded-md flex items-center justify-center z-10">
                  <div className="flex items-center space-x-3 text-red-600">
                    <div className="flex space-x-1">
                      <div className="w-1 h-4 bg-red-500 rounded animate-pulse" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-6 bg-red-500 rounded animate-pulse" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1 h-3 bg-red-500 rounded animate-pulse" style={{animationDelay: '300ms'}}></div>
                      <div className="w-1 h-5 bg-red-500 rounded animate-pulse" style={{animationDelay: '450ms'}}></div>
                      <div className="w-1 h-2 bg-red-500 rounded animate-pulse" style={{animationDelay: '600ms'}}></div>
                    </div>
                    <span className="font-medium text-sm">正在录音... 松开空格键结束</span>
                  </div>
                </div>
              )}

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
                className="min-h-[40px] max-h-[120px] resize-none pr-12"
                disabled={isSending}
              />

              {/* 字符计数 */}
              <div className="absolute bottom-1 right-1 text-xs text-muted-foreground">
                {message.length}/{maxMessageLength}
              </div>
            </div>

            {/* ASR状态指示器 */}
            {enableASR && (
              <div className="flex items-center space-x-1">
                {/* 连接状态指示 */}
                <div className={`w-2 h-2 rounded-full ${
                  asrConnection.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} title={asrConnection.isConnected ? 'ASR已连接' : 'ASR未连接'} />

                {/* 录音状态指示 */}
                <div className={`p-1 rounded-full transition-all duration-200 ${
                  recording.isSpaceKeyASRActive || isSpacePressed
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Mic className="w-3 h-3" />
                </div>
              </div>
            )}

            {/* 发送按钮 */}
            <Button
              onClick={handleSendMessage}
              disabled={(!message.trim() && !selectedFile) || isSending || connectionStatus !== 'connected'}
              className="flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* 改进的状态提示 */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              {/* 连接状态 */}
              {connectionStatus !== 'connected' && (
                <div className="flex items-center space-x-1 text-red-500">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  <span>{connectionStatus === 'connecting' ? '正在连接...' : '连接已断开'}</span>
                </div>
              )}

              {/* ASR状态 */}
              {enableASR && (
                <div className="flex items-center space-x-1">
                  {recording.isSpaceKeyASRActive || isSpacePressed ? (
                    <div className="flex items-center space-x-1 text-red-500">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                      <span>正在录音...</span>
                    </div>
                  ) : asrConnection.isConnected ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>语音识别就绪</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-orange-500">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      <span>语音识别未连接</span>
                    </div>
                  )}
                </div>
              )}

              {/* 识别结果预览 */}
              {recognition.currentText && (recording.isSpaceKeyASRActive || isSpacePressed) && (
                <div className="flex items-center space-x-1 text-blue-600 max-w-xs">
                  <span className="truncate">识别: {recognition.currentText}</span>
                </div>
              )}
            </div>

            {/* 使用提示 */}
            <div className="flex items-center space-x-2 text-muted-foreground">
              {enableASR && asrConnection.isConnected && (
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Space</kbd>
                  <span>长按进行语音输入</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkingChatInterface
