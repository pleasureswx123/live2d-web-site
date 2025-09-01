import { useEffect, useRef, useState, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import {
  initializeLive2D,
  loadLive2DModel,
  setupModelInteraction,
  getModelInfo,
  LIVE2D_CONFIG
} from '../lib/live2d-config'

/**
 * Live2D 查看器核心逻辑 Hook
 * 管理 PIXI 应用、模型加载、布局计算、嘴部同步等核心功能
 *
 * @param {string} modelPath - 模型文件路径
 * @returns {Object} 返回查看器状态和控制函数
 */
export function useLive2DViewer(modelPath) {
  // 核心引用
  const containerRef = useRef(null)
  const appRef = useRef(null)
  const modelRef = useRef(null)
  const initedRef = useRef(false)

  // 布局相关引用
  const baseSizeRef = useRef({ w: 1, h: 1 })   // 模型"静态基准尺寸"
  const pendingLayoutRef = useRef(false)       // RAF 节流标记

  // 状态管理
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)

  // 布局计算函数 - 使用 useCallback 优化
  const layoutModel = useCallback(() => {
    const app = appRef.current
    const model = modelRef.current
    if (!app || !model) return

    const res = app.renderer.resolution || 1
    const vw = app.renderer.width / res
    const vh = app.renderer.height / res

    const { w, h } = baseSizeRef.current
    const scale = Math.max(0.001, Math.min(vw / w, vh / h) * 0.9)

    model.anchor.set(0.5, 1)          // 底部对齐，居中
    model.scale.set(scale)
    model.position.set(vw / 2, vh)    // 贴底
  }, [])

  // 初始化 Live2D 环境
  const initializeLive2DEnvironment = useCallback(async () => {
    if (!initializeLive2D()) {
      throw new Error('Live2D 环境初始化失败')
    }

    const resolution = LIVE2D_CONFIG?.app?.resolution ??
      Math.min(window.devicePixelRatio || 1, 2)

    const app = new PIXI.Application({
      resizeTo: containerRef.current || window,
      backgroundColor: LIVE2D_CONFIG?.app?.backgroundColor ?? 0x000000,
      backgroundAlpha: LIVE2D_CONFIG?.app?.backgroundAlpha ?? 0,
      antialias: LIVE2D_CONFIG?.app?.antialias ?? false,
      autoDensity: LIVE2D_CONFIG?.app?.autoDensity ?? true,
      resolution,
      powerPreference: LIVE2D_CONFIG?.app?.powerPreference ?? 'high-performance',
    })

    // WebGL 能力检查
    const gl = (app.renderer && (app.renderer.gl || (app.renderer.context && app.renderer.context.gl))) || null
    if (gl) {
      const maxUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
      if (!maxUnits || maxUnits <= 0) {
        throw new Error('WebGL 环境异常：MAX_TEXTURE_IMAGE_UNITS = 0')
      }
    }

    return app
  }, [])

  // 加载模型
  const loadModel = useCallback(async (app) => {
    const model = await loadLive2DModel(modelPath)

    // 设置交互
    setupModelInteraction?.(model)

    // 添加到舞台
    app.stage.addChild(model)

    // 获取基准尺寸并布局
    app.ticker.addOnce(() => {
      const lb = model.getLocalBounds()
      const w = Math.max(1, lb.width || 1)
      const h = Math.max(1, lb.height || 1)
      baseSizeRef.current = { w, h }
      layoutModel()
    })

    return model
  }, [modelPath, layoutModel])

  // 设置事件监听器
  const setupEventListeners = useCallback((app) => {
    const onResize = () => {
      if (pendingLayoutRef.current) return
      pendingLayoutRef.current = true
      requestAnimationFrame(() => {
        pendingLayoutRef.current = false
        layoutModel()
      })
    }

    app.renderer.on('resize', onResize)
    app.__onResize = onResize

    return onResize
  }, [layoutModel])

  // 初始化嘴部同步功能
  const initLipSync = useCallback(() => {
    let ctx, analyser, data, rafId, source
    const SMOOTH = 0.35
    const GAIN = 1.8
    let last = 0

    function ensureCtx() {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)()
        analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        data = new Uint8Array(analyser.frequencyBinCount)
      }
    }

    function level() {
      analyser.getByteTimeDomainData(data)
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / data.length)
      return Math.min(1, rms * GAIN)
    }

    function tick() {
      const m = window.live2dModel
      if (!m || !analyser) return

      const target = level()
      const y = last + (target - last) * SMOOTH
      last = y

      const core = m.internalModel && m.internalModel.coreModel
      if (core) {
        try {
          core.setParameterValueById('ParamMouthOpenY', y)
          core.setParameterValueById('ParamMouthForm', y * 0.6)

          // 其他嘴部参数
          const mouthParams = ['MouthX', 'MouthPuckerWiden']
          mouthParams.forEach(paramId => {
            if (paramId === 'MouthX') {
              core.setParameterValueById(paramId, Math.sin(performance.now() * 0.006) * y * 0.3)
            } else if (paramId === 'MouthPuckerWiden') {
              core.setParameterValueById(paramId, y * 0.8)
            }
          })
        } catch (e) {
          console.warn('mouth param error:', e)
        }
      }

      if (rafId) rafId = requestAnimationFrame(tick)
    }

    function stop() {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      last = 0

      try {
        source && source.disconnect()
      } catch {}
      source = null

      // 重置模型状态
      const m = window.live2dModel
      if (m?.internalModel?.coreModel) {
        try {
          m.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', 0)
          m.internalModel.coreModel.setParameterValueById('ParamMouthForm', 0)
        } catch (e) {
          console.warn('重置嘴部参数失败:', e)
        }
      }

      if (m?.internalModel?.motionManager) {
        try {
          const em = m.internalModel.motionManager.expressionManager
          em.setExpression('')

          const mm = m.internalModel.motionManager
          mm.stopAllMotions()
          mm.currentMotion = null
        } catch (e) {
          console.warn('重置动作失败:', e)
        }
      }
    }

    // 暴露全局函数
    window.__startLipSyncForAudio = function (audioEl) {
      try {
        console.log('🎤 开始悠悠口型同步:', audioEl)
        ensureCtx()
        stop()
        source = ctx.createMediaElementSource(audioEl)
        source.connect(analyser)
        analyser.connect(ctx.destination)
        rafId = requestAnimationFrame(tick)

        // 切换到中性表情
        const model = window.live2dModel
        if (model) {
          try {
            if (typeof model.expression === 'function') {
              model.expression('tuosai')
            }
            if (typeof model.motion === 'function') {
              model.motion('TapBody', 2, { loop: true })
            }
          } catch (e) {
            console.warn('设置模型状态失败:', e)
          }
        }
      } catch (e) {
        console.warn('🎤 悠悠口型同步启动失败:', e)
      }
    }

    window.__stopLipSync = function() {
      console.log('🎤 停止悠悠口型同步')
      stop()
    }
  }, [])

  // 清理资源
  const cleanup = useCallback(() => {
    // 清理嘴部同步
    if (window.__stopLipSync) {
      window.__stopLipSync()
    }
    window.live2dModel = null

    // 清理 PIXI 应用
    const app = appRef.current
    if (app) {
      try {
        if (app.__onResize) {
          app.renderer.off('resize', app.__onResize)
        }
        app.destroy(true, { children: true, texture: true, baseTexture: true })
      } catch (e) {
        console.warn('清理 PIXI 应用失败:', e)
      }
    }

    // 重置引用
    appRef.current = null
    modelRef.current = null
    initedRef.current = false
  }, [])

  // 主要初始化逻辑
  useEffect(() => {
    let mounted = true
    if (initedRef.current) return
    initedRef.current = true

    async function init() {
      try {
        setIsLoading(true)
        setError(null)

        // 初始化环境
        const app = await initializeLive2DEnvironment()
        if (!mounted) return
        appRef.current = app

        // 添加到容器
        if (containerRef.current) {
          containerRef.current.appendChild(app.view)
        }

        // 加载模型
        const model = await loadModel(app)
        if (!mounted) return
        modelRef.current = model

        // 设置事件监听器
        setupEventListeners(app)

        // 获取模型信息
        const info = getModelInfo?.(model)
        setModelInfo(info || null)

        // 设置全局引用
        window.live2dModel = model

        // 初始化嘴部同步
        initLipSync()

        setIsLoading(false)
      } catch (err) {
        console.error('❌ Live2D 初始化失败:', err)
        if (mounted) {
          setError(err?.message || String(err))
        }
      }
    }

    init()

    return () => {
      mounted = false
      cleanup()
    }
  }, [modelPath, initializeLive2DEnvironment, loadModel, setupEventListeners, initLipSync, cleanup])

  // 点击处理
  const handleCanvasClick = useCallback((event) => {
    const model = modelRef.current
    const app = appRef.current
    if (!model || !app) return

    const rect = app.view.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    try {
      model.tap(x, y)
    } catch (e) {
      console.warn('模型点击失败:', e)
    }
  }, [])

  return {
    // 引用
    containerRef,

    // 状态
    isLoading,
    error,
    modelInfo,

    // 实例访问
    getApp: () => appRef.current,
    getModel: () => modelRef.current,

    // 事件处理
    handleCanvasClick,

    // 控制函数
    layoutModel,
    cleanup,

    // 状态检查
    isInitialized: initedRef.current,
    isModelLoaded: !!modelRef.current,
    isAppReady: !!appRef.current,
  }
}

export default useLive2DViewer
