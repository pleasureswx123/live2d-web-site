import React from 'react'
import { useUserProfileStore } from '../../stores/userProfileStore'

const MemoryActivityDrawer = () => {
  const { memoryActivities, proactiveChat } = useUserProfileStore()
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">🧠</div>
        <div className="text-lg font-medium">记忆活动</div>
        <div className="text-gray-600 text-sm">查看AI的记忆和学习活动</div>
      </div>
      
      {/* 记忆活动列表 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">记忆活动</h3>
        {memoryActivities.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <div className="text-2xl mb-2">💭</div>
            <div>暂无记忆活动</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {memoryActivities.map((activity) => (
              <div key={activity.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm font-medium">{activity.type}</div>
                <div className="text-gray-600 text-xs mt-1">{activity.description}</div>
                <div className="text-gray-500 text-xs mt-1">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 主动对话历史 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">主动对话历史</h3>
        {proactiveChat.proactiveHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <div className="text-2xl mb-2">💬</div>
            <div>暂无主动对话</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {proactiveChat.proactiveHistory.map((item) => (
              <div key={item.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-blue-700 text-sm">{item.message}</div>
                <div className="text-blue-600 text-xs mt-1">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MemoryActivityDrawer
