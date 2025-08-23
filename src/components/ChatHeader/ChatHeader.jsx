import React from 'react'
import { useChatHeaderStore } from '../../stores/chatHeaderStore'
import { cn } from '../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import AudioTestButton from './AudioTestButton'
import ThinkingIndicator from './ThinkingIndicator'
import AudioPlayer from './AudioPlayer'
import { Badge } from '../ui/badge'

/**
 * 聊天头部组件
 *
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外的CSS类名
 * @param {string} props.variant - 样式变体 ('default' | 'compact' | 'minimal')
 * @param {boolean} props.showAvatar - 是否显示头像
 * @param {boolean} props.showModelInfo - 是否显示模型信息
 * @param {boolean} props.showThinkingIndicator - 是否显示思考指示器
 * @param {boolean} props.showAudioTest - 是否显示音频测试按钮
 * @param {boolean} props.showAudioPlayer - 是否显示音频播放器
 * @param {Function} props.onCharacterClick - 角色点击回调
 * @param {Function} props.onModelClick - 模型点击回调
 * @param {React.ReactNode} props.children - 自定义内容
 * @param {React.ReactNode} props.actions - 自定义操作按钮
 */
const ChatHeader = ({
  className,
  variant = 'default',
  showAvatar = true,
  showModelInfo,
  showThinkingIndicator,
  showAudioTest,
  showAudioPlayer = true,
  onCharacterClick,
  onModelClick,
  children,
  actions,
  ...props
}) => {
  const {
    character,
    thinking,
    audio,
    ui,
    updateCharacterInfo
  } = useChatHeaderStore()

  // 使用传入的props或store中的配置
  const finalShowModelInfo = showModelInfo !== undefined ? showModelInfo : ui.showModelInfo
  const finalShowThinkingIndicator = showThinkingIndicator !== undefined ? showThinkingIndicator : ui.showThinkingIndicator
  const finalShowAudioTest = showAudioTest !== undefined ? showAudioTest : ui.showAudioTest

  // 获取角色状态颜色
  const getStatusColor = () => {
    switch (character.status) {
      case 'thinking':
        return 'bg-blue-500'
      case 'speaking':
        return 'bg-green-500'
      case 'offline':
        return 'bg-gray-400'
      case 'online':
      default:
        return 'bg-green-500'
    }
  }

  // 获取角色状态文本
  const getStatusText = () => {
    switch (character.status) {
      case 'thinking':
        return '思考中'
      case 'speaking':
        return '语音中'
      case 'offline':
        return '离线'
      case 'online':
      default:
        return '在线'
    }
  }

  // 获取变体样式
  const getVariantClass = () => {
    switch (variant) {
      case 'compact':
        return 'p-3'
      case 'minimal':
        return 'p-2'
      case 'default':
      default:
        return 'p-4'
    }
  }

  // 处理角色点击
  const handleCharacterClick = () => {
    if (onCharacterClick) {
      onCharacterClick(character)
    }
  }

  // 处理模型点击
  const handleModelClick = () => {
    if (onModelClick) {
      onModelClick(character.model)
    }
  }

  return (
    <div
      className={cn(
        'chat-header bg-background border-b border-border space-y-2',
        getVariantClass(),
        className
      )}
      {...props}
    >
      <div className="flex items-center space-x-3">
        {/* 角色头像 */}
        {showAvatar && (
          <div className="relative">
            <Avatar
              className={cn(
                'cursor-pointer transition-transform hover:scale-105',
                variant === 'compact' ? 'w-8 h-8' :
                  variant === 'minimal' ? 'w-6 h-6' : 'w-10 h-10'
              )}
              onClick={handleCharacterClick}
            >
              <AvatarImage src={character.avatar} alt={character.name}/>
              <AvatarFallback className="font-medium">
                {character.name?.[0]?.toUpperCase() || '悠'}
              </AvatarFallback>
            </Avatar>

            {/* 状态指示器 */}
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                getStatusColor()
              )}
              title={getStatusText()}
            />
          </div>
        )}

        {/* 角色名称和信息 */}
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <h2
              className={cn(
                'font-semibold text-foreground cursor-pointer hover:text-primary transition-colors',
                variant === 'compact' ? 'text-base' :
                  variant === 'minimal' ? 'text-sm' : 'text-lg'
              )}
              onClick={handleCharacterClick}
              title="点击查看角色详情"
            >
              {character.name}
            </h2>

            {/* 状态徽章 */}
            {character.status !== 'online' && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  character.status === 'thinking' && 'bg-blue-100 text-blue-700',
                  character.status === 'speaking' && 'bg-green-100 text-green-700'
                )}
              >
                {getStatusText()}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="hidden flex items-center justify-between space-x-3">
        {/* 模型信息 */}
        {finalShowModelInfo && (
          <div className="flex items-center space-x-2">
              <span
                className={cn(
                  'text-muted-foreground cursor-pointer hover:text-foreground transition-colors',
                  variant === 'minimal' ? 'text-xs' : 'text-sm'
                )}
                onClick={handleModelClick}
                title="点击查看模型详情"
              >
                {character.model}
              </span>

            {/* 思考指示器 */}
            {finalShowThinkingIndicator && (
              <ThinkingIndicator
                variant={variant === 'minimal' ? 'minimal' : 'compact'}
                clickable={true}
              />
            )}
          </div>
        )}
      </div>

      <div className="hidden flex items-center justify-between space-x-2">
        {/* 音频播放器 */}
        {showAudioPlayer && (
          <AudioPlayer
            showControls={variant !== 'minimal'}
            showVolume={variant === 'default'}
            showSpeed={false}
          />
        )}

        {/* 音频测试按钮 */}
        {finalShowAudioTest && (
          <AudioTestButton
            variant="outline"
            size="sm"
          >测试音频</AudioTestButton>
        )}

        {/* 自定义操作按钮 */}
        {actions}
      </div>

      {/* 自定义内容 */}
      {children && (
        <div className="mt-3 pt-3 border-t border-border">
          {children}
        </div>
      )}
    </div>
  )
}
export default ChatHeader
