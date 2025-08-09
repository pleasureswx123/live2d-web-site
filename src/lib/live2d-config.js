/**
 * Live2D 配置和初始化
 * 基于 pixi-live2d-display v0.4.0 官方 API 的配置系统
 * 文档: https://guansss.github.io/pixi-live2d-display/
 * API: https://guansss.github.io/pixi-live2d-display/api/
 */

import * as PIXI from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display/cubism4'

// 确保 PIXI 在全局可用（pixi-live2d-display 需要）
if (typeof window !== 'undefined') {
  window.PIXI = PIXI

  // 注册 Ticker 用于自动更新
  Live2DModel.registerTicker(PIXI.Ticker)
}

// Live2D 配置选项 - 基于 v0.4.0 API 最佳实践
export const LIVE2D_CONFIG = {
  // 模型配置
  models: {
    youyou: {
      name: '悠悠',
      path: '/models/youyou/youyou.model3.json',
      scale: 0.8, // 适合全屏显示的缩放
      position: { x: 0.5, y: 0.5 }, // 相对位置 (0-1)
      anchor: { x: 0.5, y: 0.5 }
    }
  },

  // PIXI 应用配置 - 全屏渲染优化
  app: {
    width: window.innerWidth || 1920,
    height: window.innerHeight || 1080,
    backgroundColor: 0x1a1a1a, // 深色背景
    backgroundAlpha: 1,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    powerPreference: 'high-performance', // 高性能模式
    clearBeforeRender: true
  },

  // 模型选项 - 基于 v0.4.0 API
  modelOptions: {
    autoInteract: true, // 启用自动交互
    autoUpdate: true,   // 启用自动更新
  },

  // 动画配置
  animation: {
    autoEyeBlink: true,
    eyeBlinkInterval: 4000, // 眨眼间隔 (毫秒)
    autoBreathing: true,
    breathingInterval: 3000, // 呼吸间隔 (毫秒)
    lipSyncEnabled: true
  }
}

/**
 * 初始化 Live2D 环境 - 基于 v0.4.0 API 最佳实践
 */
export function initializeLive2D() {
  console.log('🎭 初始化 Live2D 环境...')

  // 检查 Live2D Core 是否加载
  if (typeof window.Live2DCubismCore === 'undefined') {
    console.warn('⚠️ Live2D Cubism Core 未加载，请确保在 HTML 中引入了 live2dcubismcore.min.js')
    return false
  }

  // 检查 PIXI 是否可用
  if (typeof PIXI === 'undefined') {
    console.error('❌ PIXI.js 未加载')
    return false
  }

  // 配置 PIXI 设置 - 性能优化
  PIXI.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false
  PIXI.settings.STRICT_TEXTURE_CACHE = false
  PIXI.settings.ROUND_PIXELS = true // 像素对齐，提升渲染质量
  PIXI.settings.RESOLUTION = window.devicePixelRatio || 1

  // 修复 shader 相关问题
  if (PIXI.settings.SPRITE_MAX_TEXTURES === 0) {
    PIXI.settings.SPRITE_MAX_TEXTURES = 16
  }

  // 确保 Ticker 已注册
  Live2DModel.registerTicker(PIXI.Ticker)

  console.log('✅ Live2D 环境初始化完成')
  console.log('📦 PIXI 版本:', PIXI.VERSION)
  console.log('🎭 Live2D Core 版本:', window.Live2DCubismCore?.version || 'Unknown')
  console.log('🎮 自动更新已启用:', Live2DModel.ticker ? '是' : '否')

  return true
}

/**
 * 创建 PIXI 应用 - 全屏优化版本
 */
export function createPixiApp(canvas, options = {}) {
  const config = { ...LIVE2D_CONFIG.app, ...options }

  const app = new PIXI.Application({
    view: canvas,
    ...config
  })

  // 启用交互管理器
  app.renderer.plugins.interaction.autoPreventDefault = false
  app.renderer.view.style.touchAction = 'auto'

  // 添加调试信息
  console.log('🖼️ PIXI 应用创建成功:', {
    width: app.screen.width,
    height: app.screen.height,
    resolution: app.renderer.resolution,
    powerPreference: config.powerPreference,
    antialias: config.antialias
  })

  return app
}

/**
 * 加载 Live2D 模型 - 基于 v0.4.0 API
 */
export async function loadLive2DModel(modelPath, options = {}) {
  try {
    console.log('📥 开始加载模型:', modelPath)

    // 使用 v0.4.0 API 加载模型
    const model = await Live2DModel.from(modelPath, {
      ...LIVE2D_CONFIG.modelOptions,
      ...options
    })

    // 模型加载完成后会自动触发 ready 事件
    console.log('✅ 模型加载成功:', model.tag)

    return model
  } catch (error) {
    console.error('❌ 模型加载失败:', error)
    throw error
  }
}

/**
 * 配置模型交互 - 基于 v0.4.0 API 的完整配置
 */
export function setupModelInteraction(model, options = {}) {
  const config = { ...LIVE2D_CONFIG.modelOptions, ...options }

  // 配置点击事件
  model.on('hit', (hitAreas) => {
    console.log('🎯 模型被点击:', hitAreas)

    // 根据点击区域播放相应动作
    if (hitAreas.includes('body')) {
      model.motion('TapBody', Math.floor(Math.random() * 3))
    } else if (hitAreas.includes('head')) {
      model.motion('TapHead', Math.floor(Math.random() * 2))
    }
  })

  console.log('🎮 模型交互配置完成:', {
    autoInteract: model.autoInteract,
    autoUpdate: model.autoUpdate
  })

  return model
}

/**
 * 获取模型信息
 */
export function getModelInfo(model) {
  if (!model || !model.internalModel) {
    return null
  }
  
  const internal = model.internalModel
  const motionManager = internal.motionManager
  const expressionManager = motionManager?.expressionManager
  
  return {
    name: internal.settings?.name || 'Unknown',
    size: {
      width: model.width,
      height: model.height
    },
    parameters: {
      count: internal.coreModel?.getParameterCount() || 0
    },
    expressions: {
      count: expressionManager?.definitions?.length || 0,
      names: expressionManager?.definitions?.map(def => def.name) || []
    },
    motions: {
      groups: Object.keys(motionManager?.definitions || {}),
      total: Object.values(motionManager?.definitions || {}).reduce((sum, group) => sum + group.length, 0)
    }
  }
}

export default {
  LIVE2D_CONFIG,
  initializeLive2D,
  createPixiApp,
  loadLive2DModel,
  setupModelInteraction,
  getModelInfo
}
