import { useState, useCallback, useRef } from 'react'

/**
 * Live2D 模型状态管理 Hook
 * 负责管理模型实例、PIXI 应用、模型信息等状态
 * 
 * @returns {Object} 返回模型状态和回调函数
 */
export function useLive2DModel() {
  // 模型相关状态
  const [currentModel, setCurrentModel] = useState(null)
  const [pixiApp, setPixiApp] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  
  // 使用 ref 来避免不必要的重渲染
  const modelRef = useRef(null)
  const appRef = useRef(null)
  const infoRef = useRef(null)

  // 处理模型加载成功
  const handleModelLoad = useCallback((model, app, info) => {
    // 更新 ref 值（用于同步访问）
    modelRef.current = model
    appRef.current = app
    infoRef.current = info
    
    // 更新状态（用于触发重渲染）
    setCurrentModel(model)
    setPixiApp(app)
    setModelInfo(info)
    
    console.log('📦 模型实例已传递给 App 组件:', info)
  }, [])

  // 处理模型加载错误
  const handleModelError = useCallback((error) => {
    console.error('❌ 模型加载失败:', error)
    
    // 清理状态
    modelRef.current = null
    appRef.current = null
    infoRef.current = null
    
    setCurrentModel(null)
    setPixiApp(null)
    setModelInfo(null)
  }, [])

  // 获取当前模型实例（同步访问）
  const getCurrentModel = useCallback(() => modelRef.current, [])
  
  // 获取当前 PIXI 应用实例（同步访问）
  const getCurrentApp = useCallback(() => appRef.current, [])
  
  // 获取当前模型信息（同步访问）
  const getCurrentInfo = useCallback(() => infoRef.current, [])

  // 清理模型资源
  const cleanupModel = useCallback(() => {
    modelRef.current = null
    appRef.current = null
    infoRef.current = null
    
    setCurrentModel(null)
    setPixiApp(null)
    setModelInfo(null)
  }, [])

  return {
    // 状态
    currentModel,
    pixiApp,
    modelInfo,
    
    // 回调函数
    handleModelLoad,
    handleModelError,
    
    // 同步访问方法
    getCurrentModel,
    getCurrentApp,
    getCurrentInfo,
    
    // 清理方法
    cleanupModel,
    
    // 状态检查
    isModelLoaded: !!currentModel,
    isAppReady: !!pixiApp,
  }
}
