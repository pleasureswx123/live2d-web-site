import React, { useEffect } from 'react'
import { useLive2DViewer } from '../hooks/useLive2DViewer'
import { LIVE2D_CONFIG } from '../lib/live2d-config'

export default function Live2DViewer({
                                       modelPath = '/models/youyou/youyou.model3.json',
                                       width = 800,
                                       height = 600,
                                       className = '',
                                       onModelLoad = null,
                                       onError = null
                                     }) {
  // 使用 Live2D 查看器 Hook
  const {
    containerRef,
    isLoading,
    error,
    modelInfo,
    getApp,
    getModel,
    handleCanvasClick,
    isModelLoaded,
    isAppReady
  } = useLive2DViewer(modelPath)

  // 当模型加载完成时调用回调
  useEffect(() => {
    if (isModelLoaded && onModelLoad) {
      const app = getApp()
      const model = getModel()
      const info = modelInfo
      onModelLoad(model, app, info)
    }
  }, [isModelLoaded, onModelLoad, getApp, getModel, modelInfo])

  // 当发生错误时调用回调
  useEffect(() => {
    if (error && onError) {
      onError(error)
    }
  }, [error, onError])

  return (
    <div className={`live2d-viewer ${className}`} style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        style={{
          width,
          height,
          display: 'block',
          cursor: 'pointer',
          border: '1px solid #ddd',
          borderRadius: 8,
          overflow: 'hidden',
          background: LIVE2D_CONFIG?.app?.backgroundAlpha === 0 ? 'transparent' : undefined
        }}
      />

      {/* 加载状态 */}
      {isLoading && (
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.8)', borderRadius: 8
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div>🎭 正在加载 Live2D 模型...</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>请稍候</div>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,0,0,0.08)', borderRadius: 8, border: '1px solid #ff6b6b'
          }}
        >
          <div style={{ textAlign: 'center', color: '#d63031' }}>
            <div>❌ 加载失败</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>{error}</div>
          </div>
        </div>
      )}

      {/* 模型信息（可选显示） */}
      {/*{modelInfo && !isLoading && !error && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: 8,
            borderRadius: 4,
            fontSize: 12,
            maxWidth: 240
          }}
        >
          <div><strong>{modelInfo.name}</strong></div>
          {'expressions' in modelInfo && <div>表情: {modelInfo.expressions.count}</div>}
          {'motions' in modelInfo && <div>动作: {modelInfo.motions.total}</div>}
          {'parameters' in modelInfo && <div>参数: {modelInfo.parameters.count}</div>}
        </div>
      )}*/}
    </div>
  )
}
