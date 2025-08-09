// 流式口型 + 气泡 + 联动
// 在页面上方放一个输入框和“说话”按钮；把 字幕 以气泡形式显示；音频驱动 Worklet 播放 + 口型；并与 model.__director 联动。
import { useEffect, useMemo, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
// 负责：创建/复用 AudioContext 与 Worklet、推送 PCM16、必要时做重采样，并提供 Analyser 供口型使用。
import { usePCMWorkletPlayer } from '../hooks/usePCMWorkletPlayer'
// 使用主WebSocket系统而不是独立连接
import { useWebSocket, MESSAGE_TYPES } from '../hooks/useWebSocket'
import { useChatStore } from '../stores/chatStore'
import { useVoiceStore } from '../stores/voiceStore'

export default function TTSChat({ model, app }) {
  const [text, setText] = useState('给我讲个笑话')
  const [mood, setMood] = useState('happy')
  const [muted, setMuted] = useState(false)
  const [bubbles, setBubbles] = useState([]) // {id, text, role, partial}
  const [speaking, setSpeaking] = useState(false)

  const { analyser, pushPCM16, reset, setMuted: setPlayerMuted, ensureContext } = usePCMWorkletPlayer()

  // 使用主WebSocket系统
  const { sendMessage, isConnected } = useWebSocket()
  const { currentUserId } = useChatStore()
  const { tts } = useVoiceStore()

  // —— 口型：用 shared ticker 根据 analyser 输出 RMS 写 Live2D —— //
  // —— 口型：用 app.ticker，根据 analyser 输出 RMS 写 Live2D —— //
  useEffect(() => {
    if (!model || !app) return
    let removed = false
    let tick = null

    ;(async () => {
      // 确保 AudioContext & Worklet & Analyser 创建完成
      try {
        await ensureContext()
        await reset()         // 会触发 usePCMWorkletPlayer 内部的 ensureWorklet()
      } catch (e) {
        console.error('准备口型驱动失败:', e)
        return
      }

      const ATT_MS = 60, REL_MS = 120, THRESH = 0.02
      let level = 0
      const buf = new Float32Array(512)

      tick = () => {
        const an = analyser.current
        const core = model?.internalModel?.coreModel
        if (!an || !core) return

        an.getFloatTimeDomainData(buf)
        let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
        let target = Math.max(0, Math.sqrt(sum / buf.length) * 6 - THRESH)
        target = Math.min(1, target / (1 - THRESH))

        const dt = app.ticker.deltaMS || 16.7
        const tau = target > level ? ATT_MS : REL_MS
        const k = 1 - Math.exp(-dt / Math.max(1, tau))
        level += (target - level) * k

        const L = Math.max(0, Math.min(1, level))
        try { core.setParameterValueById('ParamMouthOpenY', Math.min(1, L * 1.6)) } catch {}
        try { core.setParameterValueById('ParamMouthForm', Math.min(1, L * 1.0)) } catch {}
      }

      // 用 app.ticker 确保一定在跑
      app.ticker.add(tick)
    })()

    return () => {
      if (!removed && tick) app.ticker.remove(tick)
      removed = true
    }
  }, [model, app])  // 注意：不再依赖 analyser；我们在内部确保它创建


  // —— 气泡定位（简单地锚在模型上方） —— //
  function getHeadAnchor() {
    if (!model || !app) return { x: 20, y: 20 }
    const b = model.getBounds()
    // 舞台坐标就是逻辑像素；容器用绝对定位叠在同尺寸区域即可
    return { x: b.x + b.width / 2, y: Math.max(b.y, b.y + b.height * 0.1) }
  }

  // —— 监听主WebSocket的TTS消息 —— //
  useEffect(() => {
    // 这些消息处理已经在useWebSocket中实现，这里只需要监听状态变化
    // 当收到TTS音频数据时，会通过useTTSPlayer自动播放

    // 监听TTS状态变化
    if (tts.isSpeaking && !speaking) {
      setSpeaking(true)
      try { (model.__director || model.__animDirector)?.speakStart?.({ mood }) } catch {}
    } else if (!tts.isSpeaking && speaking) {
      setSpeaking(false)
      try { (model.__director || model.__animDirector)?.speakStop?.() } catch {}
    }
  }, [tts.isSpeaking, speaking, model, mood])

  // 监听生成的消息内容，更新气泡显示
  useEffect(() => {
    const { currentBotMessage, messages } = useChatStore.getState()

    if (currentBotMessage) {
      setBubbles((prev) => {
        const last = [...prev]
        const i = last.length - 1
        if (i >= 0 && last[i].role === 'assistant' && last[i].partial) {
          last[i] = { ...last[i], text: currentBotMessage, partial: true }
          return last
        }
        return [...prev, { id: Date.now(), role: 'assistant', text: currentBotMessage, partial: true }]
      })
    }
  }, [])

  async function handleSpeak() {
    if (!model || !isConnected || !currentUserId) return

    setBubbles((prev) => [...prev, { id: Date.now()-1, role: 'user', text, partial: false }])
    setBubbles((prev) => [...prev, { id: Date.now(), role: 'assistant', text: '…', partial: true }])

    setSpeaking(true)
    await ensureContext()
    await reset()
    setPlayerMuted(!!muted)
    try { (model.__director || model.__animDirector)?.setMood?.(mood) } catch {}

    // 通过主WebSocket发送消息
    sendMessage({
      type: MESSAGE_TYPES.MESSAGE,
      content: text,
      user_id: currentUserId
    })
  }

  // —— UI —— //
  const anchor = getHeadAnchor()

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* 气泡层 */}
      {/*<div className="absolute" style={{ left: anchor.x, top: anchor.y - 40, transform: 'translate(-50%, -100%)', maxWidth: 320 }}>
        {bubbles.slice(-3).map((b) => (
          <div key={b.id} className={`mb-2 px-3 py-2 rounded-2xl shadow pointer-events-auto ${b.role==='user' ? 'bg-emerald-600 text-white self-end' : 'bg-gray-800/90 text-white'} ${b.partial ? 'animate-pulse' : ''}`}>{b.text}</div>
        ))}
      </div>*/}

      {/* 控制条（置于右下，允许交互） */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex gap-2 items-center pointer-events-auto bg-black/50 backdrop-blur px-3 py-2 rounded-xl">
        <input className="bg-transparent bg-gray-900 rounded px-2 py-1 text-white w-64" value={text} onChange={(e)=>setText(e.target.value)} placeholder="输入要合成的文本" />
        <select className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1" value={mood} onChange={(e)=>setMood(e.target.value)}>
          {['neutral','happy','angry','sad','surprised','thinking'].map(m=> <option key={m} value={m}>{m}</option>)}
        </select>
        <label className="text-white text-xs flex items-center gap-1"><input type="checkbox" checked={muted} onChange={(e)=>setMuted(e.target.checked)} /> 静音</label>
        <button onClick={handleSpeak} disabled={speaking} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded">{speaking?'合成中…':'说话'}</button>
        <button onClick={()=>{ close(); setSpeaking(false); try{(model.__director||model.__animDirector)?.speakStop?.()}catch{} }} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded">停止</button>
      </div>
    </div>
  )
}
