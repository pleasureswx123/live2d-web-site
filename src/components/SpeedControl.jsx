import { useState, useEffect } from 'react'
import { useVoice } from '../contexts/VoiceContext'
import { Slider } from './ui/slider'

const SpeedControl = () => {
  const { currentSpeed, changeSpeed } = useVoice()
  const [displaySpeed, setDisplaySpeed] = useState(currentSpeed)

  // 处理滑块变化
  const handleSpeedChange = (value) => {
    const speed = value[0] // Radix Slider 返回数组
    setDisplaySpeed(speed)
    changeSpeed(speed)
  }

  // 当全局状态变化时同步本地显示
  useEffect(() => {
    setDisplaySpeed(currentSpeed)
  }, [currentSpeed])

  return (
    <div className="speed-control-sidebar  p-4 shadow-lg rounded-xl">
      {/* 标题 */}
      <div className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        🎚️ 语速调节
      </div>

      {/* 滑块容器 */}
      <div className="speed-slider-container mb-4">
        <Slider
          value={[displaySpeed]}
          onValueChange={handleSpeedChange}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
        />

        {/* 标签 */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>慢</span>
          <span>正常</span>
          <span>快</span>
        </div>
      </div>

      {/* 状态显示 */}
      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
        当前: {displaySpeed.toFixed(1)}x
      </div>


    </div>
  )
}

export default SpeedControl
