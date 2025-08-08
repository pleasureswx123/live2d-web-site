import { useEffect, useRef, useState } from 'react'
import { 
  initializeLive2D, 
  createPixiApp, 
  loadLive2DModel, 
  setupModelInteraction,
  getModelInfo,
  LIVE2D_CONFIG 
} from '../lib/live2d-config'

/**
 * Live2D 模型查看器组件
 */
export default function Live2DViewer({ 
  modelPath = '/models/youyou/youyou.model3.json',
  width = 800,
  height = 600,
  className = '',
  onModelLoad = null,
  onError = null
}) {
  const canvasRef = useRef(null)
  const appRef = useRef(null)
  const modelRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)

  useEffect(() => {
    let mounted = true

    async function initializeViewer() {
      try {
        setIsLoading(true)
        setError(null)

        // 初始化 Live2D 环境
        if (!initializeLive2D()) {
          throw new Error('Live2D 环境初始化失败')
        }

        // 创建 PIXI 应用
        const app = createPixiApp(canvasRef.current, { width, height })
        appRef.current = app

        // 加载模型
        const model = await loadLive2DModel(modelPath)
        if (!mounted) return

        modelRef.current = model

        // 配置模型
        setupModelInteraction(model)

        // 调整模型大小和位置
        const scale = Math.min(width / model.width, height / model.height) * 0.8
        model.scale.set(scale)
        model.x = width / 2
        model.y = height / 2
        model.anchor.set(0.5, 0.5)

        // 添加到舞台
        app.stage.addChild(model)

        // 启动渲染循环
        app.ticker.add(() => {
          if (model) {
            model.update(app.ticker.deltaMS)
          }
        })

        // 获取模型信息
        const info = getModelInfo(model)
        setModelInfo(info)

        console.log('🎉 Live2D 查看器初始化完成:', info)

        // 调用回调
        if (onModelLoad) {
          onModelLoad(model, app, info)
        }

      } catch (err) {
        console.error('❌ Live2D 查看器初始化失败:', err)
        setError(err.message)
        if (onError) {
          onError(err)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeViewer()

    // 清理函数
    return () => {
      mounted = false
      if (appRef.current) {
        appRef.current.destroy(true, true)
        appRef.current = null
      }
      modelRef.current = null
    }
  }, [modelPath, width, height, onModelLoad, onError])

  // 处理画布点击
  const handleCanvasClick = (event) => {
    if (!modelRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // 转换为模型坐标
    const modelX = (x - modelRef.current.x) / modelRef.current.scale.x
    const modelY = (y - modelRef.current.y) / modelRef.current.scale.y

    console.log('🎯 画布点击:', { x: modelX, y: modelY })

    // 触发点击动作（如果模型支持）
    if (modelRef.current.internalModel?.motionManager) {
      try {
        modelRef.current.motion('TapBody', 0, 3)
      } catch (err) {
        console.warn('⚠️ 无法播放点击动作:', err.message)
      }
    }
  }

  return (
    <div className={`live2d-viewer ${className}`} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        style={{
          display: 'block',
          cursor: 'pointer',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}
      />
      
      {/* 加载状态 */}
      {isLoading && (
        <div 
          className="loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '8px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div>🎭 加载 Live2D 模型中...</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              请稍候，正在初始化模型
            </div>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div 
          className="error-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderRadius: '8px',
            border: '1px solid #ff6b6b'
          }}
        >
          <div style={{ textAlign: 'center', color: '#d63031' }}>
            <div>❌ 加载失败</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              {error}
            </div>
          </div>
        </div>
      )}

      {/* 模型信息 */}
      {modelInfo && !isLoading && !error && (
        <div 
          className="model-info"
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            maxWidth: '200px'
          }}
        >
          <div><strong>{modelInfo.name}</strong></div>
          <div>表情: {modelInfo.expressions.count}</div>
          <div>动作: {modelInfo.motions.total}</div>
          <div>参数: {modelInfo.parameters.count}</div>
        </div>
      )}
    </div>
  )
}
