import React from 'react'
import { useASRStore } from '../../stores/asrStore'
import { cn } from '../../lib/utils'

/**
 * ASR状态显示组件
 * 显示语音识别的状态和实时文本
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.showWave - 是否显示音波动画
 * @param {string} props.position - 显示位置 ('top' | 'bottom' | 'center')
 */
const ASRStatus = ({
  className,
  showWave = true,
  position = 'center',
  ...props
}) => {
  const {
    ui,
    recording,
    recognition
  } = useASRStore()

  // 如果不显示状态，返回null
  if (!ui.showStatus) {
    return null
  }

  // 位置样式映射
  const positionStyles = {
    top: 'top-4 left-1/2 transform -translate-x-1/2',
    bottom: 'bottom-4 left-1/2 transform -translate-x-1/2',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  }

  return (
    <div
      className={cn(
        "fixed z-50 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px]",
        positionStyles[position],
        className
      )}
      {...props}
    >
      <div className="flex items-center space-x-3">
        {/* 音波动画指示器 */}
        {showWave && (
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 bg-primary rounded-full animate-pulse",
                    recording.isRecording ? "h-4" : "h-2"
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: recording.isRecording ? '0.6s' : '1s'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 状态文本 */}
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">
            {ui.statusText}
          </div>
          
          {/* 实时识别文本 */}
          {recognition.currentText && (
            <div className="text-xs text-muted-foreground mt-1 break-words">
              {recognition.currentText}
            </div>
          )}
          
          {/* 置信度显示 */}
          {recognition.confidence > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              置信度: {Math.round(recognition.confidence * 100)}%
            </div>
          )}
        </div>

        {/* 录音状态指示器 */}
        {recording.isRecording && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="text-xs text-red-500 font-medium">录音中</span>
          </div>
        )}
      </div>

      {/* 长按空格键提示 */}
      {recording.isSpaceKeyASRActive && (
        <div className="mt-2 text-xs text-muted-foreground text-center border-t pt-2">
          松开空格键完成识别
        </div>
      )}
    </div>
  )
}

export default ASRStatus
