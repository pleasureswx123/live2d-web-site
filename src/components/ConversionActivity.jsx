import { useConversionStore } from '../stores/conversionStore'

const ConversionActivity = () => {
  const { activities, clearActivities } = useConversionStore()

  // 格式化时间显示
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="activity-section  p-4 shadow-lg rounded-xl">
      <h4 className="flex items-center justify-between text-lg font-semibold text-gray-800 mb-4">
        <div className="flex items-center">
          <div
            className="activity-section-icon w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm"
            style={{ background: '#e0e7ff', color: '#3730a3' }}
          >
            ⚡
          </div>
          档案转换
        </div>
        {activities.length > 0 && (
          <button
            onClick={clearActivities}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            title="清空记录"
          >
            清空
          </button>
        )}
      </h4>

      <div className="conversion-activity">
        {activities.length === 0 ? (
          <div className="no-data text-center py-6 text-gray-500 text-sm">
            暂无转换活动
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="memory-item bg-gray-50 rounded-lg p-3 border-l-4 border-blue-400"
              >
                <div className="memory-type text-sm font-medium text-blue-700 mb-1">
                  档案转换完成
                </div>
                <div className="memory-content text-sm text-gray-700 mb-2">
                  成功更新 {activity.successful_count}/{activity.total_categories} 个类别
                  {activity.successful_updates.length > 0 && (
                    <div className="mt-1 text-xs text-gray-600">
                      包含: {activity.successful_updates.join(', ')}
                    </div>
                  )}
                </div>
                <div className="activity-timestamp text-xs text-gray-500">
                  {formatTime(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversionActivity
