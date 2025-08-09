// 负责管理 WebSocket 连接、发送合成指令、接收 audio/subtitle/emotion/done，并抛给上层。
import { useRef, useEffect, useCallback } from 'react'

export function useTTSStream({ url, onSubtitle, onAudio, onEmotion, onDone, onError }) {
  const wsRef = useRef(null)

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) return
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'
    ws.onopen = () => { /* ready */ }
    ws.onmessage = (ev) => {
      try {
        // 统一都用 JSON 文本（音频走 base64 文本）；若你家服务端是 ArrayBuffer，就另走分支
        const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data))
        if (msg.type === 'subtitle') onSubtitle?.(msg)
        else if (msg.type === 'audio') onAudio?.(msg)
        else if (msg.type === 'emotion') onEmotion?.(msg)
        else if (msg.type === 'done') onDone?.()
      } catch (e) {
        onError?.(e)
      }
    }
    ws.onerror = (e) => onError?.(e)
    ws.onclose = () => {}
    wsRef.current = ws
  }, [url, onSubtitle, onAudio, onEmotion, onDone, onError])

  const start = useCallback((payload) => {
    connect()
    const ws = wsRef.current
    if (!ws || ws.readyState !== 1) {
      // 等 open 后再发
      const onOpen = () => { try { ws.send(JSON.stringify({ type: 'start', ...payload })) } catch {} }
      ws?.addEventListener('open', onOpen, { once: true })
      return
    }
    ws.send(JSON.stringify({ type: 'start', ...payload }))
  }, [connect])

  const close = useCallback(() => { try { wsRef.current?.close() } catch {} }, [])

  useEffect(() => close, [close])

  return { start, connect, close }
}
