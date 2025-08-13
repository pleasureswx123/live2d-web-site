import React from 'react'
import { useChatHeaderStore } from '../../stores/chatHeaderStore'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { Volume2, VolumeX, Loader2 } from 'lucide-react'

/**
 * 音频测试按钮组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外的CSS类名
 * @param {string} props.variant - 按钮变体
 * @param {string} props.size - 按钮大小
 * @param {boolean} props.disabled - 是否禁用
 * @param {Function} props.onTestStart - 测试开始回调
 * @param {Function} props.onTestSuccess - 测试成功回调
 * @param {Function} props.onTestError - 测试失败回调
 * @param {React.ReactNode} props.children - 自定义内容
 */
const AudioTestButton = ({
  className,
  variant = 'default',
  size = 'sm',
  disabled = false,
  onTestStart,
  onTestSuccess,
  onTestError,
  children,
  ...props
}) => {
  const {
    audio,
    testBrowserAudio
  } = useChatHeaderStore()

  // 监听音频测试事件
  React.useEffect(() => {
    const handleTestSuccess = (event) => {
      if (onTestSuccess) {
        onTestSuccess(event.detail.message)
      }
    }

    const handleTestError = (event) => {
      if (onTestError) {
        onTestError(event.detail.error)
      }
    }

    window.addEventListener('audioTestSuccess', handleTestSuccess)
    window.addEventListener('audioTestError', handleTestError)

    return () => {
      window.removeEventListener('audioTestSuccess', handleTestSuccess)
      window.removeEventListener('audioTestError', handleTestError)
    }
  }, [onTestSuccess, onTestError])

  // 处理测试点击
  const handleTestClick = async () => {
    if (onTestStart) {
      onTestStart()
    }

    await testBrowserAudio()
  }

  // 获取按钮图标
  const getIcon = () => {
    if (audio.isTesting) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }
    
    if (audio.isPlaying) {
      return <Volume2 className="w-4 h-4" />
    }
    
    return <VolumeX className="w-4 h-4" />
  }

  // 获取按钮文本
  const getButtonText = () => {
    if (audio.isTesting) {
      return '测试中...'
    }
    
    if (children) {
      return children
    }
    
    return '🔊 测试音频'
  }

  // 获取按钮状态样式
  const getStatusClass = () => {
    if (audio.isTesting) {
      return 'bg-yellow-500 hover:bg-yellow-600'
    }
    
    if (audio.isPlaying) {
      return 'bg-green-500 hover:bg-green-600'
    }
    
    return 'bg-blue-500 hover:bg-blue-600'
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'transition-all duration-200',
        variant === 'default' && getStatusClass(),
        className
      )}
      onClick={handleTestClick}
      disabled={disabled || audio.isTesting}
      title={audio.isTesting ? '正在测试音频...' : '测试浏览器音频播放能力'}
      {...props}
    >
      {getIcon()}
      <span className="ml-2">{getButtonText()}</span>
    </Button>
  )
}

export default AudioTestButton
