import { useMemo } from 'react'
import { useUserAuthStore } from '../stores/userAuthStore'

/**
 * 通用条件渲染Hook
 * @param {object} conditions - 条件对象
 * @param {function} conditionFn - 条件判断函数
 * @returns {object} 包含shouldRender和条件的对象
 */
export const useConditionalRender = (conditions, conditionFn) => {
  return useMemo(() => {
    const shouldRender = conditionFn(conditions)
    return {
      shouldRender,
      conditions
    }
  }, [conditions, conditionFn])
}

/**
 * 用户信息显示条件Hook
 */
export const useUserInfoCondition = () => {
  const { currentUser } = useUserAuthStore()
  
  return useConditionalRender(
    { currentUser },
    ({ currentUser }) => !!(currentUser?.id && currentUser?.name)
  )
}

/**
 * 数据加载条件Hook
 */
export const useDataLoadingCondition = (data, loading, error) => {
  return useConditionalRender(
    { data, loading, error },
    ({ data, loading, error }) => !loading && !error && data
  )
}

/**
 * 权限条件Hook
 */
export const usePermissionCondition = (requiredPermissions, userPermissions) => {
  return useConditionalRender(
    { requiredPermissions, userPermissions },
    ({ requiredPermissions, userPermissions }) => {
      if (!requiredPermissions || !userPermissions) return false
      return requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      )
    }
  )
}

/**
 * 条件渲染组件
 */
export const ConditionalRender = ({ 
  condition, 
  children, 
  fallback = null 
}) => {
  if (!condition) {
    return fallback
  }
  
  return children
}
