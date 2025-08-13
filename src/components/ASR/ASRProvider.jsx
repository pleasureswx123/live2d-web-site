import React from 'react'
import { useASRStore } from '../../stores/asrStore'

/**
 * ASR提供者组件
 * 处理全局键盘事件和ASR生命周期管理
 * 
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @param {string} props.targetInputId - 目标输入框ID，用于判断是否在正确的输入框中
 * @param {Function} props.onResult - 识别结果回调
 * @param {Function} props.onError - 错误回调
 * @param {Function} props.onNotification - 通知回调
 */
const ASRProvider = ({
  children,
  targetInputId = 'messageInput',
  onResult,
  onError,
  onNotification
}) => {
  const {
    recording,
    config,
    startSpaceKeyASR,
    stopSpaceKeyASR,
    updateRecordingState,
    reset
  } = useASRStore()

  // 处理空格键按下
  const handleSpaceKeyDown = React.useCallback(async (e) => {
    console.log('🎤 handleSpaceKeyDown被调用')
    console.log('🎤 当前状态 - isSpaceKeyPressed:', recording.isSpaceKeyPressed)
    console.log('🎤 当前状态 - isSpaceKeyASRActive:', recording.isSpaceKeyASRActive)

    // 如果已经在处理空格键，忽略重复事件
    if (recording.isSpaceKeyPressed) {
      console.log('🎤 空格键已被按下，忽略重复事件')
      return
    }

    // 阻止空格键的默认行为（防止在输入框中输入空格）
    e.preventDefault()

    const spaceKeyStartTime = Date.now()
    updateRecordingState({
      isSpaceKeyPressed: true,
      spaceKeyStartTime
    })

    console.log('🎤 空格键按下，开始计时...', 'SPACE_KEY_HOLD_THRESHOLD:', config.spaceKeyHoldThreshold)

    // 设置定时器，0.4秒后开始ASR
    const spaceKeyTimer = setTimeout(async () => {
      console.log('🎤 长按空格键0.4秒，开始ASR')
      await startSpaceKeyASR()
    }, config.spaceKeyHoldThreshold)

    updateRecordingState({ spaceKeyTimer })
  }, [recording.isSpaceKeyPressed, recording.isSpaceKeyASRActive, config.spaceKeyHoldThreshold, startSpaceKeyASR, updateRecordingState])

  // 处理空格键松开
  const handleSpaceKeyUp = React.useCallback(async (e) => {
    if (!recording.isSpaceKeyPressed) return

    const holdDuration = Date.now() - recording.spaceKeyStartTime
    console.log(`🎤 空格键松开，持续时间: ${holdDuration}ms`)

    updateRecordingState({ isSpaceKeyPressed: false })

    // 清除定时器
    if (recording.spaceKeyTimer) {
      clearTimeout(recording.spaceKeyTimer)
      updateRecordingState({ spaceKeyTimer: null })
    }

    // 如果ASR已经激活，停止它
    if (recording.isSpaceKeyASRActive) {
      console.log('🎤 空格键松开，停止ASR')
      await stopSpaceKeyASR()
    } else if (holdDuration < config.spaceKeyHoldThreshold) {
      // 如果按下时间不足0.4秒，在输入框中添加空格
      const targetInput = document.getElementById(targetInputId)
      if (targetInput && document.activeElement === targetInput) {
        const cursorPos = targetInput.selectionStart
        const textBefore = targetInput.value.substring(0, cursorPos)
        const textAfter = targetInput.value.substring(cursorPos)
        targetInput.value = textBefore + ' ' + textAfter
        targetInput.selectionStart = targetInput.selectionEnd = cursorPos + 1
        
        // 触发input事件以便React能够检测到变化
        const inputEvent = new Event('input', { bubbles: true })
        targetInput.dispatchEvent(inputEvent)
        
        console.log('🎤 短按空格键，插入空格字符')
      }
    }
  }, [recording.isSpaceKeyPressed, recording.isSpaceKeyASRActive, recording.spaceKeyStartTime, recording.spaceKeyTimer, config.spaceKeyHoldThreshold, targetInputId, stopSpaceKeyASR, updateRecordingState])

  // 键盘事件监听
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        console.log('🎤 检测到空格键按下')
        console.log('🎤 document.activeElement:', document.activeElement)
        console.log('🎤 document.activeElement.id:', document.activeElement ? document.activeElement.id : 'null')

        // 检查是否在目标输入框中或者没有其他输入元素获得焦点
        const isInputElement = document.activeElement &&
          (document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.contentEditable === 'true')

        console.log('🎤 当前焦点元素是输入元素:', isInputElement)
        console.log('🎤 当前焦点元素标签:', document.activeElement ? document.activeElement.tagName : 'null')

        // 如果当前焦点在目标输入框上，或者没有其他输入元素获得焦点
        if (document.activeElement?.id === targetInputId ||
            (!isInputElement || document.activeElement.tagName === 'BODY')) {
          console.log('🎤 空格键条件满足，调用handleSpaceKeyDown')
          handleSpaceKeyDown(e)
        } else {
          console.log('🎤 空格键条件不满足，跳过处理')
        }
      }
    }

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        console.log('🎤 空格键松开事件触发，调用handleSpaceKeyUp')
        handleSpaceKeyUp(e)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleSpaceKeyDown, handleSpaceKeyUp, targetInputId])

  // 监听ASR事件
  React.useEffect(() => {
    const handleASRResult = (event) => {
      if (onResult) {
        onResult(event.detail.text)
      }
    }

    const handleASRError = (event) => {
      if (onError) {
        onError(event.detail.error)
      }
    }

    const handleASRNotification = (event) => {
      if (onNotification) {
        onNotification(event.detail.message, event.detail.type)
      }
    }

    window.addEventListener('asrResult', handleASRResult)
    window.addEventListener('asrError', handleASRError)
    window.addEventListener('asrNotification', handleASRNotification)

    return () => {
      window.removeEventListener('asrResult', handleASRResult)
      window.removeEventListener('asrError', handleASRError)
      window.removeEventListener('asrNotification', handleASRNotification)
    }
  }, [onResult, onError, onNotification])

  // 组件卸载时清理资源
  React.useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  return <>{children}</>
}

export default ASRProvider
