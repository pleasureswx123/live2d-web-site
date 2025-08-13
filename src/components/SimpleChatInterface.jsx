import React, { useState, useRef, useEffect } from 'react'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useChatMessagesStore } from '../stores/chatMessagesStore'
import { useTypingIndicatorStore } from '../stores/typingIndicatorStore'
import { useASRStore } from '../stores/asrStore'
import { ChatHeader } from './ChatHeader'
import { ChatMessages } from './ChatMessages'
import { TypingIndicator } from './TypingIndicator'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Send, Mic, MicOff } from 'lucide-react'

/**
 * 简化版聊天界面组件
 * 专注于核心功能：文字聊天、ASR、TTS
 */
const SimpleChatInterface = ({
  className = '',
  onError,
  onNotification,
  ...props
}) => {
  // 状态管理
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  
  // Refs
  const textareaRef = useRef(null)
  
  // Stores
  const { sendMessage, connectionStatus } = useWebSocket()
  const { 
    messages, 
    addUserMessage, 
    scrollToBottom,
    showSearchIndicator
  } = useChatMessagesStore()
  const { isVisible: isTypingVisible } = useTypingIndicatorStore()
  const { 
    recording,
    startContinuousASR,
    stopContinuousASR 
  } = useASRStore()

  // 搜索关键词
  const searchKeywords = ['搜索', '查找', '查询', '最新', '现在', '今天', '新闻', '什么是', '怎么样', '如何']

  // 检测是否需要搜索
  const shouldTriggerSearch = (text) => {
    if (!text) return false
    return searchKeywords.some(keyword => text.includes(keyword))
  }

  // 停止所有TTS音频
  const stopAllTTSAudio = () => {
    console.log('🛑 打断所有TTS播放')
    window.dispatchEvent(new CustomEvent('stopAllTTS'))
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 发送消息
  const handleSendMessage = async () => {
    const trimmedMessage = message.trim()
    
    if (!trimmedMessage) {
      return
    }
    
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
        content: trimmedMessage
      }
      
      // 检测搜索需求
      if (shouldTriggerSearch(trimmedMessage)) {
        messageData.search_query = trimmedMessage
        showSearchIndicator(trimmedMessage)
      }
      
      // 显示用户消息
      addUserMessage(trimmedMessage)
      
      // 发送WebSocket消息
      const success = sendMessage(messageData)
      if (!success) {
        throw new Error('WebSocket消息发送失败')
      }
      
      // 清空输入
      setMessage('')
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

  // 处理ASR消息
  const handleASRMessage = async (messageData) => {
    console.log('🎤 ASR消息:', messageData)
    
    if (!messageData.text) return
    
    try {
      // 打断当前TTS播放
      stopAllTTSAudio()
      
      // 准备消息数据
      const asrMessageData = {
        type: 'chat',
        content: messageData.text
      }
      
      // 检测搜索需求
      if (shouldTriggerSearch(messageData.text)) {
        asrMessageData.search_query = messageData.text
        showSearchIndicator(messageData.text)
      }
      
      // 显示用户消息
      addUserMessage(messageData.text)
      
      // 发送WebSocket消息
      const success = sendMessage(asrMessageData)
      if (!success) {
        throw new Error('WebSocket消息发送失败')
      }
      
      // 滚动到底部
      setTimeout(scrollToBottom, 100)
      
      if (onNotification) {
        onNotification('语音消息已发送', 'success')
      }
      
    } catch (error) {
      console.error('❌ ASR消息发送失败:', error)
      if (onError) onError('ASR消息发送失败')
    }
  }

  // 监听ASR事件
  useEffect(() => {
    const handleASRResult = (event) => {
      const { text } = event.detail
      if (text) {
        handleASRMessage({ text })
      }
    }

    window.addEventListener('asrResult', handleASRResult)
    return () => {
      window.removeEventListener('asrResult', handleASRResult)
    }
  }, [])

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
      className={`simple-chat-interface flex flex-col h-full bg-background ${className}`}
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

      {/* 打字指示器 */}
      {isTypingVisible && (
        <div className="flex-shrink-0 px-4 py-2 border-t bg-muted/30">
          <TypingIndicator />
        </div>
      )}

      {/* 输入区域 */}
      <div className="flex-shrink-0 border-t bg-background">
        <div className="p-4 space-y-3">
          {/* 输入框区域 */}
          <div className="flex items-end space-x-2">
            {/* 消息输入框 */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="发送消息给悠悠..."
                maxLength={1000}
                rows={1}
                className="min-h-[40px] max-h-[120px] resize-none pr-12"
                disabled={isSending}
              />
              
              {/* 字符计数 */}
              <div className="absolute bottom-1 right-1 text-xs text-muted-foreground">
                {message.length}/1000
              </div>
            </div>

            {/* ASR按钮 */}
            <Button
              variant={recording.isContinuousMode ? "default" : "ghost"}
              size="sm"
              onClick={recording.isContinuousMode ? stopContinuousASR : startContinuousASR}
              disabled={isSending}
              className="flex-shrink-0"
            >
              {recording.isContinuousMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            {/* 发送按钮 */}
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending || connectionStatus !== 'connected'}
              className="flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* 状态提示 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {connectionStatus !== 'connected' && (
                <span className="text-red-500">
                  {connectionStatus === 'connecting' ? '正在连接...' : '连接已断开'}
                </span>
              )}
              {recording.isRecording && (
                <span className="text-blue-500">
                  🎤 录音中...
                </span>
              )}
            </div>
            <div>
              长按空格键进行语音输入
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleChatInterface
