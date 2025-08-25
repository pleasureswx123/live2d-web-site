import React from 'react'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import UserStatusIndicator from './UserStatusIndicator'

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
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
        <User size={20} className="text-white" />
      </div>
      
      {/* 用户信息 */}
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800 text-lg">{user.name}</h3>
        <p className="text-sm text-gray-500">ID: {user.id}</p>
      </div>
      
      {/* 在线状态指示器 */}
      <UserStatusIndicator session={session} type="icon" />
    </motion.div>
  )
}

export default UserBasicInfo
