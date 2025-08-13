import React from 'react'
import { useChatHeaderStore } from '../../stores/chatHeaderStore'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'

/**
 * 音频播放器组件
 * 用于处理TTS音频播放和控制
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.showControls - 是否显示控制按钮
 * @param {boolean} props.showVolume - 是否显示音量控制
 * @param {boolean} props.showSpeed - 是否显示速度控制
 * @param {Function} props.onPlay - 播放回调
 * @param {Function} props.onPause - 暂停回调
 * @param {Function} props.onStop - 停止回调
 */
const AudioPlayer = ({
  className,
  showControls = true,
  showVolume = true,
  showSpeed = false,
  onPlay,
  onPause,
  onStop,
  ...props
}) => {
  const {
    audio,
    stopCurrentAudio,
    setAudioVolume,
    setPlaybackRate,
    playTTSAudio
  } = useChatHeaderStore()

  const [showPlayButton, setShowPlayButton] = React.useState(false)
  const [pendingAudioUrl, setPendingAudioUrl] = React.useState(null)

  // 监听显示播放按钮事件
  React.useEffect(() => {
    const handleShowPlayButton = (event) => {
      setShowPlayButton(true)
      setPendingAudioUrl(event.detail.audioUrl)
    }

    const handleAudioPlayError = (event) => {
      console.error('音频播放错误:', event.detail.error)
    }

    window.addEventListener('showAudioPlayButton', handleShowPlayButton)
    window.addEventListener('audioPlayError', handleAudioPlayError)

    return () => {
      window.removeEventListener('showAudioPlayButton', handleShowPlayButton)
      window.removeEventListener('audioPlayError', handleAudioPlayError)
    }
  }, [])

  // 处理手动播放（用于处理浏览器自动播放限制）
  const handleManualPlay = () => {
    if (pendingAudioUrl) {
      const audio = new Audio(pendingAudioUrl)
      audio.volume = useChatHeaderStore.getState().audio.volume
      audio.play()
      
      audio.onended = () => {
        URL.revokeObjectURL(pendingAudioUrl)
        setShowPlayButton(false)
        setPendingAudioUrl(null)
      }
      
      audio.onerror = () => {
        URL.revokeObjectURL(pendingAudioUrl)
        setShowPlayButton(false)
        setPendingAudioUrl(null)
      }
      
      setShowPlayButton(false)
      setPendingAudioUrl(null)
      
      if (onPlay) {
        onPlay()
      }
    }
  }

  // 处理停止播放
  const handleStop = () => {
    stopCurrentAudio()
    
    if (onStop) {
      onStop()
    }
  }

  // 处理暂停/恢复
  const handlePauseResume = () => {
    if (audio.currentAudio) {
      if (audio.currentAudio.paused) {
        audio.currentAudio.play()
        if (onPlay) onPlay()
      } else {
        audio.currentAudio.pause()
        if (onPause) onPause()
      }
    }
  }

  // 处理音量变化
  const handleVolumeChange = (e) => {
    const volume = parseFloat(e.target.value)
    setAudioVolume(volume)
  }

  // 处理速度变化
  const handleSpeedChange = (e) => {
    const rate = parseFloat(e.target.value)
    setPlaybackRate(rate)
  }

  // 如果需要显示手动播放按钮
  if (showPlayButton) {
    return (
      <div className={cn('flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg', className)}>
        <div className="text-sm text-yellow-700">
          浏览器阻止了自动播放，请手动播放：
        </div>
        <Button
          size="sm"
          onClick={handleManualPlay}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Play className="w-4 h-4 mr-1" />
          播放语音
        </Button>
      </div>
    )
  }

  // 如果没有音频播放且不显示控制，返回null
  if (!audio.isPlaying && !showControls) {
    return null
  }

  return (
    <div className={cn('flex items-center space-x-2', className)} {...props}>
      {/* 播放状态指示器 */}
      {audio.isPlaying && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-600 font-medium">播放中</span>
        </div>
      )}

      {/* 控制按钮 */}
      {showControls && (
        <div className="flex items-center space-x-1">
          {/* 暂停/恢复按钮 */}
          {audio.currentAudio && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePauseResume}
              title={audio.currentAudio.paused ? '恢复播放' : '暂停播放'}
            >
              {audio.currentAudio.paused ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* 停止按钮 */}
          {audio.isPlaying && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
              title="停止播放"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* 音量控制 */}
      {showVolume && (
        <div className="flex items-center space-x-2">
          {audio.volume > 0 ? (
            <Volume2 className="w-4 h-4 text-gray-500" />
          ) : (
            <VolumeX className="w-4 h-4 text-gray-500" />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={audio.volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            title={`音量: ${Math.round(audio.volume * 100)}%`}
          />
          <span className="text-xs text-gray-500 w-8">
            {Math.round(audio.volume * 100)}%
          </span>
        </div>
      )}

      {/* 播放速度控制 */}
      {showSpeed && (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">速度:</span>
          <select
            value={audio.playbackRate}
            onChange={handleSpeedChange}
            className="text-xs border rounded px-1 py-0.5"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
      )}
    </div>
  )
}

export default AudioPlayer
