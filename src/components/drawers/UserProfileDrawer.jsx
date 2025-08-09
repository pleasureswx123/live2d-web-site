import React, { useState, useEffect } from 'react'
import { useUserProfileStore } from '../../stores/userProfileStore'
import { useChatStore } from '../../stores/chatStore'
import { useProactiveChat } from '../../hooks/useProactiveChat'
import { useUserAPI } from '../../hooks/useUserAPI'
import { useProactiveAPI } from '../../hooks/useProactiveAPI'

// 进度条组件
const ProgressBar = ({ percentage, color = 'blue' }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
      style={{ width: `${percentage}%` }}
    />
  </div>
)

// 关键信息状态指示器
const KeyInfoStatus = ({ status, label, value }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'confirmed':
        return { icon: '✅', color: 'green', text: '已确认' }
      case 'pending':
        return { icon: '⏳', color: 'yellow', text: '待确认' }
      case 'unknown':
        return { icon: '❓', color: 'gray', text: '未知' }
      default:
        return { icon: '❓', color: 'gray', text: '未知' }
    }
  }

  const config = getStatusConfig(status)

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        <span>{config.icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-right">
        <div className={`text-${config.color}-600 text-sm`}>{config.text}</div>
        {value && <div className="text-gray-600 text-xs">{value}</div>}
      </div>
    </div>
  )
}

// 用户登录组件
const UserLogin = () => {
  const [username, setUsername] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { currentUserName } = useChatStore()
  const { loginUser, getUserSuggestions, logoutUser } = useUserAPI()

  // 获取用户建议
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (username.length > 0) {
        const userSuggestions = await getUserSuggestions(username)
        setSuggestions(userSuggestions)
      } else {
        setSuggestions([])
      }
    }

    const timeoutId = setTimeout(fetchSuggestions, 300) // 防抖
    return () => clearTimeout(timeoutId)
  }, [username, getUserSuggestions])

  const handleLogin = async (name) => {
    setIsLoading(true)
    try {
      await loginUser(name)
      setUsername('')
      setSuggestions([])
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logoutUser()
  }

  if (currentUserName) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-green-700 font-medium">当前用户</div>
            <div className="text-green-600">{currentUserName}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            注销
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          用户名
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="请输入用户名"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">建议用户：</div>
          {suggestions.map((user, index) => (
            <button
              key={index}
              onClick={() => handleLogin(user.name || user)}
              className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <div className="font-medium">{user.name || user}</div>
              {user.user_id && <div className="text-xs text-gray-500">{user.user_id}</div>}
            </button>
          ))}
        </div>
      )}

      {username && (
        <button
          onClick={() => handleLogin(username)}
          disabled={isLoading}
          className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
        >
          {isLoading ? '登录中...' : '登录'}
        </button>
      )}
    </div>
  )
}

// 档案转换活动列表
const ConversionActivities = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        暂无档案转换活动
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {activities.map((activity) => (
        <div key={activity.id} className="text-xs bg-gray-50 p-2 rounded">
          <div className="font-medium">{activity.type}</div>
          <div className="text-gray-600">{activity.description}</div>
          <div className="text-gray-500">
            {new Date(activity.timestamp).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}

// 主动对话控制组件
const ProactiveChatControl = () => {
  const {
    isEnabled,
    silenceThreshold,
    triggerProactiveChat,
    toggleProactiveChat,
    setSilenceThreshold
  } = useProactiveChat()

  const { setValidatedSilenceTimeout } = useProactiveAPI()

  // 处理沉默阈值变化
  const handleSilenceThresholdChange = async (newThreshold) => {
    setSilenceThreshold(newThreshold)
    // 同步到后端
    await setValidatedSilenceTimeout(newThreshold / 1000) // 转换为秒
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-800">🤖 主动对话</h3>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <div className="font-medium text-gray-700">启用主动对话</div>
          <div className="text-sm text-gray-500">AI会在沉默时主动发起对话</div>
        </div>
        <button
          onClick={() => toggleProactiveChat(!isEnabled)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${isEnabled ? 'bg-blue-500' : 'bg-gray-300'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {isEnabled && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              沉默阈值 ({silenceThreshold / 1000}秒)
            </label>
            <input
              type="range"
              min={10000}
              max={120000}
              step={5000}
              value={silenceThreshold}
              onChange={(e) => handleSilenceThresholdChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <button
            onClick={triggerProactiveChat}
            className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            立即触发主动对话
          </button>
        </div>
      )}
    </div>
  )
}

// 主用户档案抽屉组件
const UserProfileDrawer = () => {
  const {
    profile,
    keyInfo,
    conversionActivities,
    updateProfile,
    resetProfile
  } = useUserProfileStore()

  const { currentUserName } = useChatStore()

  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({
    name: profile.name || '',
    identity: profile.identity || '',
    hobby: profile.hobby || ''
  })

  useEffect(() => {
    setEditData({
      name: profile.name || '',
      identity: profile.identity || '',
      hobby: profile.hobby || ''
    })
  }, [profile])

  const handleSave = () => {
    updateProfile(editData)
    setEditMode(false)
  }

  const handleCancel = () => {
    setEditData({
      name: profile.name || '',
      identity: profile.identity || '',
      hobby: profile.hobby || ''
    })
    setEditMode(false)
  }

  if (!currentUserName) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">👤</div>
          <div className="text-lg font-medium">用户档案</div>
          <div className="text-gray-600 text-sm">请先登录以查看档案信息</div>
        </div>
        <UserLogin />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 用户登录状态 */}
      <UserLogin />

      {/* 档案完成度 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">档案完成度</span>
          <span className="text-blue-600 font-bold">{profile.completionPercentage}%</span>
        </div>
        <ProgressBar percentage={profile.completionPercentage} color="blue" />
      </div>

      {/* 关键信息状态 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">关键信息状态</h3>
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            {editMode ? '取消编辑' : '编辑档案'}
          </button>
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名
              </label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                身份
              </label>
              <input
                type="text"
                value={editData.identity}
                onChange={(e) => setEditData({...editData, identity: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入身份（如：学生、工程师等）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                爱好
              </label>
              <input
                type="text"
                value={editData.hobby}
                onChange={(e) => setEditData({...editData, hobby: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入爱好"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                保存
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <KeyInfoStatus
              status={keyInfo.name.status}
              label="姓名"
              value={keyInfo.name.value || profile.name}
            />
            <KeyInfoStatus
              status={keyInfo.identity.status}
              label="身份"
              value={keyInfo.identity.value || profile.identity}
            />
            <KeyInfoStatus
              status={keyInfo.hobby.status}
              label="爱好"
              value={keyInfo.hobby.value || profile.hobby}
            />
          </div>
        )}
      </div>

      {/* 档案转换活动 */}
      <div className="space-y-3">
        <h3 className="font-medium">档案转换活动</h3>
        <ConversionActivities activities={conversionActivities} />
      </div>

      {/* 主动对话控制 */}
      <div className="border-t border-gray-200 pt-4">
        <ProactiveChatControl />
      </div>

      {/* 操作按钮 */}
      <div className="space-y-2">
        <button
          onClick={resetProfile}
          className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          重置档案
        </button>
      </div>

      {/* 最后更新时间 */}
      {profile.lastUpdated && (
        <div className="text-xs text-gray-500 text-center">
          最后更新：{new Date(profile.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  )
}

export default UserProfileDrawer
