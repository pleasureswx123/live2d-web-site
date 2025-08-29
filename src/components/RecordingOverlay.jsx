import React from 'react'

/**
 * 录音状态覆盖层组件
 * 显示录音状态和动态波形动画
 */
const RecordingOverlay = ({
  isRecording = false,
  className = ""
}) => {
  if (!isRecording) {
    return null
  }

  return (
    <div className={`absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl flex items-center justify-center z-20 backdrop-blur-sm ${className}`}>
      <div className="flex items-center space-x-4 text-red-600">
        {/* 动态波形 */}
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 rounded-full"
              style={{
                height: `${16 + Math.sin(i * 0.5) * 6}px`,
                animation: `wave 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes wave {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.8); }
          }
        `}</style>
        <div className="text-center">
          <div className="font-semibold text-sm">正在录音</div>
          <div className="text-xs opacity-75">松开空格键结束</div>
        </div>
      </div>
    </div>
  )
}

export default RecordingOverlay
