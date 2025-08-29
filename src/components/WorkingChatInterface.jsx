import React from 'react'
import {ChatHeader} from './ChatHeader'
import {ChatMessages} from './ChatMessages'
import ChatInputArea from './ChatInputArea'

/**
 * 完全可用的主聊天界面组件
 * 确保所有功能都能正常工作
 */
const WorkingChatInterface = ({
                                className = '',
                                enableFileUpload = true,
                                enableASR = true,
                                maxMessageLength = 1000,
                                placeholder = "发送消息给悠悠...",
                                ...props
                              }) => {
  return (
    <div
      className={`working-chat-interface flex flex-col h-full bg-background ${className}`}
      {...props}
    >
      {/* 聊天头部 */}
      <div className="flex-shrink-0 border-b">
        <ChatHeader/>
      </div>

      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages className="h-full"/>
      </div>

      {/* 聊天输入区域 */}
      <ChatInputArea
        enableFileUpload={enableFileUpload}
        enableASR={enableASR}
        placeholder={placeholder}
        maxMessageLength={maxMessageLength}
      />
    </div>
  )
}
export default WorkingChatInterface
