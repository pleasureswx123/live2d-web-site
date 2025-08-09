import React, { useState, useEffect } from 'react'
import { useUserProfileStore } from '../stores/userProfileStore'
import { useChatStore } from '../stores/chatStore'
import { useSystemStore } from '../stores/systemStore'

// 活动面板组件 - 参考test.html的右侧面板设计
const ActivityPanel = ({ isOpen, onClose }) => {
  const { profile, conversionActivities, conversationStage } = useUserProfileStore()
  const { messages, performanceMetrics } = useChatStore()
  const { errors, notifications } = useSystemStore()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 活动面板 */}
      <div className="relative w-96 bg-white shadow-2xl overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">📊 用户档案 & 记忆活动</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* 用户档案信息 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                👤
              </div>
              <h3 className="font-medium text-blue-900">用户档案</h3>
            </div>

            {/* 档案进度 */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-blue-700">完成度</span>
                <span className="font-medium text-blue-900">{profile?.completionPercentage || 0}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${profile?.completionPercentage || 0}%` }}
                />
              </div>
            </div>

            {/* 档案详情 */}
            {profile && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">姓名</div>
                    <div className="flex items-center gap-2">
                      <span className={profile.keyInfo?.name ? 'text-green-600' : 'text-gray-400'}>
                        {profile.keyInfo?.name ? '✅' : '❌'}
                      </span>
                      <span className="text-sm font-medium">
                        {profile.keyInfo?.name || '未知'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">身份</div>
                    <div className="flex items-center gap-2">
                      <span className={profile.keyInfo?.identity ? 'text-green-600' : 'text-gray-400'}>
                        {profile.keyInfo?.identity ? '✅' : '❌'}
                      </span>
                      <span className="text-sm font-medium">
                        {profile.keyInfo?.identity || '未知'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">爱好</div>
                  <div className="flex items-center gap-2">
                    <span className={profile.keyInfo?.hobbies ? 'text-green-600' : 'text-gray-400'}>
                      {profile.keyInfo?.hobbies ? '✅' : '❌'}
                    </span>
                    <span className="text-sm font-medium">
                      {profile.keyInfo?.hobbies || '未知'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 对话阶段信息 */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                💬
              </div>
              <h3 className="font-medium text-purple-900">对话阶段</h3>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">当前阶段</div>
                <div className="font-medium text-purple-900">{conversationStage?.name || '未知'}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">对话轮数</div>
                  <div className="font-medium">第 {conversationStage?.turnCount || 1} 轮</div>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">控制模式</div>
                  <div className={`text-sm font-medium ${
                    conversationStage?.isManual ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {conversationStage?.isManual ? '手动' : '自动'}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">阶段描述</div>
                <div className="text-sm text-gray-700">{conversationStage?.description || '暂无描述'}</div>
              </div>
            </div>
          </div>

          {/* 记忆活动 */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                🧠
              </div>
              <h3 className="font-medium text-green-900">记忆活动</h3>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {conversionActivities.length > 0 ? (
                conversionActivities.slice(-10).reverse().map((activity, index) => (
                  <div key={index} className="bg-white rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-green-900">
                          {activity.type === 'profile_conversion' ? '档案转换' : activity.type}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {activity.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <div className="text-2xl mb-2">🤔</div>
                  <div className="text-sm">暂无记忆活动</div>
                </div>
              )}
            </div>
          </div>

          {/* 性能监测 */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                ⚡
              </div>
              <h3 className="font-medium text-orange-900">性能监测</h3>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">LLM首字响应</div>
                <div className="font-medium">
                  {performanceMetrics.llmFirstTokenTime
                    ? `${performanceMetrics.llmFirstTokenTime}ms`
                    : '--'
                  }
                </div>
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">TTS首包回复</div>
                <div className="font-medium">
                  {performanceMetrics.ttsFirstPacketTime
                    ? `${performanceMetrics.ttsFirstPacketTime}ms`
                    : '--'
                  }
                </div>
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">端到端延迟</div>
                <div className="font-medium">
                  {performanceMetrics.endToEndTime
                    ? `${performanceMetrics.endToEndTime}ms`
                    : '--'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* 系统通知 */}
          {notifications.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                  🔔
                </div>
                <h3 className="font-medium text-blue-900">最近通知</h3>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {notifications.slice(-5).reverse().map((notification) => (
                  <div key={notification.id} className="bg-white rounded-lg p-2">
                    <div className="text-sm text-gray-700">{notification.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 错误日志 */}
          {errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white">
                  ⚠️
                </div>
                <h3 className="font-medium text-red-900">错误日志</h3>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {errors.slice(-3).reverse().map((error) => (
                  <div key={error.id} className="bg-white rounded-lg p-2">
                    <div className="text-sm text-red-700">{error.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivityPanel
