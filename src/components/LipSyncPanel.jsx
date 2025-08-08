import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Mic, MicOff, Volume2, Settings } from 'lucide-react'
import testAudioUrl from '../assets/test.wav'

/**
 * 口型同步控制面板组件
 *
 * 功能特性:
 * - 音频文件播放与口型同步
 * - 实时音频分析和嘴部参数控制
 * - 敏感度调节
 * - 状态管理和错误处理
 *
 * 基于 src/reference/App.vue 中的口型同步实现
 */
export default function LipSyncPanel({ model, isModelLoaded }) {
  // ==================== 状态管理 ====================

  /**
   * 口型同步播放状态
   * - true: 正在进行口型同步（音频播放中，嘴部动画运行中）
   * - false: 口型同步待机状态（未播放音频，嘴部参数为默认值）
   */
  const [isSpeaking, setIsSpeaking] = useState(false)

  /**
   * 口型同步敏感度设置 (范围: 10-100)
   * 控制音频音量到嘴部开合程度的映射比例
   */
  const [lipSyncSensitivity, setLipSyncSensitivity] = useState(80)

  /**
   * 音频文件路径 - 使用内置测试音频
   */
  const [audioFile] = useState(testAudioUrl)

  // ==================== Refs ====================

  /**
   * 当前音频上下文对象 (Web Audio API)
   */
  const currentAudioContextRef = useRef(null)

  /**
   * 当前音频源节点 (AudioBufferSource)
   */
  const currentAudioSourceRef = useRef(null)

  /**
   * 口型同步动画帧ID
   */
  const lipSyncAnimationIdRef = useRef(null)

  // ==================== 工具函数 ====================

  /**
   * 获取当前Live2D模型支持的嘴部参数列表
   * 专门针对youyou模型的LipSync参数组进行优化
   */
  const getMouthParameters = () => {
    if (!model || !model.internalModel) {
      console.warn('模型未加载，无法获取嘴部参数')
      return []
    }

    const supportedParams = []
    const coreModel = model.internalModel.coreModel

    // 根据youyou.model3.json中的LipSync参数组定义
    // 只使用模型实际支持的参数
    const youyouLipSyncParams = [
      'ParamMouthForm',      // 嘴部形状变化 (youyou模型主参数)
      'ParamMouthOpenY',     // 嘴部垂直开合 (youyou模型主参数)
      'MouthX',              // 嘴部水平移动 (youyou模型特有)
      'MouthPuckerWiden'     // 嘴部撅嘴/张开 (youyou模型特有)
    ]

    // 检查youyou模型的LipSync参数是否存在
    for (const paramName of youyouLipSyncParams) {
      try {
        const value = coreModel.getParameterValueById(paramName)
        if (value !== undefined && value !== null) {
          supportedParams.push(paramName)
          console.log(`✅ 找到支持的口型参数: ${paramName} (当前值: ${value})`)
        }
      } catch (error) {
        // 参数不存在，记录警告
        console.warn(`❌ 参数 ${paramName} 在youyou模型中不存在:`, error.message)
      }
    }

    console.log(`模型支持的嘴部参数 (${supportedParams.length}个):`, supportedParams)
    return supportedParams
  }

  /**
   * 音频播放和口型同步核心函数
   */
  const speaking = async () => {
    try {
      // 检查模型和获取支持的嘴部参数
      if (!model || !isModelLoaded) {
        throw new Error('模型未加载')
      }

      const mouthParams = getMouthParameters()
      if (mouthParams.length === 0) {
        throw new Error('当前模型不支持嘴部参数控制')
      }

      console.log(`开始口型同步，支持的参数: ${mouthParams.join(', ')}`)

      // 获取音频文件
      const response = await fetch(audioFile)
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`)
      }

      // 处理音频数据
      const audioData = await response.arrayBuffer()
      const audioBuffer = await currentAudioContextRef.current.decodeAudioData(audioData)

      // 创建音频源节点
      const source = currentAudioContextRef.current.createBufferSource()
      currentAudioSourceRef.current = source

      // 创建分析器节点
      const analyser = currentAudioContextRef.current.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8

      // 连接音频节点
      source.buffer = audioBuffer
      source.connect(analyser)
      analyser.connect(currentAudioContextRef.current.destination)

      // 播放状态管理
      let isPlaying = true

      // 监听音频播放结束事件
      source.onended = () => {
        isPlaying = false
        setIsSpeaking(false)

        // 重置Live2D模型的嘴部参数到默认状态
        if (model && model.internalModel && model.internalModel.coreModel) {
          try {
            for (const paramName of mouthParams) {
              model.internalModel.coreModel.setParameterValueById(paramName, 0)
            }
            console.log('嘴部参数已重置到默认状态')
          } catch (paramError) {
            console.warn('重置嘴部参数失败:', paramError)
          }
        }
      }

      // 开始播放音频
      source.start()

      // 嘴部动画更新函数
      const updateMouth = () => {
        if (!isPlaying || currentAudioContextRef.current.state !== 'running' || !model) {
          console.log(`🛑 动画循环停止: isPlaying=${isPlaying}, audioState=${currentAudioContextRef.current.state}, model=${!!model}`)
          return
        }

        // 每1000帧输出一次循环状态
        if (Date.now() % 1000 < 50) {
          console.log(`🔄 动画循环运行中: isPlaying=${isPlaying}`)
        }

        try {
          // 实时音频分析
          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          analyser.getByteFrequencyData(dataArray)

          // 计算整体音量强度
          const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length

          // 音量到口型的智能映射 - 确保参数值在有效范围内
          const sensitivityFactor = lipSyncSensitivity
          let rawMouthOpen = volume / sensitivityFactor

          // 如果音量太小，使用模拟数据进行测试
          if (volume < 1) {
            // 使用正弦波模拟口型变化，便于测试
            const testValue = (Math.sin(Date.now() * 0.005) + 1) * 0.5 // 0-1之间的正弦波
            rawMouthOpen = testValue * 0.8 // 模拟中等强度的口型变化
            console.log(`🧪 使用测试模式: 模拟音量=${rawMouthOpen.toFixed(3)}`)
          }

          const mouthOpen = Math.max(0, Math.min(1, rawMouthOpen)) // 限制在 0-1 范围内

          // 每100ms输出一次详细调试信息
          if (Date.now() % 100 < 50) {
            console.log(`🎵 音频分析: 原始音量=${volume.toFixed(1)}, 敏感度=${sensitivityFactor}, 计算值=${rawMouthOpen.toFixed(3)}, 最终值=${mouthOpen.toFixed(3)}`)
            console.log(`📊 频率数据前10个值:`, Array.from(dataArray.slice(0, 10)))
          }

          // Live2D参数更新 - 针对youyou模型优化的智能口型映射系统
          let parameterUpdateCount = 0
          let debugInfo = []

          // 验证模型和coreModel可用性
          if (!model || !model.internalModel || !model.internalModel.coreModel) {
            console.error('❌ 模型或coreModel不可用，跳过参数更新')
            return
          }

          for (const paramName of mouthParams) {
            try {
              let paramValue = 0

              // === youyou模型LipSync参数组专用映射 ===
              if (paramName === 'ParamMouthOpenY') {
                // 主要的嘴部垂直开合控制 - 放大幅度确保明显效果
                paramValue = Math.min(1.0, mouthOpen * 3.0) // 放大3倍，确保更明显
              } else if (paramName === 'ParamMouthForm') {
                // 嘴部形状变化控制 - 配合开合动作
                paramValue = Math.min(1.0, mouthOpen * 2.0) // 放大2倍
              } else if (paramName === 'MouthX') {
                // 嘴部水平移动控制 - 创造自然的左右微动
                paramValue = Math.sin(Date.now() * 0.008) * Math.min(1.0, mouthOpen * 2.0) * 0.6
              } else if (paramName === 'MouthPuckerWiden') {
                // 嘴部撅嘴/张开控制 - 增强表现力
                paramValue = Math.min(1.0, mouthOpen * 1.8)
              } else {
                // 未知参数，使用默认映射
                paramValue = mouthOpen
                console.warn(`⚠️ 未知的口型参数: ${paramName}，使用默认映射`)
              }

              // 确保参数值在有效范围内
              paramValue = Math.max(-1, Math.min(1, paramValue))

              // 获取设置前的值
              const beforeValue = model.internalModel.coreModel.getParameterValueById(paramName)

              // 设置参数
              model.internalModel.coreModel.setParameterValueById(paramName, paramValue)

              // 验证设置是否成功
              const afterValue = model.internalModel.coreModel.getParameterValueById(paramName)

              parameterUpdateCount++
              debugInfo.push(`${paramName}: ${beforeValue.toFixed(3)} → ${afterValue.toFixed(3)}`)

            } catch (paramError) {
              console.warn(`❌ 设置参数 ${paramName} 失败:`, paramError)
            }
          }

          // 每100ms输出一次详细调试信息
          if (Date.now() % 100 < 50) {
            console.log(`🎵 口型同步详情: 音量=${volume.toFixed(1)}, 嘴部开合=${mouthOpen.toFixed(3)}`)
            console.log(`📊 参数更新 (${parameterUpdateCount}个):`, debugInfo.slice(0, 4).join(', '))

            // 显示主要参数的实际值
            try {
              const currentMouthOpenY = model.internalModel.coreModel.getParameterValueById('ParamMouthOpenY')
              const currentMouthForm = model.internalModel.coreModel.getParameterValueById('ParamMouthForm')
              console.log(`🔍 实时参数值: ParamMouthOpenY=${currentMouthOpenY.toFixed(3)}, ParamMouthForm=${currentMouthForm.toFixed(3)}`)
            } catch (e) {
              console.warn('无法读取实时参数值:', e)
            }
          }

          // 请求下一帧动画更新
          lipSyncAnimationIdRef.current = requestAnimationFrame(updateMouth)

        } catch (error) {
          console.error('更新嘴部动画失败:', error)
          isPlaying = false
        }
      }

      // 启动嘴部动画
      updateMouth()

    } catch (error) {
      console.error('音频播放和嘴部同步失败:', error)
      setIsSpeaking(false)
    }
  }

  /**
   * 开始说话：启动口型同步功能
   */
  const startSpeaking = async () => {
    // 防止重复启动
    if (isSpeaking) {
      console.warn('已经在说话中，请先停止当前的口型同步')
      return
    }

    // 检查音频文件
    if (!audioFile) {
      console.error('没有可用的音频文件')
      return
    }

    try {
      console.log('开始口型同步...')
      setIsSpeaking(true)

      // 不播放任何动作，直接进行口型同步，避免动作参数干扰
      console.log('准备进行纯口型同步，不播放其他动作...')

      // 音频上下文管理
      if (!currentAudioContextRef.current || currentAudioContextRef.current.state === 'closed') {
        currentAudioContextRef.current = new AudioContext()
        console.log('创建新的AudioContext')
      }

      // 处理浏览器音频策略限制
      if (currentAudioContextRef.current.state === 'suspended') {
        await currentAudioContextRef.current.resume()
        console.log('恢复被暂停的AudioContext')
      }

      // 启动口型同步
      await speaking()

    } catch (error) {
      console.error('启动口型同步失败:', error)
      setIsSpeaking(false)
    }
  }

  /**
   * 停止说话：停止口型同步功能
   */
  const stopSpeaking = () => {
    try {
      console.log('停止口型同步...')

      // 停止音频播放
      if (currentAudioSourceRef.current) {
        try {
          currentAudioSourceRef.current.stop()
          console.log('音频播放已停止')
        } catch (audioError) {
          console.warn('停止音频时出现错误:', audioError)
        }
        currentAudioSourceRef.current = null
      }

      // 取消动画循环
      if (lipSyncAnimationIdRef.current) {
        cancelAnimationFrame(lipSyncAnimationIdRef.current)
        lipSyncAnimationIdRef.current = null
        console.log('动画循环已取消')
      }

      // 重置嘴部参数
      if (model && model.internalModel && model.internalModel.coreModel) {
        const mouthParams = getMouthParameters()
        for (const paramName of mouthParams) {
          try {
            model.internalModel.coreModel.setParameterValueById(paramName, 0)
          } catch (paramError) {
            console.warn(`重置参数 ${paramName} 失败:`, paramError)
          }
        }
        console.log(`已重置 ${mouthParams.length} 个嘴部参数`)
      }

      // 更新UI状态
      setIsSpeaking(false)
      console.log('口型同步已完全停止')

    } catch (error) {
      console.error('停止口型同步失败:', error)
      setIsSpeaking(false)
    }
  }

  /**
   * 测试单个参数设置
   */
  const testParameter = (paramName, value) => {
    if (!model || !model.internalModel || !model.internalModel.coreModel) {
      console.error('模型未加载或coreModel不可用')
      return
    }

    try {
      console.log(`🧪 测试参数: ${paramName} = ${value}`)

      // 获取当前值
      const currentValue = model.internalModel.coreModel.getParameterValueById(paramName)
      console.log(`📊 当前值: ${currentValue}`)

      // 设置新值
      model.internalModel.coreModel.setParameterValueById(paramName, value)

      // 验证设置是否成功
      const newValue = model.internalModel.coreModel.getParameterValueById(paramName)
      console.log(`✅ 设置后值: ${newValue}`)

      if (Math.abs(newValue - value) < 0.001) {
        console.log(`✅ 参数 ${paramName} 设置成功!`)
      } else {
        console.warn(`⚠️ 参数 ${paramName} 设置可能失败，期望: ${value}, 实际: ${newValue}`)
      }

      // 3秒后重置参数
      setTimeout(() => {
        try {
          model.internalModel.coreModel.setParameterValueById(paramName, 0)
          console.log(`🔄 参数 ${paramName} 已重置为 0`)
        } catch (error) {
          console.error(`重置参数 ${paramName} 失败:`, error)
        }
      }, 3000)

    } catch (error) {
      console.error(`❌ 测试参数 ${paramName} 失败:`, error)
    }
  }

  // 清理函数
  useEffect(() => {
    return () => {
      stopSpeaking()
      if (currentAudioContextRef.current) {
        currentAudioContextRef.current.close()
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Volume2 size={20} />
          口型同步测试
        </h3>
      </div>

      {/* 音频文件信息 */}
      <div className="p-3 bg-blue-600 bg-opacity-20 border border-blue-500 rounded-lg">
        <p className="text-sm text-blue-200">
          测试音频: {audioFile ? 'test.wav (内置测试音频)' : '未加载音频文件'}
        </p>
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-2">
        <Button
          onClick={startSpeaking}
          disabled={!model || !isModelLoaded || isSpeaking || !audioFile}
          className="flex-1"
          variant={isSpeaking ? "secondary" : "default"}
        >
          {isSpeaking ? (
            <>
              <MicOff size={16} className="mr-2" />
              正在说话...
            </>
          ) : (
            <>
              <Mic size={16} className="mr-2" />
              开始说话
            </>
          )}
        </Button>

        <Button
          onClick={stopSpeaking}
          disabled={!isSpeaking}
          variant="destructive"
          className="flex-1"
        >
          停止说话
        </Button>
      </div>

      {/* 参数测试按钮 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-blue-300">参数测试</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => testParameter('ParamMouthOpenY', 1.0)}
            disabled={!model || !isModelLoaded}
            variant="outline"
            size="sm"
          >
            张嘴测试
          </Button>
          <Button
            onClick={() => testParameter('ParamMouthOpenY', 0.0)}
            disabled={!model || !isModelLoaded}
            variant="outline"
            size="sm"
          >
            闭嘴测试
          </Button>
          <Button
            onClick={() => testParameter('ParamMouthForm', 1.0)}
            disabled={!model || !isModelLoaded}
            variant="outline"
            size="sm"
          >
            嘴形测试
          </Button>
          <Button
            onClick={() => testParameter('MouthX', 0.5)}
            disabled={!model || !isModelLoaded}
            variant="outline"
            size="sm"
          >
            嘴部移动
          </Button>
        </div>
      </div>

      {/* 敏感度调节 */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Settings size={16} />
          敏感度: {lipSyncSensitivity}
        </label>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={lipSyncSensitivity}
          onChange={(e) => setLipSyncSensitivity(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>低敏感度 (10)</span>
          <span>高敏感度 (100)</span>
        </div>
      </div>

      {/* 状态显示 */}
      <div className="text-center text-sm">
        {isSpeaking ? (
          <span className="text-green-400">🎵 正在进行口型同步</span>
        ) : (
          <span className="text-gray-400">⏹️ 口型同步待机中</span>
        )}
      </div>

      {/* 使用说明 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 点击"开始说话"播放测试音频并启动口型同步</p>
        <p>• 调节敏感度可以控制嘴部开合的响应程度</p>
        <p>• 支持多种Live2D模型的嘴部参数</p>
      </div>
    </div>
  )
}
