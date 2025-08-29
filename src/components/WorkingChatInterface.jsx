import React, {useEffect, useCallback} from 'react'
import {useWebSocket} from '../contexts/WebSocketContext'
import {useChatMessagesStore} from '../stores/chatMessagesStore'
import {useFileUploadStore} from '../stores/fileUploadStore'
import {useASRStore} from '../stores/asrStore'
import {useTTSStore} from '../stores/ttsStore'
import {useSystemControlStore} from '../stores/systemControlStore'
import {ChatHeader} from './ChatHeader'
import {ChatMessages} from './ChatMessages'
import {FileUploadButton, FilePreview} from './FileUpload'
import ChatInputArea from './ChatInputArea'

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
  const {sendMessage, connectionStatus} = useWebSocket()
  const {messages, addUserMessage, scrollToBottom, showSearchIndicator} = useChatMessagesStore()
  const {files, ui: fileUI, removeFile, uploadFileToServer, getCurrentFile} = useFileUploadStore()
  const {
    status: recording,
    connection: asrConnection,
    textarea,
    spaceKey,
    startSpaceKeyASR,
    stopSpaceKeyASR,
    setIsSending,
    clearMessage,
    getCurrentMessage,
    startSpaceKeyPress,
    endSpaceKeyPress,
    canStartASR,
    getIsConnected
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
    if (!useSystemControlStore.getState().isSearchEnabled || !text) return false
    const hasSearchKeyword = searchKeywords.some(keyword => text.includes(keyword))
    const isTimeQuery = timeKeywords.some(keyword => text.includes(keyword))
    const isNewsQuery = newsKeywords.some(keyword => text.includes(keyword))
    return hasSearchKeyword || isTimeQuery || isNewsQuery
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
      useTTSStore.getState().stopAllTTSAudio()
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
          const { success, url, error } = await uploadFileToServer()
          if (success && url) {
            messageData.image_url = url
          } else {
            console.error('文件上传失败:', error)
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
      // 滚动到底部
      setTimeout(scrollToBottom, 100)
      console.log('✅ 消息已发送')
    } catch (error) {
      console.error('❌ 发送消息失败:', error)
    } finally {
      setIsSending(false)
    }
  }, [addUserMessage, removeFile, scrollToBottom, clearMessage, setIsSending])
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
        <ChatHeader/>
      </div>

      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages className="h-full"/>
      </div>

      {/* 聊天输入区域 */}
      <ChatInputArea
        selectedFile={selectedFile}
        enableFileUpload={enableFileUpload}
        isUploading={isUploading}
        enableASR={enableASR}
        isRecording={recording.isSpaceKeyActive || spaceKey.isPressed}
        connectionStatus={connectionStatus}
        placeholder={placeholder}
        maxMessageLength={maxMessageLength}
        isSending={textarea.isSending}
        message={textarea.message}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
export default WorkingChatInterface
