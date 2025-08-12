import { useState, useEffect } from 'react'
import { useVoice } from '../contexts/VoiceContext'
import { useToast } from './ui/toast'
import { Slider } from './ui/slider'

const SpeedControl = () => {
  const { currentSpeed, changeSpeed, getSpeedDescription } = useVoice()
  const { addToast } = useToast()
  const [displaySpeed, setDisplaySpeed] = useState(currentSpeed)

  // 处理滑块变化
  const handleSpeedChange = (value) => {
    const speed = value[0] // Radix Slider 返回数组
    setDisplaySpeed(speed)
    changeSpeed(speed)

    // to do ... 发送语速调节请求到后端
    // if (ws && ws.readyState === WebSocket.OPEN) {
    //   ws.send(JSON.stringify({
    //     type: 'change_speed',
    //     speed: currentSpeed
    //   }));
    //   console.log(`📤 语速调节请求已发送: ${currentSpeed}`);
    // }

    // 显示通知
    const speedText = getSpeedDescription(speed)
    addToast({
      title: "语速调节",
      description: `语速已调节为: ${speed.toFixed(1)}x (${speedText})`,
      variant: "default",
      duration: 2000
    })
  }

  // 当全局状态变化时同步本地显示
  useEffect(() => {
    setDisplaySpeed(currentSpeed)
  }, [currentSpeed])

  return (
    <div className="speed-control-sidebar">
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
