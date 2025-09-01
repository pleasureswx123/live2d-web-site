import React, {useCallback, useEffect, useState, useRef, useMemo} from 'react'
import {useASRStore} from '../stores/asrStore'
import {Textarea} from './ui/textarea'
import CharacterCounter from './CharacterCounter'

/**
 * 聊天输入框组件
 * 集成了ASR语音识别功能和文本输入功能
 */
const ChatTextarea = React.memo(({
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
  
  // 使用 useCallback 优化键盘事件处理
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      if (onSendMessage) {
        onSendMessage()
      }
    }
  }, [isComposing, onSendMessage])

  // 使用 useCallback 优化输入法事件处理
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true)
  }, [])

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false)
  }, [])

  // 监听textarea.message变化，自动调整高度
  useEffect(() => {
    // 使用setTimeout确保DOM更新后再调整高度
    const timer = setTimeout(autoResizeTextarea, 0)
    return () => clearTimeout(timer)
  }, [textarea.message, autoResizeTextarea])

  // 使用 useMemo 优化样式类名
  const textareaClassName = useMemo(() => {
    return "w-full min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus:outline-none focus:ring-0 placeholder:text-gray-400 text-gray-900"
  }, [])

  // 使用 useMemo 优化容器类名
  const containerClassName = useMemo(() => {
    return `flex-1 relative ${className}`
  }, [className])

  // 使用 useMemo 优化禁用状态
  const isDisabled = useMemo(() => {
    return disabled || textarea.isSending
  }, [disabled, textarea.isSending])

  // 使用 useMemo 优化字符计数器的 props
  const characterCounterProps = useMemo(() => {
    return {
      currentLength: textarea.message.length,
      maxLength: maxMessageLength,
      className: "absolute bottom-1 right-1 flex items-center"
    }
  }, [textarea.message.length, maxMessageLength])

  return (
    <div className={containerClassName}>
      <Textarea
        ref={textareaRef}
        value={textarea.message}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder={placeholder}
        maxLength={maxMessageLength}
        rows={1}
        className={textareaClassName}
        disabled={isDisabled}
        {...props}
      />
      {/* 字符计数 */}
      <CharacterCounter {...characterCounterProps} />
    </div>
  )
})

// 设置显示名称，便于调试
ChatTextarea.displayName = 'ChatTextarea'

export default ChatTextarea
