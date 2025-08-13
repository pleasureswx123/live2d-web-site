import React from 'react'
import { cn } from '../../lib/utils'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Search, Loader2 } from 'lucide-react'

/**
 * 搜索指示器组件
 * 显示搜索状态和进度
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.query - 搜索查询
 * @param {string} props.className - 额外的CSS类名
 * @param {boolean} props.showAvatar - 是否显示头像
 * @param {string} props.variant - 样式变体 ('default' | 'compact')
 * @param {React.ReactNode} props.children - 自定义内容
 */
const SearchIndicator = ({
  query,
  className,
  showAvatar = true,
  variant = 'default',
  children,
  ...props
}) => {
  // 获取变体样式
  const getVariantClass = () => {
    switch (variant) {
      case 'compact':
        return 'p-2'
      case 'default':
      default:
        return 'p-4'
    }
  }

  // 获取头像大小
  const getAvatarSize = () => {
    switch (variant) {
      case 'compact':
        return 'w-6 h-6'
      case 'default':
      default:
        return 'w-8 h-8'
    }
  }

  return (
    <div
      className={cn(
        'search-indicator flex items-center justify-center',
        getVariantClass(),
        className
      )}
      {...props}
    >
      <div className="flex items-start space-x-3 max-w-md">
        {/* 搜索头像 */}
        {showAvatar && (
          <Avatar className={cn('flex-shrink-0', getAvatarSize())}>
            <AvatarFallback className="bg-blue-100 text-blue-600">
              <Search className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}

        {/* 搜索内容 */}
        <div className="flex-1">
          <div className="bg-muted rounded-lg p-3 shadow-sm">
            {children || (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-muted-foreground">
                  正在搜索"{query}"...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchIndicator
