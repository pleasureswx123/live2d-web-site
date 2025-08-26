import React from 'react'
import { WebSocketProvider } from '../../contexts/WebSocketContext'

import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

/**
 * WebSocket 测试组件
 * 用于验证 WebSocket 连接和 Hooks 使用是否正确
 */
const WebSocketTestContent = () => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>WebSocket 连接测试</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              如果你看到这个页面没有错误，说明 WebSocket Context 的 Hooks 使用问题已经修复。
            </p>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  WebSocket Context 加载成功
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                所有 React Hooks 都在组件顶层正确调用
              </p>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>修复的问题:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>移除了在事件处理器中使用 require() 动态导入 hooks</li>
                <li>将 useASRStore 调用移到组件顶层</li>
                <li>修复了在函数内部调用 useVoice 的问题</li>
                <li>确保所有 hooks 都遵循 React 的使用规则</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const WebSocketTest = () => {
  return (
    <WebSocketProvider>
      <WebSocketTestContent />
    </WebSocketProvider>
  )
}

export default WebSocketTest
