import React from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useSystemStore } from '../../stores/systemStore'

const PerformanceDrawer = () => {
  const { performanceMetrics } = useChatStore()
  const { performance } = useSystemStore()
  
  const formatTime = (time) => {
    if (!time) return '-'
    return `${time}ms`
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">📊</div>
        <div className="text-lg font-medium">性能监测</div>
        <div className="text-gray-600 text-sm">实时监控系统性能指标</div>
      </div>
      
      {/* 当前性能指标 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">当前指标</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-blue-600 font-bold">
              {formatTime(performanceMetrics.llmFirstTokenTime - performanceMetrics.messageStartTime)}
            </div>
            <div className="text-blue-700 text-xs">LLM首字延迟</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-green-600 font-bold">
              {formatTime(performanceMetrics.ttsFirstPacketTime - performanceMetrics.messageStartTime)}
            </div>
            <div className="text-green-700 text-xs">TTS首包延迟</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center col-span-2">
            <div className="text-purple-600 font-bold">
              {formatTime(performanceMetrics.endToEndTime)}
            </div>
            <div className="text-purple-700 text-xs">端到端延迟</div>
          </div>
        </div>
      </div>
      
      {/* 性能历史 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">性能历史</h3>
        <div className="text-center text-gray-500 py-4">
          <div className="text-2xl mb-2">📈</div>
          <div>性能历史图表</div>
          <div className="text-sm">功能开发中...</div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceDrawer
