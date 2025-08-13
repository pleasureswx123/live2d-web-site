import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Volume2, VolumeX, Play, Pause, Settings } from 'lucide-react'

/**
 * 音频权限管理组件
 * 处理浏览器自动播放限制，提供用户友好的音频启用体验
 */
const AudioPermissionManager = ({
  onAudioUnlocked,
  onError,
  className = ''
}) => {
  const [audioStatus, setAudioStatus] = useState('unknown') // unknown, blocked, unlocked, failed
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [isTestingAudio, setIsTestingAudio] = useState(false)
  const [pendingAudioCount, setPendingAudioCount] = useState(0)
  
  const audioContextRef = useRef(null)
  const testAudioRef = useRef(null)

  // 检测音频播放能力
  const detectAudioCapability = async () => {
    try {
      // 创建测试音频
      const testAudio = new Audio()
      testAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
      testAudio.volume = 0.01 // 很小的音量
      
      const playPromise = testAudio.play()
      
      if (playPromise !== undefined) {
        await playPromise
        setAudioStatus('unlocked')
        console.log('✅ 音频自动播放可用')
        if (onAudioUnlocked) onAudioUnlocked()
      }
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        setAudioStatus('blocked')
        console.log('🔒 音频自动播放被阻止')
      } else {
        setAudioStatus('failed')
        console.error('❌ 音频测试失败:', error)
        if (onError) onError(error)
      }
    }
  }

  // 初始化音频上下文
  const initializeAudioContext = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      
      // 创建静音缓冲区来解锁音频
      const buffer = audioContextRef.current.createBuffer(1, 1, 22050)
      const source = audioContextRef.current.createBufferSource()
      source.buffer = buffer
      source.connect(audioContextRef.current.destination)
      source.start(0)
      
      return true
    } catch (error) {
      console.error('❌ 音频上下文初始化失败:', error)
      return false
    }
  }

  // 用户手动启用音频
  const handleEnableAudio = async () => {
    setIsTestingAudio(true)
    
    try {
      // 初始化音频上下文
      const contextInitialized = await initializeAudioContext()
      
      if (contextInitialized) {
        // 再次测试音频播放
        await detectAudioCapability()
        
        if (audioStatus === 'unlocked') {
          setShowPermissionDialog(false)
          if (onAudioUnlocked) onAudioUnlocked()
        }
      }
    } catch (error) {
      setAudioStatus('failed')
      if (onError) onError(error)
    } finally {
      setIsTestingAudio(false)
    }
  }

  // 播放测试音频
  const playTestAudio = async () => {
    try {
      if (!testAudioRef.current) {
        testAudioRef.current = new Audio('/test-audio.mp3') // 需要一个测试音频文件
        testAudioRef.current.volume = 0.3
      }
      
      await testAudioRef.current.play()
      console.log('🎵 测试音频播放成功')
    } catch (error) {
      console.error('❌ 测试音频播放失败:', error)
    }
  }

  // 组件挂载时检测音频能力
  useEffect(() => {
    detectAudioCapability()
  }, [])

  // 监听用户交互事件
  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioStatus === 'blocked') {
        detectAudioCapability()
      }
    }

    // 监听各种用户交互事件
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction)
      })
    }
  }, [audioStatus])

  // 获取状态颜色
  const getStatusColor = () => {
    switch (audioStatus) {
      case 'unlocked': return 'default'
      case 'blocked': return 'destructive'
      case 'failed': return 'destructive'
      default: return 'secondary'
    }
  }

  // 获取状态文本
  const getStatusText = () => {
    switch (audioStatus) {
      case 'unlocked': return '音频已启用'
      case 'blocked': return '音频被阻止'
      case 'failed': return '音频失败'
      default: return '检测中...'
    }
  }

  // 获取状态图标
  const getStatusIcon = () => {
    switch (audioStatus) {
      case 'unlocked': return <Volume2 className="w-4 h-4" />
      case 'blocked': return <VolumeX className="w-4 h-4" />
      case 'failed': return <VolumeX className="w-4 h-4" />
      default: return <Settings className="w-4 h-4 animate-spin" />
    }
  }

  return (
    <div className={`audio-permission-manager ${className}`}>
      {/* 音频状态指示器 */}
      <div className="flex items-center space-x-2">
        <Badge variant={getStatusColor()}>
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        
        {pendingAudioCount > 0 && (
          <Badge variant="outline">
            待播放: {pendingAudioCount}
          </Badge>
        )}
      </div>

      {/* 音频被阻止时的提示 */}
      {audioStatus === 'blocked' && (
        <div className="mt-2">
          <Button
            size="sm"
            onClick={() => setShowPermissionDialog(true)}
            className="text-xs"
          >
            启用音频播放
          </Button>
        </div>
      )}

      {/* 权限对话框 */}
      {showPermissionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-center">
                <Volume2 className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                启用音频播放
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                为了播放TTS音频，需要您的授权。这是浏览器的安全策略要求。
              </p>
              
              {pendingAudioCount > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  有 {pendingAudioCount} 个音频等待播放
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleEnableAudio}
                  disabled={isTestingAudio}
                  className="flex-1"
                >
                  {isTestingAudio ? (
                    <>
                      <Settings className="w-4 h-4 mr-2 animate-spin" />
                      启用中...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      启用音频
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={playTestAudio}
                  disabled={isTestingAudio}
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowPermissionDialog(false)}
                  className="flex-1 text-xs"
                >
                  稍后再说
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                我们不会收集任何音频数据，这只是为了启用音频播放功能
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AudioPermissionManager

// 导出音频权限管理钩子
export const useAudioPermission = () => {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [pendingAudio, setPendingAudio] = useState([])
  
  const addPendingAudio = (audioData) => {
    setPendingAudio(prev => [...prev, audioData])
  }
  
  const processPendingAudio = () => {
    if (isUnlocked && pendingAudio.length > 0) {
      pendingAudio.forEach(audioData => {
        // 处理待播放音频
        console.log('处理待播放音频:', audioData)
      })
      setPendingAudio([])
    }
  }
  
  const unlockAudio = () => {
    setIsUnlocked(true)
    processPendingAudio()
  }
  
  return {
    isUnlocked,
    pendingAudio,
    addPendingAudio,
    unlockAudio,
    pendingCount: pendingAudio.length
  }
}
