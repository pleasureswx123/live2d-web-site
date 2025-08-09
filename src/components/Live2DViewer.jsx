import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import {
  initializeLive2D,
  loadLive2DModel,
  setupModelInteraction,
  getModelInfo,
  LIVE2D_CONFIG
} from '../lib/live2d-config'

export default function Live2DViewer({
                                       modelPath = '/models/youyou/youyou.model3.json',
                                       width = 800,
                                       height = 600,
                                       className = '',
                                       onModelLoad = null,
                                       onError = null
                                     }) {
  const containerRef = useRef(null)     // 用容器，不直接把现成 canvas 传给 Pixi
  const appRef = useRef(null)
  const modelRef = useRef(null)
  const initedRef = useRef(false)       // StrictMode 防二次初始化

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)

  // 根据真实 bounds 等比缩放并摆放模型
  const layoutModel = () => {
    const app = appRef.current
    const model = modelRef.current
    if (!app || !model) return

    // 用 props 的 width/height 作为逻辑尺寸（配合 autoDensity+resolution）
    const W = width
    const H = height

    // 先确保模型已在舞台（否则 bounds 可能是 0）
    if (!model.parent) app.stage.addChild(model)

    // 下一帧读取 bounds 再布局
    app.ticker.addOnce(() => {
      const b = model.getBounds() // 舞台坐标系
      let s = 0.9
      if (b.width > 0 && b.height > 0) {
        s = Math.min(W / b.width, H / b.height) * 0.9
      }
      if (!Number.isFinite(s) || s <= 0) s = 0.3 // 兜底

      model.anchor.set(0.5, 1)           // 底部居中更直观
      model.scale.set(s)
      model.position.set(W / 2, H)       // 贴底部；想居中可改成 H/2
    })
  }

  // 初始化（仅首挂载）
  useEffect(() => {
    let mounted = true
    if (initedRef.current) return
    initedRef.current = true

    async function init() {
      try {
        setIsLoading(true)
        setError(null)

        // 只注入一次 Cubism Core
        const ok = initializeLive2D()
        if (!ok) throw new Error('Live2D 环境初始化失败')

        // 让 Pixi 自己创建 canvas；不要传 { view }
        const app = new PIXI.Application({
          width,
          height,
          backgroundColor: LIVE2D_CONFIG?.app?.backgroundColor ?? 0x000000,
          backgroundAlpha: LIVE2D_CONFIG?.app?.backgroundAlpha ?? 0,
          antialias: LIVE2D_CONFIG?.app?.antialias ?? false,
          resolution: LIVE2D_CONFIG?.app?.resolution ?? Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: LIVE2D_CONFIG?.app?.autoDensity ?? true,
          powerPreference: LIVE2D_CONFIG?.app?.powerPreference ?? 'high-performance',
        })
        appRef.current = app

        if (containerRef.current) {
          containerRef.current.appendChild(app.view)
        }

        // 可选：快速 GL 能力自检（排查 0 纹理单元等环境问题）
        const gl = (app.renderer && (app.renderer.gl || (app.renderer.context && app.renderer.context.gl))) || null
        if (gl) {
          const maxUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
          if (!maxUnits || maxUnits <= 0) throw new Error('WebGL 环境异常：MAX_TEXTURE_IMAGE_UNITS = 0')
        }

        // 加载模型
        const model = await loadLive2DModel(modelPath) // 确保用的是 cubism4 入口
        if (!mounted) return
        modelRef.current = model

        // 交互（点按等）
        setupModelInteraction?.(model)

        // 先加到舞台，下一帧再布局（关键）
        app.stage.addChild(model)
        layoutModel()

        // 提供信息
        const info = getModelInfo?.(model)
        setModelInfo(info || null)
        onModelLoad && onModelLoad(model, app, info)
      } catch (err) {
        console.error('❌ Live2D 初始化失败:', err)
        setError(err?.message || String(err))
        onError && onError(err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
      // 彻底销毁（释放 GL/纹理/子树）
      if (appRef.current) {
        try {
          appRef.current.destroy(true, { children: true, texture: true, baseTexture: true })
        } catch {}
        appRef.current = null
      }
      modelRef.current = null
      initedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelPath])

  // 仅处理外部尺寸变化（不重建 Application）
  useEffect(() => {
    const app = appRef.current
    if (!app) return
    app.renderer.resize(width, height)
    layoutModel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height])

  // 点击传给模型（tap）
  const handleCanvasClick = (event) => {
    const model = modelRef.current
    const app = appRef.current
    if (!model || !app) return
    const rect = app.view.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    try { model.tap(x, y) } catch {}
  }

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
          overflow: 'hidden'
        }}
      />
      {/* 加载遮罩 */}
      {isLoading && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.8)', borderRadius: 8
        }}>
          <div style={{ textAlign: 'center' }}>
            <div>🎭 正在加载 Live2D 模型...</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>请稍候</div>
          </div>
        </div>
      )}
      {/* 错误遮罩 */}
      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,0,0,0.08)', borderRadius: 8, border: '1px solid #ff6b6b'
        }}>
          <div style={{ textAlign: 'center', color: '#d63031' }}>
            <div>❌ 加载失败</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>{error}</div>
          </div>
        </div>
      )}
      {/* 模型信息 */}
      {modelInfo && !isLoading && !error && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(0,0,0,0.7)', color: '#fff',
          padding: 8, borderRadius: 4, fontSize: 12, maxWidth: 240
        }}>
          <div><strong>{modelInfo.name}</strong></div>
          {'expressions' in modelInfo && <div>表情: {modelInfo.expressions.count}</div>}
          {'motions' in modelInfo && <div>动作: {modelInfo.motions.total}</div>}
          {'parameters' in modelInfo && <div>参数: {modelInfo.parameters.count}</div>}
        </div>
      )}
    </div>
  )
}
