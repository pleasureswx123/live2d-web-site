import React, { useState, useEffect, useRef } from 'react'
import { useASRStore } from '../../stores/asrStore'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Mic, MicOff, Send, X, RotateCcw, Volume2 } from 'lucide-react'

/**
 * ASR聊天集成组件
 * 专门为聊天应用优化的语音识别组件
 */
const ASRChatIntegration = ({
  chatId,
  onSendMessage,
  onError,
  onNotification,
  replyToMessage = null,
  className = '',
  enablePreview = true,
  autoSendThreshold = 10,
  enableVoiceCommands = true
}) => {
  const [showPreview, setShowPreview] = useState(false)
  const [previewText, setPreviewText] = useState('')
  const [isProcessingCommand, setIsProcessingCommand] = useState(false)
  
  const previewRef = useRef(null)

  const {
    recording,
    recognition,
    ui,
    chat,
    config,
    performance,
    errorRecovery,
    setChatIntegration,
    setReplyToMessage,
    setMessagePreview,
    shouldAutoSend,
    processVoiceCommand,
    startSpaceKeyASR,
    stopSpaceKeyASR,
    startContinuousASR,
    stopContinuousASR,
    startPerformanceSession,
    recordRecognitionSuccess,
    recordRecognitionFailure,
    checkNetworkStatus,
    reset
  } = useASRStore()

  // 初始化聊天集成
  useEffect(() => {
    setChatIntegration(chatId, {
      sendStrategy: enablePreview ? 'preview' : 'auto',
      enableVoiceCommands
    })
    
    if (replyToMessage) {
      setReplyToMessage(replyToMessage.id)
    }

    // 开始性能监控
    startPerformanceSession()

    return () => {
      // 清理
      reset()
    }
  }, [chatId, enablePreview, enableVoiceCommands, replyToMessage])

  // 监听ASR事件
  useEffect(() => {
    // ASR结果处理
    const handleASRResult = async (event) => {
      const { text } = event.detail
      console.log('📥 聊天ASR结果:', text)
      
      setPreviewText(text)
      setMessagePreview(text)
      
      // 检查是否为语音命令
      if (processVoiceCommand(text)) {
        setIsProcessingCommand(true)
        return
      }
      
      // 智能发送策略
      if (shouldAutoSend(text)) {
        await handleSendMessage(text)
        recordRecognitionSuccess(recognition.confidence)
      } else if (enablePreview) {
        setShowPreview(true)
      }
    }

    // 语音命令处理
    const handleVoiceCommand = async (event) => {
      const { command, text } = event.detail
      console.log('🎙️ 语音命令:', command)
      
      setIsProcessingCommand(true)
      
      try {
        switch (command) {
          case 'send':
            if (text || previewText) {
              await handleSendMessage(text || previewText)
              setShowPreview(false)
              setPreviewText('')
            }
            break
            
          case 'cancel':
            setShowPreview(false)
            setPreviewText('')
            setMessagePreview('')
            break
            
          case 'retry':
            setShowPreview(false)
            setPreviewText('')
            await startSpaceKeyASR()
            break
            
          case 'delete':
            setPreviewText('')
            setMessagePreview('')
            break
        }
      } catch (error) {
        console.error('语音命令执行失败:', error)
        if (onError) onError(error.message)
      } finally {
        setIsProcessingCommand(false)
      }
    }

    // 实时结果更新
    const handleRealtimeResult = (event) => {
      const { text, confidence } = event.detail
      setPreviewText(text)
      setMessagePreview(text)
    }

    // 错误处理
    const handleASRError = (event) => {
      const { error } = event.detail
      console.error('❌ 聊天ASR错误:', error)
      recordRecognitionFailure()
      setShowPreview(false)
      if (onError) onError(error)
    }

    // 注册事件监听
    window.addEventListener('asrResult', handleASRResult)
    window.addEventListener('asrVoiceCommand', handleVoiceCommand)
    window.addEventListener('asrRealtimeResult', handleRealtimeResult)
    window.addEventListener('asrError', handleASRError)

    return () => {
      window.removeEventListener('asrResult', handleASRResult)
      window.removeEventListener('asrVoiceCommand', handleVoiceCommand)
      window.removeEventListener('asrRealtimeResult', handleRealtimeResult)
      window.removeEventListener('asrError', handleASRError)
    }
  }, [previewText, enablePreview])

  // 发送消息
  const handleSendMessage = async (text) => {
    if (!text?.trim()) return

    try {
      const messageData = {
        text: text.trim(),
        replyTo: replyToMessage?.id || null,
        timestamp: new Date(),
        source: 'voice'
      }

      if (onSendMessage) {
        await onSendMessage(messageData)
      }

      // 清理状态
      setShowPreview(false)
      setPreviewText('')
      setMessagePreview('')
      
      if (onNotification) {
        onNotification('消息已发送', 'success')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      if (onError) onError('发送消息失败')
    }
  }

  // 取消预览
  const handleCancelPreview = () => {
    setShowPreview(false)
    setPreviewText('')
    setMessagePreview('')
  }

  // 重新录制
  const handleRetry = async () => {
    setShowPreview(false)
    setPreviewText('')
    try {
      await startSpaceKeyASR()
    } catch (error) {
      console.error('重新录制失败:', error)
      if (onError) onError('重新录制失败')
    }
  }

  // 获取状态颜色
  const getStatusColor = () => {
    if (errorRecovery.isRecovering) return 'destructive'
    if (recording.isRecording) return 'default'
    if (showPreview) return 'secondary'
    return 'outline'
  }

  // 获取状态文本
  const getStatusText = () => {
    if (isProcessingCommand) return '处理语音命令中...'
    if (errorRecovery.isRecovering) return '恢复中...'
    if (recording.isSpaceKeyASRActive) return '长按识别中...'
    if (recording.isContinuousMode) return '持续识别中...'
    if (recording.isRecording) return '录音中...'
    if (showPreview) return '预览消息'
    return '就绪'
  }

  return (
    <div className={`asr-chat-integration ${className}`}>
      {/* 状态指示器 */}
      <div className="flex items-center space-x-2 mb-2">
        <Badge variant={getStatusColor()}>
          {recording.isRecording && <Mic className="w-3 h-3 mr-1" />}
          {getStatusText()}
        </Badge>
        
        {/* 性能指示器 */}
        {performance.averageConfidence > 0 && (
          <Badge variant="outline" className="text-xs">
            置信度: {Math.round(performance.averageConfidence * 100)}%
          </Badge>
        )}
        
        {/* 网络状态 */}
        {performance.networkLatency > 0 && (
          <Badge variant="outline" className="text-xs">
            延迟: {performance.networkLatency}ms
          </Badge>
        )}
      </div>

      {/* 回复消息指示器 */}
      {replyToMessage && (
        <div className="mb-2 p-2 bg-muted rounded text-sm">
          <div className="text-muted-foreground">回复:</div>
          <div className="truncate">{replyToMessage.text}</div>
        </div>
      )}

      {/* 消息预览 */}
      {showPreview && previewText && (
        <Card className="mb-3">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">消息预览:</div>
                <div className="text-sm">{previewText}</div>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleSendMessage(previewText)}
                  disabled={isProcessingCommand}
                >
                  <Send className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isProcessingCommand}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelPreview}
                  disabled={isProcessingCommand}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 控制按钮 */}
      <div className="flex items-center space-x-2">
        <Button
          variant={recording.isContinuousMode ? "default" : "outline"}
          size="sm"
          onClick={recording.isContinuousMode ? stopContinuousASR : startContinuousASR}
          disabled={recording.isRecording && !recording.isContinuousMode}
        >
          {recording.isContinuousMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {recording.isContinuousMode ? '停止持续' : '持续识别'}
        </Button>

        {errorRecovery.fallbackMode && (
          <Badge variant="destructive" className="text-xs">
            降级模式
          </Badge>
        )}
      </div>

      {/* 使用提示 */}
      <div className="mt-2 text-xs text-muted-foreground">
        {enableVoiceCommands && (
          <div>💡 语音命令: "发送"、"取消"、"重新录制"、"删除"</div>
        )}
        <div>🎤 长按空格键进行语音输入</div>
      </div>
    </div>
  )
}

export default ASRChatIntegration
