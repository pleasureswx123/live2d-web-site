import React, { useState, useRef, useEffect } from 'react'
import { useASRStore } from '../../stores/asrStore'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Smile, 
  X, 
  RotateCcw,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react'

/**
 * 集成ASR的聊天输入组件
 * 提供完整的聊天输入体验，包括文字、语音、表情等
 */
const ChatInputWithASR = ({
  onSendMessage,
  onAttachFile,
  onError,
  onNotification,
  replyToMessage = null,
  placeholder = "输入消息或长按空格键语音输入...",
  maxLength = 1000,
  enableASR = true,
  enableAttachments = true,
  enableEmojis = true,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('')
  const [showASRPreview, setShowASRPreview] = useState(false)
  const [asrPreviewText, setASRPreviewText] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [showASRSettings, setShowASRSettings] = useState(false)
  
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const {
    recording,
    recognition,
    ui,
    chat,
    config,
    performance,
    setChatIntegration,
    setReplyToMessage,
    shouldAutoSend,
    processVoiceCommand,
    startContinuousASR,
    stopContinuousASR,
    checkNetworkStatus
  } = useASRStore()

  // 初始化
  useEffect(() => {
    setChatIntegration('main-chat', {
      sendStrategy: 'preview',
      enableVoiceCommands: true
    })

    if (replyToMessage) {
      setReplyToMessage(replyToMessage.id)
    }
  }, [replyToMessage])

  // 监听ASR事件
  useEffect(() => {
    // ASR结果处理
    const handleASRResult = (event) => {
      const { text } = event.detail
      console.log('📥 聊天输入ASR结果:', text)
      
      // 检查是否为语音命令
      if (processVoiceCommand(text)) {
        return
      }
      
      // 根据策略处理结果
      if (shouldAutoSend(text)) {
        handleSendMessage(text)
      } else {
        setASRPreviewText(text)
        setShowASRPreview(true)
      }
    }

    // 实时结果更新
    const handleRealtimeResult = (event) => {
      const { text } = event.detail
      setASRPreviewText(text)
      
      // 如果没有显示预览，显示在输入框中
      if (!showASRPreview) {
        setInputValue(text)
      }
    }

    // 语音命令处理
    const handleVoiceCommand = (event) => {
      const { command, text } = event.detail
      
      switch (command) {
        case 'send':
          handleSendMessage(text || inputValue || asrPreviewText)
          break
        case 'cancel':
          handleCancelASR()
          break
        case 'retry':
          handleRetryASR()
          break
        case 'delete':
          setInputValue('')
          setASRPreviewText('')
          setShowASRPreview(false)
          break
      }
    }

    // 输入框更新
    const handleInputUpdate = (event) => {
      const { text, mode } = event.detail
      
      if (mode === 'final') {
        setInputValue(text)
        focusInput()
      } else {
        setInputValue(text)
      }
    }

    // 注册事件监听
    window.addEventListener('asrResult', handleASRResult)
    window.addEventListener('asrRealtimeResult', handleRealtimeResult)
    window.addEventListener('asrVoiceCommand', handleVoiceCommand)
    window.addEventListener('asrInputUpdate', handleInputUpdate)

    return () => {
      window.removeEventListener('asrResult', handleASRResult)
      window.removeEventListener('asrRealtimeResult', handleRealtimeResult)
      window.removeEventListener('asrVoiceCommand', handleVoiceCommand)
      window.removeEventListener('asrInputUpdate', handleInputUpdate)
    }
  }, [inputValue, asrPreviewText, showASRPreview])

  // 发送消息
  const handleSendMessage = async (text = inputValue) => {
    if (!text?.trim()) return

    try {
      const messageData = {
        text: text.trim(),
        replyTo: replyToMessage?.id || null,
        timestamp: new Date(),
        source: text === inputValue ? 'text' : 'voice'
      }

      if (onSendMessage) {
        await onSendMessage(messageData)
      }

      // 清理状态
      setInputValue('')
      setASRPreviewText('')
      setShowASRPreview(false)
      focusInput()

      if (onNotification) {
        onNotification('消息已发送', 'success')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      if (onError) onError('发送消息失败')
    }
  }

  // 处理输入变化
  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 处理文件上传
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && onAttachFile) {
      onAttachFile(file)
    }
  }

  // 取消ASR
  const handleCancelASR = () => {
    setShowASRPreview(false)
    setASRPreviewText('')
    stopContinuousASR()
  }

  // 重试ASR
  const handleRetryASR = async () => {
    setShowASRPreview(false)
    setASRPreviewText('')
    try {
      await startContinuousASR()
    } catch (error) {
      if (onError) onError('启动语音识别失败')
    }
  }

  // 接受ASR结果
  const handleAcceptASR = () => {
    setInputValue(asrPreviewText)
    setShowASRPreview(false)
    setASRPreviewText('')
    focusInput()
  }

  // 聚焦输入框
  const focusInput = () => {
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
  }

  // 获取字符计数颜色
  const getCharCountColor = () => {
    const ratio = inputValue.length / maxLength
    if (ratio > 0.9) return 'text-red-500'
    if (ratio > 0.7) return 'text-yellow-500'
    return 'text-muted-foreground'
  }

  return (
    <div className={`chat-input-with-asr ${className}`}>
      {/* 回复消息指示器 */}
      {replyToMessage && (
        <div className="mb-2 p-2 bg-muted rounded-lg text-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-muted-foreground">回复 {replyToMessage.user?.name}:</div>
              <div className="truncate">{replyToMessage.text}</div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyToMessage(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* ASR预览 */}
      {showASRPreview && asrPreviewText && (
        <Card className="mb-2">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">语音识别结果:</div>
                <div className="text-sm bg-background p-2 rounded border">
                  {asrPreviewText}
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <Button size="sm" onClick={handleAcceptASR}>
                  使用
                </Button>
                <Button size="sm" variant="outline" onClick={handleRetryASR}>
                  <RotateCcw className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelASR}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主输入区域 */}
      <div className="flex items-end space-x-2">
        {/* 附件按钮 */}
        {enableAttachments && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        )}

        {/* 输入框容器 */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none pr-12"
          />
          
          {/* 字符计数 */}
          <div className={`absolute bottom-1 right-1 text-xs ${getCharCountColor()}`}>
            {inputValue.length}/{maxLength}
          </div>
        </div>

        {/* ASR控制按钮 */}
        {enableASR && (
          <div className="flex items-center space-x-1">
            <Button
              variant={recording.isContinuousMode ? "default" : "ghost"}
              size="sm"
              onClick={recording.isContinuousMode ? stopContinuousASR : startContinuousASR}
              className="flex-shrink-0"
            >
              {recording.isContinuousMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            
            {/* ASR状态指示器 */}
            {recording.isRecording && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                录音中
              </Badge>
            )}
          </div>
        )}

        {/* 表情按钮 */}
        {enableEmojis && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
          >
            <Smile className="w-4 h-4" />
          </Button>
        )}

        {/* 发送按钮 */}
        <Button
          onClick={() => handleSendMessage()}
          disabled={!inputValue.trim() && !asrPreviewText.trim()}
          className="flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* ASR状态栏 */}
      {enableASR && (recording.isRecording || ui.showStatus) && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <span>{ui.statusText}</span>
            {recognition.confidence > 0 && (
              <Badge variant="outline" className="text-xs">
                {Math.round(recognition.confidence * 100)}%
              </Badge>
            )}
          </div>
          
          {performance.networkLatency > 0 && (
            <Badge variant="outline" className="text-xs">
              {performance.networkLatency}ms
            </Badge>
          )}
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  )
}

export default ChatInputWithASR
