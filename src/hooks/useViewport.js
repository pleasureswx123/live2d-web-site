import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * 窗口尺寸监听 Hook
 * 监听窗口尺寸变化和设备像素比变化，提供防抖优化
 * 
 * @returns {Object} 返回当前窗口尺寸 { width, height }
 */
export function useViewport() {
  // 获取当前窗口尺寸
  const getSize = useCallback(() => ({
    width: Math.max(1, window.innerWidth),
    height: Math.max(1, window.innerHeight),
  }), [])

  // 初始尺寸
  const [size, setSize] = useState(getSize)
  
  // 使用 ref 管理清理函数和 RAF
  const rafRef = useRef(0)
  const cleanupRef = useRef(null)

  useEffect(() => {
    // 防抖处理函数
    const onResize = () => {
      // 取消之前的 RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      
      // 使用 RAF 进行防抖
      rafRef.current = requestAnimationFrame(() => {
        setSize(getSize())
      })
    }

    // 添加窗口尺寸变化监听
    window.addEventListener('resize', onResize, { passive: true })

    // 监听设备像素比变化（某些设备 DPR 变化不会触发 resize）
    let mq = null
    try {
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      if (mq && mq.addEventListener) {
        mq.addEventListener('change', onResize)
      }
    } catch (error) {
      console.warn('设备像素比监听器创建失败:', error)
    }

    // 清理函数
    const cleanup = () => {
      // 移除事件监听器
      window.removeEventListener('resize', onResize)
      
      // 移除 DPR 监听器
      if (mq && mq.removeEventListener) {
        try {
          mq.removeEventListener('change', onResize)
        } catch (error) {
          console.warn('设备像素比监听器移除失败:', error)
        }
      }
      
      // 取消 RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
    }

    // 保存清理函数引用
    cleanupRef.current = cleanup

    // 组件卸载时清理
    return cleanup
  }, [getSize])

  // 额外的清理保护：组件卸载时确保清理
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [])

  return size
}

export default useViewport
