import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { debounce } from "lodash-es"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// 重新导出 lodash 的 debounce 函数，保持 API 一致性
export { debounce }
