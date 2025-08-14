import React, { useState, useRef, useEffect } from 'react'
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
    startContinuousASR,
    stopContinuousASR,
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
  const handleASRToggle = () => {
    if (recording.isContinuousMode) {
      stopContinuousASR()
      if (onNotification) {
        onNotification('已停止持续语音识别', 'info')
      }
    } else {
      // 开始持续ASR前先停止所有TTS音频
      startContinuousASR()
      if (onNotification) {
        onNotification('已开始持续语音识别', 'info')
      }
    }
  }

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

        // 如果是持续模式的最终结果，不自动发送，让用户确认
        if (mode === 'continuous_final') {
          console.log('🎤 持续模式最终结果，等待用户确认发送')
          if (onNotification) {
            onNotification('语音识别完成，请确认后发送', 'info')
          }
        } else if (recording.isContinuousMode) {
          // 持续模式中的中间结果，自动发送
          setTimeout(() => {
            handleSendMessage()
          }, 500) // 延迟500ms发送，给用户看到结果的时间
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
  }, [recording.isContinuousMode, onError])

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

            {/* ASR快捷按钮 */}
            {enableASR && (
              <Button
                variant={recording.isContinuousMode ? "default" : "ghost"}
                size="sm"
                onClick={handleASRToggle}
                disabled={isSending || !asrConnection.isConnected}
                className="flex-shrink-0"
                title={recording.isContinuousMode ? "停止持续语音识别" : "开始持续语音识别"}
              >
                {recording.isContinuousMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
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

          {/* 状态提示 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              {connectionStatus !== 'connected' && (
                <span className="text-red-500">
                  {connectionStatus === 'connecting' ? '正在连接...' : '连接已断开'}
                </span>
              )}
              {/*{recording.isRecording && (
                <span className="text-blue-500">
                  🎤 {recording.isContinuousMode ? '持续识别中...' : '录音中...'}
                </span>
              )}*/}
              {asrUI.showStatus && asrUI.statusText && (
                <span className="text-green-500">
                  {asrUI.statusText}
                </span>
              )}
              {/*{recognition.currentText && (
                <span className="text-blue-600 max-w-xs truncate">
                  识别: {recognition.currentText}
                </span>
              )}*/}
            </div>
            <div className="flex items-center space-x-2">
              {enableASR && !asrConnection.isConnected && (
                <span className="text-orange-500">ASR未连接</span>
              )}
              <span>长按空格键进行语音输入</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkingChatInterface
