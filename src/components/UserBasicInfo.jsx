import React from 'react'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import UserStatusIndicator from './UserStatusIndicator'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'

/**
 * 用户基本信息组件
 * @param {object} user - 用户信息对象
 * @param {object} session - 会话信息对象
 * @param {object} props - 其他属性
 */
const UserBasicInfo = ({ user, session, ...props }) => {
  return (
    <motion.div
      className="flex items-center mb-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {/* 用户头像 */}
      <Avatar className="mr-3">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <User size={20} />
        </AvatarFallback>
      </Avatar>

      {/* 用户信息 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-lg truncate">{user.name}</h3>
        <p className="text-sm text-muted-foreground truncate">ID: {user.id}</p>
      </div>

      {/* 在线状态指示器 */}
      <UserStatusIndicator session={session} type="icon" />
    </motion.div>
  )
}

export default UserBasicInfo
