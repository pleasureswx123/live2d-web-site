import { useProfileStore } from '../stores/profileStore'

const UserProfile = () => {
  const {
    completion_rate,
    key_info_status,
    key_info_summary,
    getCompletionPercentage,
    hasAnyDetails,
    resetProfile
  } = useProfileStore()

  // 状态徽章组件
  const StatusBadge = ({ isCollected, label }) => (
    <span 
      className={`status-badge px-2 py-1 rounded-full text-xs font-medium ${
        isCollected 
          ? 'bg-green-100 text-green-800 status-collected' 
          : 'bg-yellow-100 text-yellow-800 status-pending'
      }`}
    >
      {isCollected ? '已收集' : '待收集'}
    </span>
  )

  // 信息项组件
  const InfoItem = ({ label, value, show = true }) => {
    if (!show || !value || value === '') return null
    
    return (
      <div className="info-item flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
        <span className="info-label text-sm font-medium text-gray-600">{label}</span>
        <span className="info-value text-sm text-gray-900">
          {Array.isArray(value) ? value.join(', ') : value}
        </span>
      </div>
    )
  }

  const completionPercentage = getCompletionPercentage()
  const showDetails = hasAnyDetails()

  return (
    <div className="activity-section">
      <h4 className="flex items-center justify-between text-lg font-semibold text-gray-800 mb-4">
        <div className="flex items-center">
          <div 
            className="activity-section-icon w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm"
            style={{ background: '#dbeafe', color: '#1e40af' }}
          >
            👤
          </div>
          用户档案
        </div>
        {(completion_rate > 0 || showDetails) && (
          <button
            onClick={resetProfile}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            title="重置档案"
          >
            重置
          </button>
        )}
      </h4>

      {/* 进度条 */}
      <div className="profile-progress mb-4">
        <div className="progress-bar bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="progress-fill bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="progress-text flex justify-between text-sm">
          <span className="text-gray-600">完成度</span>
          <span className="font-medium text-gray-900">{completionPercentage}%</span>
        </div>
      </div>

      {/* 关键信息收集状态 */}
      <div className="profile-info space-y-3 mb-4">
        <div className="info-item flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="info-label text-sm font-medium text-gray-600">姓名</span>
          <StatusBadge isCollected={key_info_status.name} />
        </div>
        <div className="info-item flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="info-label text-sm font-medium text-gray-600">身份/职业</span>
          <StatusBadge isCollected={key_info_status.identity} />
        </div>
        <div className="info-item flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
          <span className="info-label text-sm font-medium text-gray-600">兴趣爱好</span>
          <StatusBadge isCollected={key_info_status.hobbies} />
        </div>
      </div>

      {/* 详细档案信息 */}
      {showDetails && (
        <div className="profile-details space-y-3 pt-3 border-t border-gray-200">
          <InfoItem 
            label="姓名" 
            value={key_info_summary.name}
            show={!!key_info_summary.name}
          />
          <InfoItem 
            label="年龄" 
            value={key_info_summary.age}
            show={!!key_info_summary.age}
          />
          <InfoItem 
            label="位置" 
            value={key_info_summary.location}
            show={!!key_info_summary.location}
          />
          <InfoItem 
            label="职业" 
            value={key_info_summary.career}
            show={!!key_info_summary.career}
          />
          <InfoItem 
            label="兴趣" 
            value={key_info_summary.primary_interests}
            show={key_info_summary.primary_interests && 
                  (Array.isArray(key_info_summary.primary_interests) 
                    ? key_info_summary.primary_interests.length > 0 
                    : !!key_info_summary.primary_interests)}
          />
        </div>
      )}
    </div>
  )
}

export default UserProfile
