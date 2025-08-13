# FileUpload 文件上传组件

基于原始JavaScript代码重构的现代化React文件上传组件系统，使用Zustand进行状态管理。

## 功能特性

- 📁 **多种上传方式**：按钮点击、拖拽上传
- 🖼️ **文件预览**：图片缩略图、文件信息显示
- 📏 **文件验证**：类型检查、大小限制
- 📊 **上传进度**：实时进度条显示
- 🗂️ **文件历史**：最近上传文件记录
- 🎨 **现代化UI**：响应式设计、无障碍支持
- ⚡ **高性能**：内存管理、资源清理

## 组件结构

```
src/components/FileUpload/
├── FileUploadButton.jsx     # 文件上传按钮
├── FilePreview.jsx          # 文件预览组件
├── FileDropZone.jsx         # 拖拽上传区域
├── FileUploadComplete.jsx   # 完整组合组件
├── FileUploadExample.jsx    # 使用示例
├── index.js                 # 导出文件
└── README.md               # 使用文档
```

## 快速开始

### 1. 基础使用

```jsx
import { FileUploadComplete } from '@/components/FileUpload'

function App() {
  const handleFileSelect = (file) => {
    console.log('选择的文件:', file)
  }

  const handleUpload = async (file, onProgress) => {
    // 实现你的上传逻辑
    const formData = new FormData()
    formData.append('file', file)
    
    // 模拟上传进度
    for (let i = 0; i <= 100; i += 10) {
      onProgress(i)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return { url: 'https://example.com/uploaded-file' }
  }

  return (
    <FileUploadComplete
      mode="both"
      onFileSelect={handleFileSelect}
      onUpload={handleUpload}
      autoUpload={true}
      acceptedTypes={['image/*', '.pdf', '.doc', '.docx']}
      maxFileSize={10 * 1024 * 1024} // 10MB
    />
  )
}
```

### 2. 按钮模式

```jsx
import { FileUploadButton, FilePreview } from '@/components/FileUpload'

function ButtonMode() {
  return (
    <div>
      <FileUploadButton
        variant="default"
        size="lg"
        onFileSelect={(file) => console.log(file)}
      >
        选择文件
      </FileUploadButton>
      
      <FilePreview showUploadStatus={true} />
    </div>
  )
}
```

### 3. 拖拽模式

```jsx
import { FileDropZone, FilePreview } from '@/components/FileUpload'

function DropZoneMode() {
  return (
    <div>
      <FileDropZone
        text="拖拽文件到此处"
        subText="支持图片、PDF、Word文档"
        onFileSelect={(file) => console.log(file)}
      />
      
      <FilePreview position="inline" />
    </div>
  )
}
```

## API 参考

### FileUploadComplete

完整的文件上传组件，包含所有功能。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `mode` | `'button' \| 'dropzone' \| 'both'` | `'button'` | 显示模式 |
| `showPreview` | `boolean` | `true` | 是否显示预览 |
| `previewPosition` | `'inline' \| 'floating'` | `'inline'` | 预览位置 |
| `acceptedTypes` | `string[]` | `['image/*', '.pdf', '.txt', '.doc', '.docx']` | 接受的文件类型 |
| `maxFileSize` | `number` | `10485760` | 最大文件大小（字节） |
| `allowMultiple` | `boolean` | `false` | 是否允许多选 |
| `autoUpload` | `boolean` | `false` | 是否自动上传 |
| `onFileSelect` | `(file) => void` | - | 文件选择回调 |
| `onFileRemove` | `() => void` | - | 文件移除回调 |
| `onError` | `(message, type) => void` | - | 错误回调 |
| `onUpload` | `(file, onProgress) => Promise` | - | 上传函数 |

### FileUploadButton

文件上传按钮组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `variant` | `string` | `'outline'` | 按钮样式变体 |
| `size` | `string` | `'default'` | 按钮大小 |
| `icon` | `'paperclip' \| 'upload'` | `'paperclip'` | 图标类型 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `onFileSelect` | `(file) => void` | - | 文件选择回调 |
| `onError` | `(message, type) => void` | - | 错误回调 |

### FileDropZone

拖拽上传区域组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `text` | `string` | `'拖拽文件到此处或点击选择'` | 主要提示文本 |
| `subText` | `string` | `'支持图片、PDF、文档等格式'` | 副提示文本 |
| `showFileTypes` | `boolean` | `true` | 是否显示文件类型 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `onFileSelect` | `(file) => void` | - | 文件选择回调 |
| `onError` | `(message, type) => void` | - | 错误回调 |

### FilePreview

文件预览组件。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `position` | `'inline' \| 'floating'` | `'inline'` | 显示位置 |
| `showRemoveButton` | `boolean` | `true` | 是否显示移除按钮 |
| `showUploadStatus` | `boolean` | `true` | 是否显示上传状态 |
| `onRemove` | `() => void` | - | 移除文件回调 |
| `onDownload` | `(file) => void` | - | 下载文件回调 |

## 状态管理

使用Zustand进行状态管理，可以直接访问store：

