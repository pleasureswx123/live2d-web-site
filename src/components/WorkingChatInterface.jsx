import React, {useEffect, useCallback} from 'react'
import {useASRStore} from '../stores/asrStore'
import {useChatMessagesStore} from '../stores/chatMessagesStore'
import {useTTSStore} from '../stores/ttsStore'
import {ChatHeader} from './ChatHeader'
import {ChatMessages} from './ChatMessages'
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
  // ASR Store
  const {
    getIsConnected,
    spaceKey,
    startSpaceKeyASR,
    stopSpaceKeyASR,
    startSpaceKeyPress,
    endSpaceKeyPress,
    canStartASR,
    sendASRMessage,
  } = useASRStore()

  // 发送消息
  const handleSendMessage = useCallback(async () => {
    const result = await sendASRMessage()
    if (!result.success) {
      console.error('发送消息失败:', result.error)
    }
  }, [sendASRMessage])
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
  }, [enableASR, canStartASR, startSpaceKeyPress, startSpaceKeyASR, spaceKey.isPressed, endSpaceKeyPress, stopSpaceKeyASR])
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
    const { scrollToBottom } = useChatMessagesStore.getState()
    scrollToBottom()
  }, [])
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
        enableFileUpload={enableFileUpload}
        enableASR={enableASR}
        placeholder={placeholder}
        maxMessageLength={maxMessageLength}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
export default WorkingChatInterface
