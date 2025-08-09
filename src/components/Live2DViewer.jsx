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
  const containerRef = useRef(null)
  const appRef = useRef(null)
  const modelRef = useRef(null)
  const initedRef = useRef(false)

  const baseSizeRef = useRef({ w: 1, h: 1 })   // 模型“静态基准尺寸”（local bounds）
  const pendingLayoutRef = useRef(false)       // rAF 节流标记

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)

  // —— 根据基准尺寸做自适应布局 —— //
  const layoutModel = () => {
    const app = appRef.current
    const model = modelRef.current
    if (!app || !model) return

    const res = app.renderer.resolution || 1
    // 注意：renderer.width/height 是像素尺寸，要除以 resolution 才是逻辑尺寸
    const vw = app.renderer.width / res
    const vh = app.renderer.height / res

    const { w, h } = baseSizeRef.current
    const scale = Math.max(0.001, Math.min(vw / w, vh / h) * 0.9)

    model.anchor.set(0.5, 1)          // 底部对齐，居中
    model.scale.set(scale)
    model.position.set(vw / 2, vh)    // 贴底；若想垂直居中改成 vh/2
  }

  // —— 初始化（仅首挂载） —— //
  useEffect(() => {
    let mounted = true
    if (initedRef.current) return
    initedRef.current = true

    async function init() {
      try {
        setIsLoading(true)
        setError(null)

        if (!initializeLive2D()) throw new Error('Live2D 环境初始化失败')

        const resolution =
          LIVE2D_CONFIG?.app?.resolution ??
          Math.min(window.devicePixelRatio || 1, 2) // 限个上限，减少高DPR下的抖动

        const app = new PIXI.Application({
          // 核心：交给 Pixi 跟随容器自适应
          resizeTo: containerRef.current || window,
          // 不手动设置 width/height，避免双重缩放
          backgroundColor: LIVE2D_CONFIG?.app?.backgroundColor ?? 0x000000,
          backgroundAlpha: LIVE2D_CONFIG?.app?.backgroundAlpha ?? 0, // 如遇透明闪白可改为 1
          antialias: LIVE2D_CONFIG?.app?.antialias ?? false,
          autoDensity: LIVE2D_CONFIG?.app?.autoDensity ?? true,
          resolution,
          powerPreference: LIVE2D_CONFIG?.app?.powerPreference ?? 'high-performance',
        })
        appRef.current = app

        if (containerRef.current) {
          containerRef.current.appendChild(app.view)
        }

        // （可选）GL 能力自检
        const gl = (app.renderer && (app.renderer.gl || (app.renderer.context && app.renderer.context.gl))) || null
        if (gl) {
          const maxUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
          if (!maxUnits || maxUnits <= 0) throw new Error('WebGL 环境异常：MAX_TEXTURE_IMAGE_UNITS = 0')
        }

        // 加载模型
        const model = await loadLive2DModel(modelPath)
        if (!mounted) return
        modelRef.current = model

        // 交互
        setupModelInteraction?.(model)

        // 放舞台后，取一次“静态” local bounds 作为缩放基准
        app.stage.addChild(model)
        // 用下一帧读取，保证纹理/网格已 ready
        app.ticker.addOnce(() => {
          const lb = model.getLocalBounds()
          const w = Math.max(1, lb.width || 1)
          const h = Math.max(1, lb.height || 1)
          baseSizeRef.current = { w, h }
          layoutModel() // 初次布局
        })

        // 监听 renderer 的 resize（由 resizeTo 触发），用 rAF 合并高频变化
        const onResize = () => {
          if (pendingLayoutRef.current) return
          pendingLayoutRef.current = true
          requestAnimationFrame(() => {
            pendingLayoutRef.current = false
            layoutModel()
          })
        }
        app.renderer.on('resize', onResize)

        // 保存以便卸载清理
        app.__onResize = onResize

        // 模型信息
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
      const app = appRef.current
      if (app) {
        try {
          if (app.__onResize) app.renderer.off('resize', app.__onResize)
          app.destroy(true, { children: true, texture: true, baseTexture: true })
        } catch {}
      }
      appRef.current = null
      modelRef.current = null
      initedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelPath])

  // —— 不再主动 renderer.resize；容器尺寸变化 → resizeTo 自动生效 —— //

  // 点击 tap
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
          // 用容器尺寸驱动 resizeTo；可用固定像素或 tailwind 类（如 absolute inset-0）
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

      {/* 模型信息 */}
      {modelInfo && !isLoading && !error && (
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
      )}
    </div>
  )
}