```jsx
import { useFileUploadStore } from '@/components/FileUpload'

function CustomComponent() {
  const {
    files,
    ui,
    config,
    error,
    selectFile,
    removeFile,
    startUpload,
    reset
  } = useFileUploadStore()

  return (
    <div>
      <p>当前文件: {files.current?.name || '无'}</p>
      <p>上传进度: {ui.uploadProgress}%</p>
      <p>是否拖拽: {ui.isDragging ? '是' : '否'}</p>
    </div>
  )
}
```

## 事件系统

组件使用自定义事件进行通信：

```javascript
// 监听文件选择
window.addEventListener('fileSelected', (event) => {
  console.log('文件已选择:', event.detail.file)
})

// 监听文件移除
window.addEventListener('fileRemoved', () => {
  console.log('文件已移除')
})

// 监听上传成功
window.addEventListener('fileUploadSuccess', (event) => {
  console.log('上传成功:', event.detail.result)
})

// 监听错误
window.addEventListener('fileUploadError', (event) => {
  console.error('上传错误:', event.detail.message)
})
```

## 高级用法

### 自定义上传函数

```jsx
const customUpload = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', 'uploads')

  const xhr = new XMLHttpRequest()
  
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error('上传失败'))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('网络错误'))
    })

    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}
```

### 文件类型验证

```jsx
const customValidation = (file) => {
  // 自定义验证逻辑
  if (file.name.includes('temp')) {
    return { isValid: false, error: '不允许临时文件' }
  }
  
  return { isValid: true }
}

// 在组件中使用
<FileUploadComplete
  acceptedTypes={['image/jpeg', 'image/png']}
  maxFileSize={5 * 1024 * 1024} // 5MB
  onError={(message) => alert(message)}
/>
```

### 多文件上传

```jsx
// 配置多文件支持
<FileUploadComplete
  allowMultiple={true}
  mode="dropzone"
  onFileSelect={(files) => {
    console.log('选择的文件:', files)
  }}
/>
```

## 样式自定义

### 自定义按钮样式

```jsx
<FileUploadButton
  className="bg-blue-500 hover:bg-blue-600 text-white"
  variant="default"
  size="lg"
/>
```

### 自定义拖拽区域

```jsx
<FileDropZone
  className="border-blue-300 bg-blue-50"
  text="拖拽图片到此处"
  showFileTypes={false}
/>
```

### 使用CSS变量

```css
/* 在你的CSS文件中 */
.file-upload-complete {
  --upload-primary-color: #3b82f6;
  --upload-success-color: #10b981;
  --upload-error-color: #ef4444;
  --upload-border-radius: 8px;
}
```

## 集成示例

### 与表单集成

```jsx
import { useForm } from 'react-hook-form'
import { FileUploadComplete } from '@/components/FileUpload'

function FormWithUpload() {
  const { register, handleSubmit, setValue, watch } = useForm()
  const attachments = watch('attachments', [])

  const handleFileSelect = (file) => {
    setValue('attachments', [...attachments, file])
  }

  const onSubmit = (data) => {
    console.log('表单数据:', data)
    // 处理表单提交，包括文件
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} placeholder="标题" />
      
      <FileUploadComplete
        mode="both"
        onFileSelect={handleFileSelect}
        showPreview={true}
      />
      
      <button type="submit">提交</button>
    </form>
  )
}
```

### 与聊天系统集成

```jsx
function ChatWithAttachment() {
  const [message, setMessage] = useState('')
  const { files } = useFileUploadStore()

  const sendMessage = () => {
    const messageData = {
      text: message,
      attachment: files.current ? {
        name: files.current.name,
        size: files.current.size,
        type: files.current.type
      } : null
    }
    
    // 发送消息
    console.log('发送消息:', messageData)
  }

  return (
    <div className="chat-input">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="输入消息..."
      />
      
      <FileUploadButton size="sm" icon="paperclip" />
      <button onClick={sendMessage}>发送</button>
      
      <FilePreview position="floating" />
    </div>
  )
}
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

需要支持：
- `File API`
- `Drag and Drop API`
- `URL.createObjectURL`
- `FormData`

## 注意事项

1. **内存管理**: 组件会自动清理URL对象，避免内存泄漏
2. **文件大小**: 建议设置合理的文件大小限制
3. **安全性**: 在服务器端进行文件类型和内容验证
4. **性能**: 大文件上传时考虑分片上传
5. **用户体验**: 提供清晰的错误提示和进度反馈

## 故障排除

### 常见问题

1. **文件选择后没有反应**
   - 检查文件类型是否在允许列表中
   - 检查文件大小是否超过限制
   - 查看控制台错误信息

2. **拖拽不工作**
   - 确保浏览器支持拖拽API
   - 检查是否有其他元素阻止事件传播

3. **预览图片不显示**
   - 确保文件是有效的图片格式
   - 检查浏览器是否支持URL.createObjectURL

4. **上传进度不更新**
   - 确保上传函数正确调用onProgress回调
   - 检查网络连接和服务器响应
