import React, { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useVoiceStore } from '../../stores/voiceStore'
import { useWebSocket, MESSAGE_TYPES } from '../../hooks/useWebSocket'
import { useASR } from '../../hooks/useASR'
import { useFileAPI } from '../../hooks/useFileAPI'

// 消息组件
const MessageItem = ({ message }) => {
  const isUser = message.type === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`
        max-w-[80%] p-3 rounded-lg
        ${isUser
          ? 'bg-blue-500 text-white rounded-br-none'
          : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }
      `}>
        {/* 文件显示 */}
        {message.fileUrl && (
          <div className="mb-2">
            {message.fileType?.startsWith('image/') ? (
              <img
                src={message.fileUrl}
                alt={message.fileName}
                className="max-w-full h-auto rounded"
                style={{ maxHeight: '200px' }}
              />
            ) : (
              <div className="flex items-center space-x-2 p-2 bg-black/10 rounded">
                <span>📎</span>
                <span className="text-xs">{message.fileName}</span>
              </div>
            )}
          </div>
        )}

        <div className="text-sm">{message.content}</div>

        {message.source && (
          <div className="text-xs opacity-70 mt-1">
            {message.source === 'voice' ? '🎤 语音输入' : '⌨️ 文字输入'}
          </div>
        )}

        <div className="text-xs opacity-70 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

// 打字指示器
const TypingIndicator = () => (
  <div className="flex justify-start mb-4">
    <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
)

// 文件上传组件
const FileUpload = ({ onFileSelect }) => {
  const fileInputRef = useRef(null)
  const { uploadFile, validateFile, getFileInfo } = useFileAPI()
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // 验证文件
    if (!validateFile(file)) {
      return
    }

    setIsUploading(true)
    try {
      // 上传文件
      const result = await uploadFile(file)
      if (result.success) {
        onFileSelect({
          ...result,
          ...getFileInfo(file)
        })
      }
    } catch (error) {
      console.error('文件上传失败:', error)
    } finally {
      setIsUploading(false)
      // 清空input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        disabled={isUploading}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="p-2 text-gray-500 hover:text-gray-700 disabled:text-gray-300 transition-colors"
        title={isUploading ? "上传中..." : "上传文件"}
      >
        {isUploading ? '⏳' : '📎'}
      </button>
    </>
  )
}

// 语音输入按钮
const VoiceInputButton = () => {
  const { isRecording, startRecording, stopRecording } = useASR()
  const [isPressed, setIsPressed] = useState(false)

  const handleMouseDown = async () => {
    setIsPressed(true)
    try {
      await startRecording()
    } catch (error) {
      console.error('开始录音失败:', error)
      setIsPressed(false)
    }
  }

  const handleMouseUp = () => {
    setIsPressed(false)
    stopRecording()
  }

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`
        p-2 rounded-full transition-all duration-200
        ${isPressed || isRecording
          ? 'bg-red-500 text-white scale-110'
          : 'text-gray-500 hover:text-gray-700'
        }
      `}
      title="长按录音"
    >
      🎤
    </button>
  )
}

// 主聊天抽屉组件
const ChatDrawer = () => {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const {
    messages,
    currentBotMessage,
    isTyping,
    currentFile,
    setCurrentFile,
    currentUserId,
    addMessage
  } = useChatStore()

  const { asr } = useVoiceStore()
  const { sendMessage, isConnected } = useWebSocket()
  const { isRecording: asrRecording, currentText: asrCurrentText, bestText: asrBestText } = useASR()

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentBotMessage, isTyping])

  // 处理发送消息
  const handleSendMessage = () => {
    if (!inputText.trim() || !isConnected) return

    const messageData = {
      type: MESSAGE_TYPES.MESSAGE,
      content: inputText.trim(),
      user_id: currentUserId
    }

    // 如果有文件，添加文件URL
    if (currentFile && currentFile.fileUrl) {
      messageData.image_url = currentFile.fileUrl
    }

    sendMessage(messageData)

    // 添加到本地消息历史
    addMessage({
      type: 'user',
      content: inputText.trim(),
      source: 'text',
      fileUrl: currentFile?.fileUrl,
      fileName: currentFile?.fileName,
      fileType: currentFile?.fileType
    })

    setInputText('')
    setCurrentFile(null)
    inputRef.current?.focus()
  }

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 处理文件选择
  const handleFileSelect = (file) => {
    setCurrentFile(file)
    // TODO: 实现文件上传逻辑
  }

  // 显示ASR识别的文本
  useEffect(() => {
    if (asrBestText && asrBestText !== inputText) {
      setInputText(asrBestText)
    }
  }, [asrBestText, inputText])

  return (
    <div className="flex flex-col h-full">
      {/* 连接状态提示 */}
      {!isConnected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="text-red-700 text-sm">
            ⚠️ 未连接到服务器，请检查网络连接
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-2">💬</div>
            <div>开始对话吧！</div>
            <div className="text-sm mt-2">
              你可以输入文字或长按麦克风按钮进行语音输入
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))
        )}

        {/* 当前机器人消息 */}
        {currentBotMessage && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-800 rounded-bl-none">
              <div className="text-sm">{currentBotMessage}</div>
              <div className="text-xs opacity-70 mt-1">正在输入...</div>
            </div>
          </div>
        )}

        {/* 打字指示器 */}
        {isTyping && !currentBotMessage && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* 当前文件显示 */}
      {currentFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-blue-700 text-sm">
              📎 {currentFile.name}
            </div>
            <button
              onClick={() => setCurrentFile(null)}
              className="text-blue-500 hover:text-blue-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ASR状态显示 */}
      {asrRecording && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="text-red-700 text-sm flex items-center">
            <span className="animate-pulse mr-2">🎤</span>
            正在录音... {asrCurrentText && `"${asrCurrentText}"`}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-end space-x-2">
          <FileUpload onFileSelect={handleFileSelect} />

          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "输入消息..." : "等待连接..."}
              disabled={!isConnected}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          <VoiceInputButton />

          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || !isConnected}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            发送
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          按 Enter 发送，Shift + Enter 换行，长按空格键语音输入
        </div>
      </div>
    </div>
  )
}

export default ChatDrawer
