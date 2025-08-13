import React, { useState } from 'react'
import { FileUploadComplete, FileUploadButton, FileDropZone, FilePreview, useFileUploadStore } from './index'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

/**
 * 文件上传组件使用示例
 * 展示如何集成和使用文件上传功能
 */
const FileUploadExample = () => {
  const [uploadResults, setUploadResults] = useState([])
  const [notifications, setNotifications] = useState([])

  // 文件上传store状态
  const { files, ui, config, error, reset } = useFileUploadStore()

  // 模拟上传函数
  const mockUpload = async (file, onProgress) => {
    console.log('开始上传文件:', file.name)
    
    // 模拟上传进度
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      onProgress(progress)
    }

    // 模拟上传结果
    const result = {
      id: Date.now().toString(),
      filename: file.name,
      size: file.size,
      url: `https://example.com/files/${file.name}`,
      uploadTime: new Date().toISOString()
    }

    console.log('上传完成:', result)
    return result
  }

  // 处理文件选择
  const handleFileSelect = (file) => {
    console.log('文件已选择:', file)
    addNotification(`已选择文件: ${file.name}`, 'success')
  }

  // 处理文件移除
  const handleFileRemove = () => {
    console.log('文件已移除')
    addNotification('文件已移除', 'info')
  }

  // 处理错误
  const handleError = (message, type) => {
    console.error('文件上传错误:', message, type)
    addNotification(`错误: ${message}`, 'error')
  }

  // 处理上传成功
  const handleUploadSuccess = (result) => {
    console.log('上传成功:', result)
    setUploadResults(prev => [result, ...prev])
    addNotification(`上传成功: ${result.filename}`, 'success')
  }

  // 添加通知
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    }
    
    setNotifications(prev => [...prev, notification])
    
    // 3秒后自动移除通知
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 3000)
  }

  // 监听上传成功事件
  React.useEffect(() => {
    const handleUploadSuccess = (event) => {
      handleUploadSuccess(event.detail.result)
    }

    window.addEventListener('fileUploadSuccess', handleUploadSuccess)
    return () => {
      window.removeEventListener('fileUploadSuccess', handleUploadSuccess)
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>文件上传组件示例</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="complete" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="complete">完整组件</TabsTrigger>
              <TabsTrigger value="button">按钮模式</TabsTrigger>
              <TabsTrigger value="dropzone">拖拽模式</TabsTrigger>
              <TabsTrigger value="custom">自定义组合</TabsTrigger>
            </TabsList>

            {/* 完整组件示例 */}
            <TabsContent value="complete" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">按钮模式</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUploadComplete
                      mode="button"
                      onFileSelect={handleFileSelect}
                      onFileRemove={handleFileRemove}
                      onError={handleError}
                      onUpload={mockUpload}
                      autoUpload={false}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">拖拽模式</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUploadComplete
                      mode="dropzone"
                      onFileSelect={handleFileSelect}
                      onFileRemove={handleFileRemove}
                      onError={handleError}
                      onUpload={mockUpload}
                      autoUpload={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 按钮模式示例 */}
            <TabsContent value="button" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <FileUploadButton
                      variant="default"
                      size="default"
                      onFileSelect={handleFileSelect}
                      onError={handleError}
                    />
                    
                    <FileUploadButton
                      variant="outline"
                      size="sm"
                      icon="upload"
                      onFileSelect={handleFileSelect}
                      onError={handleError}
                    >
                      上传文件
                    </FileUploadButton>
                  </div>
                  
                  <div className="mt-4">
                    <FilePreview
                      onRemove={handleFileRemove}
                      showUploadStatus={true}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 拖拽模式示例 */}
            <TabsContent value="dropzone" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <FileDropZone
                    onFileSelect={handleFileSelect}
                    onError={handleError}
                    text="拖拽文件到此处"
                    subText="支持图片、PDF、Word文档等格式"
                  />
                  
                  <div className="mt-4">
                    <FilePreview
                      onRemove={handleFileRemove}
                      showUploadStatus={true}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 自定义组合示例 */}
            <TabsContent value="custom" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileUploadButton
                        variant="outline"
                        size="sm"
                        onFileSelect={handleFileSelect}
                        onError={handleError}
                      />
                      
                      {files.current && (
                        <Button
                          size="sm"
                          onClick={() => mockUpload(files.current.file, () => {})}
                          disabled={ui.isUploading}
                        >
                          {ui.isUploading ? '上传中...' : '开始上传'}
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={reset}
                    >
                      重置
                    </Button>
                  </div>
                  
                  <FilePreview
                    onRemove={handleFileRemove}
                    showUploadStatus={true}
                    position="inline"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 状态信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">当前状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs">
              <span className="font-medium">文件:</span> {files.current ? files.current.name : '无'}
            </div>
            <div className="text-xs">
              <span className="font-medium">拖拽:</span> {ui.isDragging ? '是' : '否'}
            </div>
            <div className="text-xs">
              <span className="font-medium">上传:</span> {ui.isUploading ? `${ui.uploadProgress}%` : '未上传'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">配置信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs">
              <span className="font-medium">最大大小:</span> {Math.round(config.maxFileSize / 1024 / 1024)}MB
            </div>
            <div className="text-xs">
              <span className="font-medium">支持类型:</span> {config.acceptedTypes.length}种
            </div>
            <div className="text-xs">
              <span className="font-medium">多选:</span> {config.allowMultiple ? '是' : '否'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">上传历史</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {uploadResults.length > 0 ? `${uploadResults.length} 个文件已上传` : '暂无上传记录'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 错误信息 */}
      {error.message && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-sm text-destructive">
              <span className="font-medium">错误:</span> {error.message}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 通知区域 */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {notifications.map((notification) => (
            <Badge
              key={notification.id}
              variant={notification.type === 'error' ? 'destructive' : 'default'}
              className="block p-2 shadow-lg"
            >
              {notification.message}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUploadExample
