import React, {useCallback, useEffect, useState, useRef} from 'react'
import {useASRStore} from '../stores/asrStore'
import {Textarea} from './ui/textarea'
import CharacterCounter from './CharacterCounter'

/**
 * 聊天输入框组件
 * 集成了ASR语音识别功能和文本输入功能
 */
const ChatTextarea = ({
                        placeholder = "发送消息给悠悠...",
                        maxMessageLength = 1000,
                        className = "",
                        onSendMessage,
                        disabled = false,
                        ...props
                      }) => {
  // 本地状态：输入法组合状态
  const [isComposing, setIsComposing] = useState(false)
  
  // textarea引用
  const textareaRef = useRef(null)

  // 从 ASR Store 获取状态和方法
  const {
    textarea,
    handleInputChange,
  } = useASRStore()
  
  // 自动调整textarea高度的方法
  const autoResizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [])
  
  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      if (onSendMessage) {
        onSendMessage()
      }
    }
  }

  // 监听textarea.message变化，自动调整高度
  useEffect(() => {
    // 使用setTimeout确保DOM更新后再调整高度
    setTimeout(autoResizeTextarea, 0)
  }, [textarea.message, autoResizeTextarea])
  return (
    <div className={`flex-1 relative ${className}`}>
      <Textarea
        ref={textareaRef}
        value={textarea.message}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        placeholder={placeholder}
        maxLength={maxMessageLength}
        rows={1}
        className="w-full min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus:outline-none focus:ring-0 placeholder:text-gray-400 text-gray-900"
        disabled={disabled || textarea.isSending}
        {...props}
      />
      {/* 字符计数 */}
      <CharacterCounter
        currentLength={textarea.message.length}
        maxLength={maxMessageLength}
        className="absolute bottom-1 right-1 flex items-center"
      />
    </div>
  )
}
export default ChatTextarea
