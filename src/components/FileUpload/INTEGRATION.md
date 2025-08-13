# FileUpload组件集成指南

本指南说明如何将文件上传组件集成到现有的Live2D项目中。

## 快速集成

### 1. 在聊天界面中添加附件功能

```jsx
// 在你的聊天组件中
import { FileUploadButton, FilePreview } from '@/components/FileUpload'

function ChatInterface() {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState([])

  const handleFileSelect = (file) => {
    setAttachments(prev => [...prev, file])
  }

  const sendMessage = () => {
    const messageData = {
      text: message,
      attachments: attachments
    }
    
    // 发送消息逻辑
    console.log('发送消息:', messageData)
    
    // 清空输入
    setMessage('')
    setAttachments([])
  }

  return (
    <div className="chat-interface">
      {/* 消息列表 */}
      <div className="messages">
        {/* 消息内容 */}
      </div>
      
      {/* 输入区域 */}
      <div className="input-area flex items-center space-x-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入消息..."
          className="flex-1 px-3 py-2 border rounded"
        />
        
        {/* 附件按钮 */}
        <FileUploadButton
          size="sm"
          icon="paperclip"
          onFileSelect={handleFileSelect}
          acceptedTypes={['image/*', '.pdf', '.txt', '.doc', '.docx']}
          maxFileSize={10 * 1024 * 1024} // 10MB
        />
        
        <button onClick={sendMessage}>发送</button>
      </div>
      
      {/* 文件预览 */}
      <FilePreview position="inline" />
    </div>
  )
}
```

### 2. 在设置页面中添加头像上传

```jsx
import { FileUploadComplete } from '@/components/FileUpload'

function UserSettings() {
  const [avatar, setAvatar] = useState(null)

  const handleAvatarUpload = async (file, onProgress) => {
    const formData = new FormData()
    formData.append('avatar', file)
    
    try {
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      setAvatar(result.url)
      return result
    } catch (error) {
      throw new Error('头像上传失败')
    }
  }

  return (
    <div className="settings">
      <h2>个人设置</h2>
      
      <div className="avatar-section">
        <h3>头像</h3>
        <FileUploadComplete
          mode="dropzone"
          acceptedTypes={['image/*']}
          maxFileSize={2 * 1024 * 1024} // 2MB
          onUpload={handleAvatarUpload}
          autoUpload={true}
          text="点击或拖拽上传头像"
          subText="支持 JPG、PNG 格式，最大 2MB"
        />
      </div>
    </div>
  )
}
```

### 3. 在文档管理中使用

```jsx
import { FileDropZone, FilePreview, useFileUploadStore } from '@/components/FileUpload'

function DocumentManager() {
  const [documents, setDocuments] = useState([])
  const { files, startUpload } = useFileUploadStore()

  const uploadDocument = async (file, onProgress) => {
    // 模拟上传进度
    for (let i = 0; i <= 100; i += 10) {
      onProgress(i)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    const result = {
      id: Date.now(),
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
      uploadTime: new Date()
    }
    
    setDocuments(prev => [...prev, result])
    return result
  }

  const handleFileSelect = (file) => {
    console.log('选择文档:', file.name)
  }

  return (
    <div className="document-manager">
      <h2>文档管理</h2>
      
      {/* 上传区域 */}
      <FileDropZone
        onFileSelect={handleFileSelect}
        acceptedTypes={['.pdf', '.doc', '.docx', '.txt']}
        maxFileSize={50 * 1024 * 1024} // 50MB
        text="拖拽文档到此处"
        subText="支持 PDF、Word、文本文件"
      />
      
      {/* 预览和上传 */}
      <div className="upload-section">
        <FilePreview showUploadStatus={true} />
        
        {files.current && (
          <button
            onClick={() => startUpload(uploadDocument)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            开始上传
          </button>
        )}
      </div>
      
      {/* 文档列表 */}
      <div className="documents-list mt-6">
        <h3>已上传文档</h3>
        {documents.map(doc => (
          <div key={doc.id} className="document-item p-3 border rounded mb-2">
            <div className="font-medium">{doc.name}</div>
            <div className="text-sm text-gray-500">
              {(doc.size / 1024).toFixed(1)} KB - {doc.uploadTime.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 与现有状态管理集成

### 与Zustand Store集成

```jsx
// 在你的主store中
import { create } from 'zustand'

export const useAppStore = create((set, get) => ({
  // 现有状态
  user: null,
  messages: [],
  
  // 文件相关状态
  attachments: [],
  
  // 添加附件
  addAttachment: (file) => {
    set((state) => ({
      attachments: [...state.attachments, {
        id: Date.now(),
        file,
        name: file.name,
        size: file.size,
        type: file.type
      }]
    }))
  },
  
  // 移除附件
  removeAttachment: (id) => {
    set((state) => ({
      attachments: state.attachments.filter(att => att.id !== id)
    }))
  },
  
  // 发送消息（包含附件）
  sendMessage: (text) => {
    const { attachments } = get()
    const message = {
      id: Date.now(),
      text,
      attachments: attachments.map(att => ({
        name: att.name,
        size: att.size,
        type: att.type
      })),
      timestamp: new Date()
    }
    
    set((state) => ({
      messages: [...state.messages, message],
      attachments: [] // 清空附件
    }))
  }
}))

