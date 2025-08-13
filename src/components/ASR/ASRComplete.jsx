import React from 'react'
import ASRButton from './ASRButton'
import ASRStatus from './ASRStatus'
import ASRProvider from './ASRProvider'
import { useASRStore } from '../../stores/asrStore'

/**
 * 完整的ASR语音识别组件
 * 包含按钮、状态显示和键盘事件处理
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.webSocket - WebSocket连接对象
 * @param {Function} props.onResult - 识别结果回调函数 (text) => void
 * @param {Function} props.onError - 错误回调函数 (error) => void
 * @param {Function} props.onNotification - 通知回调函数 (message, type) => void
 * @param {string} props.targetInputId - 目标输入框ID
 * @param {string} props.buttonVariant - 按钮样式变体
 * @param {string} props.buttonSize - 按钮大小
 * @param {string} props.buttonClassName - 按钮额外CSS类名
 * @param {string} props.statusPosition - 状态显示位置
 * @param {string} props.statusClassName - 状态显示额外CSS类名
 * @param {boolean} props.showWave - 是否显示音波动画
 * @param {boolean} props.disabled - 是否禁用
 * @param {React.ReactNode} props.children - 子组件（可选，用于自定义布局）
 */
const ASRComplete = ({
  webSocket,
  onResult,
  onError,
  onNotification,
  targetInputId = 'messageInput',
  buttonVariant = 'outline',
  buttonSize = 'default',
  buttonClassName,
  statusPosition = 'center',
  statusClassName,
  showWave = true,
  disabled = false,
  children,
  ...props
}) => {
  const { connection } = useASRStore()

  // WebSocket连接状态监听
  React.useEffect(() => {
    if (webSocket) {
      // 监听WebSocket消息
      const handleMessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // 处理ASR相关消息
          switch (data.type) {
            case 'asr_started':
              console.log('🎤 ASR识别已启动')
              break
              
            case 'asr_result':
              // 处理识别结果
              const { text, is_final, confidence } = data
              useASRStore.getState().onASRResult(text, is_final, confidence || 0)
              break
              
            case 'asr_stopped':
              console.log('🎤 ASR识别已停止')
              break
              
            case 'asr_error':
              // 处理识别错误
              const { error } = data
              useASRStore.getState().onASRError(error)
              break
              
            default:
              // 其他消息类型
              break
          }
        } catch (error) {
          console.error('解析WebSocket消息失败:', error)
        }
      }

      webSocket.addEventListener('message', handleMessage)

      return () => {
        webSocket.removeEventListener('message', handleMessage)
      }
    }
  }, [webSocket])

  return (
    <ASRProvider
      targetInputId={targetInputId}
      onResult={onResult}
      onError={onError}
      onNotification={onNotification}
    >
      {children || (
        <>
          <ASRButton
            webSocket={webSocket}
            onResult={onResult}
            onError={onError}
            variant={buttonVariant}
            size={buttonSize}
            className={buttonClassName}
            disabled={disabled}
            {...props}
          />
          <ASRStatus
            position={statusPosition}
            className={statusClassName}
            showWave={showWave}
          />
        </>
      )}
    </ASRProvider>
  )
}

export default ASRComplete
