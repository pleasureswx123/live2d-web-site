import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Volume2, VolumeX, Play, Pause, AlertCircle } from 'lucide-react'
import { playAudioFromBase64, getAudioStatus, unlockAudio, showAudioPrompt } from '../../utils/audioUtils'

/**
 * 音频播放示例组件
 * 展示如何解决浏览器自动播放限制问题
 */
const AudioPlaybackExample = () => {
  const [audioStatus, setAudioStatus] = useState(getAudioStatus())
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState(null)
  const [testResults, setTestResults] = useState([])

  // 定期更新音频状态
  useEffect(() => {
    const updateStatus = () => {
      setAudioStatus(getAudioStatus())
    }

    const interval = setInterval(updateStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  // 测试音频数据（一个简短的音频文件的Base64编码）
  const testAudioBase64 = 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'

  // 播放测试音频
  const playTestAudio = async () => {
    try {
      setIsPlaying(true)
      addTestResult('开始播放测试音频...', 'info')

      const audio = await playAudioFromBase64(testAudioBase64, 'wav', 0.5)
      setCurrentAudio(audio)

      audio.onended = () => {
        setIsPlaying(false)
        setCurrentAudio(null)
        addTestResult('音频播放完成', 'success')
      }

      audio.onerror = (error) => {
        setIsPlaying(false)
        setCurrentAudio(null)
        addTestResult(`音频播放错误: ${error.message}`, 'error')
      }

      addTestResult('音频播放成功启动', 'success')

    } catch (error) {
      setIsPlaying(false)
      addTestResult(`播放失败: ${error.message}`, 'error')

      // 如果是自动播放被阻止，显示提示
      if (error.name === 'NotAllowedError') {
        addTestResult('检测到自动播放限制，显示用户提示', 'warning')
      }
    }
  }

  // 停止播放
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      setCurrentAudio(null)
      setIsPlaying(false)
      addTestResult('音频播放已停止', 'info')
    }
  }

  // 手动解锁音频
  const handleUnlockAudio = async () => {
    try {
      addTestResult('尝试解锁音频...', 'info')
      const success = await unlockAudio()
      
      if (success) {
        addTestResult('音频解锁成功！', 'success')
      } else {
        addTestResult('音频解锁失败', 'error')
      }
    } catch (error) {
      addTestResult(`解锁失败: ${error.message}`, 'error')
    }
  }

  // 显示音频提示
  const handleShowPrompt = () => {
    addTestResult('显示音频权限提示', 'info')
    
    showAudioPrompt(
      (success) => {
        if (success) {
          addTestResult('用户启用了音频播放', 'success')
        } else {
          addTestResult('音频启用失败', 'error')
        }
      },
      () => {
        addTestResult('用户取消了音频启用', 'warning')
      }
    )
  }

  // 添加测试结果
  const addTestResult = (message, type) => {
    const result = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }
    
    setTestResults(prev => [...prev, result].slice(-10)) // 只保留最近10条
  }

  // 清除测试结果
  const clearResults = () => {
    setTestResults([])
  }

  // 获取状态颜色
  const getStatusColor = (type) => {
    switch (type) {
      case 'success': return 'default'
      case 'error': return 'destructive'
      case 'warning': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="audio-playback-example max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5" />
            <span>音频播放测试</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 音频状态显示 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">状态:</span>
              <Badge variant={audioStatus.isUnlocked ? "default" : "destructive"}>
                {audioStatus.isUnlocked ? (
                  <>
                    <Volume2 className="w-3 h-3 mr-1" />
                    已解锁
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3 h-3 mr-1" />
                    受限制
                  </>
                )}
              </Badge>
            </div>
            
            {audioStatus.pendingCount > 0 && (
              <Badge variant="outline">
                待播放: {audioStatus.pendingCount}
              </Badge>
            )}
            
            {audioStatus.hasAudioContext && (
              <Badge variant="outline">
                上下文: {audioStatus.audioContextState}
              </Badge>
            )}
          </div>

          {/* 控制按钮 */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={playTestAudio}
              disabled={isPlaying}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>播放测试音频</span>
            </Button>

            <Button
              onClick={stopAudio}
              disabled={!isPlaying}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Pause className="w-4 h-4" />
              <span>停止播放</span>
            </Button>

            <Button
              onClick={handleUnlockAudio}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Volume2 className="w-4 h-4" />
              <span>手动解锁</span>
            </Button>

            <Button
              onClick={handleShowPrompt}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span>显示提示</span>
            </Button>
          </div>

          {/* 说明文字 */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>使用说明:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>首次访问页面时，音频播放可能被浏览器阻止</li>
              <li>点击"播放测试音频"测试当前状态</li>
              <li>如果播放失败，会自动显示用户授权提示</li>
              <li>也可以手动点击"手动解锁"或"显示提示"</li>
              <li>一旦用户交互后，后续音频可以自动播放</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 测试结果 */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>测试结果</CardTitle>
              <Button onClick={clearResults} variant="outline" size="sm">
                清除
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {testResults.map(result => (
                <div
                  key={result.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(result.type)}>
                      {result.type}
                    </Badge>
                    <span>{result.message}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {result.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 解决方案说明 */}
      <Card>
        <CardHeader>
          <CardTitle>解决方案说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            <h4 className="font-medium mb-2">🔒 问题原因:</h4>
            <p>现代浏览器为了防止恶意网站自动播放音频，实施了自动播放策略。音频只能在用户交互后播放。</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">✅ 解决方案:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>检测自动播放能力</li>
              <li>在用户交互时解锁音频上下文</li>
              <li>提供友好的用户提示界面</li>
              <li>将被阻止的音频加入待播放队列</li>
              <li>解锁后自动播放队列中的音频</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">🎯 最佳实践:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>在页面加载时就尝试解锁音频</li>
              <li>监听用户的第一次交互</li>
              <li>提供清晰的音频状态指示</li>
              <li>优雅地处理播放失败</li>
              <li>给用户明确的启用音频选项</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AudioPlaybackExample
