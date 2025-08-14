import React, { useState, useEffect } from 'react'
import { useASRStore } from '../stores/asrStore'
import { useWebSocket } from '../contexts/WebSocketContext'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

/**
 * ASR标点符号处理测试组件
 * 专门测试中文语音识别中的标点符号处理问题
 */
const ASRPunctuationTest = () => {
  const [testResults, setTestResults] = useState([])
  const [currentTest, setCurrentTest] = useState('')

  const {
    recording,
    recognition,
    startContinuousASR,
    stopContinuousASR,
    updateConnectionFromContext,
    onASRResult
  } = useASRStore()

  const { connectionStatus, wsRef } = useWebSocket()

  // 同步WebSocket连接状态
  useEffect(() => {
    if (updateConnectionFromContext) {
      updateConnectionFromContext(wsRef, connectionStatus)
    }
  }, [connectionStatus, wsRef, updateConnectionFromContext])

  // 监听ASR事件
  useEffect(() => {
    const handleASRResult = (event) => {
      const { text, mode } = event.detail
      addTestResult(`结果: "${text}" (${mode || 'normal'})`, 'success')
    }

    const handleASRInputUpdate = (event) => {
      const { text, mode } = event.detail
      addTestResult(`输入更新: "${text}" (${mode})`, 'info')
    }

    window.addEventListener('asrResult', handleASRResult)
    window.addEventListener('asrInputUpdate', handleASRInputUpdate)

    return () => {
      window.removeEventListener('asrResult', handleASRResult)
      window.removeEventListener('asrInputUpdate', handleASRInputUpdate)
    }
  }, [])

  const addTestResult = (message, type) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestResults(prev => [...prev.slice(-19), { message, type, timestamp }])
  }

  // 模拟ASR结果的测试函数
  const simulateASRResult = (text, isFinal = false, confidence = 0.9) => {
    console.log('🧪 模拟ASR结果:', text, 'final:', isFinal)
    onASRResult(text, isFinal, confidence)
    addTestResult(`模拟: "${text}" (final: ${isFinal})`, 'test')
  }

  // 测试场景
  const testScenarios = [
    {
      name: '问句测试',
      description: '测试"你是做什么工作的？"',
      steps: [
        { text: '你是', isFinal: false },
        { text: '你是做什么', isFinal: false },
        { text: '你是做什么工作的', isFinal: false },
        { text: '你是做什么工作的？', isFinal: true }
      ]
    },
    {
      name: '纯标点符号测试',
      description: '测试只返回标点符号的情况',
      steps: [
        { text: '？', isFinal: true }
      ]
    },
    {
      name: '感叹句测试',
      description: '测试"太好了！"',
      steps: [
        { text: '太好', isFinal: false },
        { text: '太好了', isFinal: false },
        { text: '太好了！', isFinal: true }
      ]
    },
    {
      name: '复杂句子测试',
      description: '测试"今天天气真不错，你觉得呢？"',
      steps: [
        { text: '今天天气', isFinal: false },
        { text: '今天天气真不错', isFinal: false },
        { text: '今天天气真不错，', isFinal: false },
        { text: '今天天气真不错，你觉得呢', isFinal: false },
        { text: '今天天气真不错，你觉得呢？', isFinal: true }
      ]
    }
  ]

  const runTest = async (scenario) => {
    setCurrentTest(scenario.name)
    addTestResult(`开始测试: ${scenario.name}`, 'test')
    
    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i]
      await new Promise(resolve => setTimeout(resolve, 500)) // 延迟500ms
      simulateASRResult(step.text, step.isFinal)
    }
    
    setCurrentTest('')
    addTestResult(`完成测试: ${scenario.name}`, 'test')
  }

  const clearResults = () => {
    setTestResults([])
  }

  const getResultColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600'
      case 'test': return 'text-blue-600'
      case 'info': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>ASR标点符号处理测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 当前状态 */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">连接状态:</span>
              <div className={connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
                {connectionStatus}
              </div>
            </div>
            <div>
              <span className="font-medium">录音状态:</span>
              <div className={recording.isRecording ? 'text-red-600' : 'text-gray-600'}>
                {recording.isRecording ? '录音中' : '未录音'}
              </div>
            </div>
            <div>
              <span className="font-medium">当前测试:</span>
              <div className="text-blue-600">{currentTest || '无'}</div>
            </div>
          </div>

          {/* 识别状态显示 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">当前识别文本:</div>
              <div className="p-2 bg-gray-50 rounded border min-h-[40px]">
                {recognition.currentText || '无'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">最佳识别文本:</div>
              <div className="p-2 bg-blue-50 rounded border min-h-[40px]">
                {recognition.bestText || '无'}
              </div>
            </div>
          </div>

          {/* 测试按钮 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">自动测试场景:</div>
            <div className="grid grid-cols-2 gap-2">
              {testScenarios.map((scenario, index) => (
                <Button
                  key={index}
                  onClick={() => runTest(scenario)}
                  disabled={currentTest !== ''}
                  variant="outline"
                  className="text-left h-auto p-3"
                >
                  <div>
                    <div className="font-medium">{scenario.name}</div>
                    <div className="text-xs text-gray-500">{scenario.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* 手动控制 */}
          <div className="flex space-x-2">
            <Button
              onClick={recording.isContinuousMode ? stopContinuousASR : startContinuousASR}
              variant={recording.isContinuousMode ? "default" : "outline"}
            >
              {recording.isContinuousMode ? '停止持续ASR' : '开始持续ASR'}
            </Button>
            <Button onClick={clearResults} variant="ghost">
              清除结果
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 测试结果日志 */}
      <Card>
        <CardHeader>
          <CardTitle>测试结果日志</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-gray-500 text-sm">暂无测试结果</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-gray-400 text-xs min-w-[60px]">{result.timestamp}</span>
                  <span className={getResultColor(result.type)}>{result.message}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>1. 点击自动测试场景按钮来模拟不同的ASR结果</div>
          <div>2. 观察"当前识别文本"和"最佳识别文本"的变化</div>
          <div>3. 检查测试结果日志中的处理过程</div>
          <div>4. 也可以使用"开始持续ASR"进行真实语音测试</div>
          <div>5. 重点关注标点符号（？！。，）的处理是否正确</div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ASRPunctuationTest
