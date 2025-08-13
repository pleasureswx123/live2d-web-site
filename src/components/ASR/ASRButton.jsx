import React from 'react'
import { Button } from '../ui/button'
import { useASRStore } from '../../stores/asrStore'
import { cn } from '../../lib/utils'

/**
 * ASR语音识别按钮组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外的CSS类名
 * @param {Function} props.onResult - 识别结果回调函数
 * @param {Function} props.onError - 错误回调函数
 * @param {Object} props.webSocket - WebSocket连接对象
 * @param {boolean} props.disabled - 是否禁用按钮
 * @param {string} props.variant - 按钮变体样式
 * @param {string} props.size - 按钮大小
 */
const ASRButton = ({
  className,
  onResult,
  onError,
  webSocket,
  disabled = false,
  variant = "outline",
  size = "default",
  ...props
}) => {
  const {
    recording,
    ui,
    setWebSocket,
    updateUIState
  } = useASRStore()

  // 设置WebSocket连接
  React.useEffect(() => {
    if (webSocket) {
      setWebSocket(webSocket)
    }
  }, [webSocket, setWebSocket])

  // 监听ASR结果事件
  React.useEffect(() => {
    const handleASRResult = (event) => {
      if (onResult) {
        onResult(event.detail.text)
      }
    }

    const handleASRError = (event) => {
      if (onError) {
        onError(event.detail.error)
      }
    }

    window.addEventListener('asrResult', handleASRResult)
    window.addEventListener('asrError', handleASRError)

    return () => {
      window.removeEventListener('asrResult', handleASRResult)
      window.removeEventListener('asrError', handleASRError)
    }
  }, [onResult, onError])

  // 处理按钮点击
  const handleClick = () => {
    // 显示提示信息
    updateUIState({
      statusText: '请使用长按空格键进行语音输入'
    })
    
    console.log('🎤 ASR按钮已禁用，请使用长按空格键进行语音输入')
    
    // 触发通知事件
    const event = new CustomEvent('asrNotification', {
      detail: {
        message: '请使用长按空格键进行语音输入',
        type: 'info'
      }
    })
    window.dispatchEvent(event)
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "relative transition-all duration-200",
        recording.isRecording && "animate-pulse bg-red-500 hover:bg-red-600 text-white",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      title={ui.buttonTitle}
      {...props}
    >
      <span className="text-lg">{ui.buttonText}</span>
      
      {/* 录音状态指示器 */}
      {recording.isRecording && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      )}
    </Button>
  )
}

export default ASRButton