// 在组件中使用
function ChatWithStore() {
  const { addAttachment, removeAttachment, sendMessage, attachments } = useAppStore()

  return (
    <div>
      <FileUploadButton
        onFileSelect={(file) => addAttachment(file.file)}
      />
      
      {/* 显示附件列表 */}
      {attachments.map(att => (
        <div key={att.id} className="attachment-item">
          <span>{att.name}</span>
          <button onClick={() => removeAttachment(att.id)}>移除</button>
        </div>
      ))}
    </div>
  )
}
```

## 服务器端集成

### Express.js 后端示例

```javascript
const express = require('express')
const multer = require('multer')
const path = require('path')

const app = express()

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  }
})

// 文件上传端点
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有文件上传' })
  }
  
  res.json({
    id: Date.now(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    url: `/uploads/${req.file.filename}`
  })
})

// 错误处理
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小超过限制' })
    }
  }
  
  res.status(500).json({ error: error.message })
})
```

### FastAPI 后端示例

```python
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import shutil
import os
from datetime import datetime

app = FastAPI()

UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".txt"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    # 检查文件大小
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小超过限制")
    
    # 检查文件类型
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="不支持的文件类型")
    
    # 生成唯一文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # 保存文件
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return JSONResponse({
        "id": timestamp,
        "filename": filename,
        "originalName": file.filename,
        "size": file.size,
        "mimetype": file.content_type,
        "url": f"/uploads/{filename}"
    })
```

## 错误处理和用户反馈

### 全局错误处理

```jsx
import { useFileUploadStore } from '@/components/FileUpload'
import { useToast } from '@/components/ui/toast'

function FileUploadWithToast() {
  const { error } = useFileUploadStore()
  const { toast } = useToast()

  // 监听错误状态变化
  React.useEffect(() => {
    if (error.message) {
      toast({
        title: "文件上传错误",
        description: error.message,
        variant: "destructive"
      })
    }
  }, [error, toast])

  const handleFileSelect = (file) => {
    toast({
      title: "文件已选择",
      description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
    })
  }

  return (
    <FileUploadComplete
      onFileSelect={handleFileSelect}
      onError={(message) => {
        toast({
          title: "上传失败",
          description: message,
          variant: "destructive"
        })
      }}
    />
  )
}
```

### 自定义验证

```jsx
function CustomValidation() {
  const customFileValidation = (file) => {
    // 自定义验证逻辑
    if (file.name.length > 100) {
      return { isValid: false, error: '文件名过长' }
    }
    
    if (file.name.includes('virus')) {
      return { isValid: false, error: '文件名包含敏感词' }
    }
    
    return { isValid: true }
  }

  return (
    <FileUploadComplete
      onFileSelect={(file) => {
        const validation = customFileValidation(file.file)
        if (!validation.isValid) {
          alert(validation.error)
          return
        }
        
        console.log('文件验证通过:', file.name)
      }}
    />
  )
}
```

## 性能优化

### 图片压缩

```jsx
function ImageCompression() {
  const compressImage = (file, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelect = async (file) => {
    if (file.file.type.startsWith('image/')) {
      const compressedFile = await compressImage(file.file)
      console.log('压缩前:', file.file.size, '压缩后:', compressedFile.size)
      // 使用压缩后的文件
    }
  }

  return (
    <FileUploadComplete
      acceptedTypes={['image/*']}
      onFileSelect={handleFileSelect}
    />
  )
}
```

### 分片上传

```jsx
function ChunkedUpload() {
  const uploadInChunks = async (file, onProgress) => {
    const chunkSize = 1024 * 1024 // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize)
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)
      
      const formData = new FormData()
      formData.append('chunk', chunk)
      formData.append('chunkIndex', i)
      formData.append('totalChunks', totalChunks)
      formData.append('filename', file.name)
      
      await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData
      })
      
      const progress = Math.round(((i + 1) / totalChunks) * 100)
      onProgress(progress)
    }
    
    // 合并文件
    const response = await fetch('/api/upload/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, totalChunks })
    })
    
    return response.json()
  }

  return (
    <FileUploadComplete
      onUpload={uploadInChunks}
      maxFileSize={100 * 1024 * 1024} // 100MB
    />
  )
}
```

## 测试

### 单元测试示例

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { FileUploadButton } from '@/components/FileUpload'

describe('FileUploadButton', () => {
  test('点击按钮触发文件选择', () => {
    const mockFileSelect = jest.fn()
    
    render(
      <FileUploadButton onFileSelect={mockFileSelect} />
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // 验证文件输入被触发
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
  })
  
  test('文件选择后触发回调', () => {
    const mockFileSelect = jest.fn()
    
    render(
      <FileUploadButton onFileSelect={mockFileSelect} />
    )
    
    const fileInput = document.querySelector('input[type="file"]')
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    expect(mockFileSelect).toHaveBeenCalled()
  })
})
```

## 常见问题

### Q: 如何限制特定的图片格式？
A: 使用精确的MIME类型：`acceptedTypes={['image/jpeg', 'image/png']}`

### Q: 如何实现多文件上传？
A: 设置 `allowMultiple={true}` 并处理文件数组

### Q: 如何自定义上传进度显示？
A: 使用 `onUpload` 函数的 `onProgress` 回调来更新进度

### Q: 如何处理大文件上传？
A: 实现分片上传或使用专门的文件上传服务

这个文件上传组件系统提供了完整的文件处理功能，可以轻松集成到你的Live2D项目中，支持各种使用场景和自定义需求。
