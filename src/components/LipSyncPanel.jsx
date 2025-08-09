import { useState, useRef, useEffect } from 'react'
import * as PIXI from 'pixi.js'
import { Button } from './ui/button'
import { Mic, MicOff, Volume2, Settings, Radio, FileAudio, Link } from 'lucide-react'
import testAudioUrl from '../assets/test.wav'

export default function LipSyncPanel({ model, isModelLoaded }) {
  // —— UI 状态 —— //
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [sourceType, setSourceType] = useState('file') // 'file' | 'mic'
  const [sensitivity, setSensitivity] = useState(80)   // 10–100：越大越“钝”
  const [muteFile, setMuteFile] = useState(false)      // 文件播放是否静音
  const [monitorMic, setMonitorMic] = useState(false)  // 麦克风监听（默认关，以免回声）
  const [mood, setMood] = useState('neutral')          // neutral/happy/angry/sad/surprised/thinking
  const [linkAnim, setLinkAnim] = useState(true)       // 说话时自动动作/表情联动
  const [audioFile] = useState(testAudioUrl)

  // —— 音频/分析器/循环 —— //
  const acRef = useRef(null)            // AudioContext
  const srcRef = useRef(null)           // AudioBufferSourceNode 或 MediaStreamAudioSourceNode
  const streamRef = useRef(null)        // MediaStream（麦克风）
  const analyserRef = useRef(null)      // AnalyserNode
  const bufRef = useRef(null)           // Float32Array（时域缓冲，复用）
  const tickerFnRef = useRef(null)      // Pixi Ticker 回调
  const levelRef = useRef(0)            // 平滑后的开口级别（0~1）
  const mouthParamsRef = useRef([])     // 可用嘴型参数ID集合
  const fileGainRef = useRef(null)      // 文件音量节点（用于静音）
  const micGainRef = useRef(null)       // 麦克风音量节点（用于监听音量）

  // —— 检测可用嘴型参数 —— //
  const detectMouthParams = () => {
    if (!model?.internalModel?.coreModel) return ['ParamMouthOpenY'] // 至少返一个
    const core = model.internalModel.coreModel
    const candidates = ['ParamMouthOpenY', 'ParamMouthForm', 'MouthX', 'MouthPuckerWiden']
    const found = []
    for (const id of candidates) {
      try {
        const v = core.getParameterValueById(id)
        if (typeof v === 'number') found.push(id)
      } catch {}
    }
    if (!found.includes('ParamMouthOpenY')) found.unshift('ParamMouthOpenY')
    return Array.from(new Set(found))
  }

  useEffect(() => {
    mouthParamsRef.current = detectMouthParams()
  }, [model, isModelLoaded])

  // —— AudioContext/Analyser —— //
  async function ensureAudioContext() {
    if (!acRef.current || acRef.current.state === 'closed') {
      acRef.current = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' })
    }
    if (acRef.current.state === 'suspended') {
      await acRef.current.resume()
    }
    return acRef.current
  }

  function setupAnalyser() {
    const ac = acRef.current
    const an = ac.createAnalyser()
    an.fftSize = 512
    an.smoothingTimeConstant = 0.05
    analyserRef.current = an
    bufRef.current = new Float32Array(an.fftSize)
    return an
  }

  // —— 共享 Ticker 刷口型 —— //
  function startTicker() {
    const appTicker = PIXI.Ticker.shared
    const ATT_MS = 60
    const REL_MS = 120
    const THRESH = 0.02                          // 噪声门限
    const GAIN = Math.max(4, 0.2 * sensitivity)  // 粗略映射：sensitivity 越大，增益越小

    const fn = (delta) => {
      const an = analyserRef.current
      const buf = bufRef.current
      if (!an || !buf || !model?.internalModel?.coreModel) return

      // 时域 RMS
      an.getFloatTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
      const rms = Math.sqrt(sum / buf.length)

      // 门限 + 增益 + 归一化
      let target = Math.max(0, rms * GAIN - THRESH)
      target = target / (1 - THRESH)
      if (target > 1) target = 1

      // 攻/释（指数平滑）
      const dt = appTicker.deltaMS || (16.7 * delta)
      const tau = target > levelRef.current ? ATT_MS : REL_MS
      const k = 1 - Math.exp(-dt / Math.max(1, tau))
      levelRef.current += (target - levelRef.current) * k

      // 写入参数（覆盖模式，避免被动作/表情叠加）
      const core = model.internalModel.coreModel
      const L = Math.max(0, Math.min(1, levelRef.current))

      for (const id of mouthParamsRef.current) {
        try {
          let v = 0
          if (id === 'ParamMouthOpenY') v = Math.min(1, L * 1.6)
          else if (id === 'ParamMouthForm') v = Math.min(1, L * 1.0)
          else if (id === 'MouthX') v = Math.sin(performance.now() * 0.006) * L * 0.5
          else if (id === 'MouthPuckerWiden') v = Math.min(1, L * 1.2)
          else v = L
          core.setParameterValueById(id, Math.max(-1, Math.min(1, v)))
        } catch {}
      }
    }

    tickerFnRef.current = fn
    appTicker.add(fn)
  }

  function stopTicker() {
    const appTicker = PIXI.Ticker.shared
    if (tickerFnRef.current) {
      appTicker.remove(tickerFnRef.current)
      tickerFnRef.current = null
    }
  }

  // —— 和动作联动 —— //
  function speakStartAnim() {
    if (!linkAnim) return
    const director = model && (model.__director || model.__animDirector)
    try { director?.setMood?.(mood) } catch {}
    try { director?.speakStart?.({ mood }) } catch {}
  }

  function speakStopAnim() {
    if (!linkAnim) return
    const director = model && (model.__director || model.__animDirector)
    try { director?.speakStop?.() } catch {}
  }

  // —— 文件音源 —— //
  async function startFile() {
    const ac = await ensureAudioContext()
    const res = await fetch(audioFile)
    if (!res.ok) throw new Error(`Fetch audio failed: ${res.status}`)
    const ab = await res.arrayBuffer()
    const buffer = await ac.decodeAudioData(ab)

    const analyser = setupAnalyser()
    const src = ac.createBufferSource()
    const gain = ac.createGain()
    fileGainRef.current = gain

    src.buffer = buffer
    srcRef.current = src

    // 连接（是否静音由 gain 控制）
    src.connect(analyser)
    analyser.connect(gain)
    gain.connect(ac.destination)
    gain.gain.value = muteFile ? 0 : 1

    src.onended = () => {
      stopTicker()
      // 复位嘴型
      try {
        const core = model?.internalModel?.coreModel
        if (core) for (const id of mouthParamsRef.current) core.setParameterValueById(id, 0)
      } catch {}
      srcRef.current = null
      setIsSpeaking(false)
      speakStopAnim()
    }

    startTicker()
    speakStartAnim()
    src.start()
  }

  // —— 麦克风音源 —— //
  async function startMic() {
    const ac = await ensureAudioContext()
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const analyser = setupAnalyser()
    const src = ac.createMediaStreamSource(stream)
    srcRef.current = src

    const gain = ac.createGain()
    micGainRef.current = gain
    gain.gain.value = monitorMic ? 1 : 0

    // 分析 + 可选监听
    src.connect(analyser)
    analyser.connect(gain)
    gain.connect(ac.destination)

    // 没有 onended 事件，停止在 stopSpeaking 里做
    startTicker()
    speakStartAnim()
  }

  // —— 启停 —— //
  const startSpeaking = async () => {
    if (isSpeaking || !model || !isModelLoaded) return
    try {
      setIsSpeaking(true)
      if (sourceType === 'file') {
        await startFile()
      } else {
        await startMic()
      }
    } catch (e) {
      console.error('启动口型同步失败:', e)
      setIsSpeaking(false)
      speakStopAnim()
      // 若是权限问题给个提示
      if (String(e).toLowerCase().includes('permission') || String(e).toLowerCase().includes('not allowed')) {
        alert('麦克风需要浏览器授权（请在 HTTPS 或 localhost 下运行，并允许麦克风权限）')
      }
    }
  }

  const stopSpeaking = () => {
    try {
      // 停音源
      if (srcRef.current) {
        if ('stop' in srcRef.current && typeof srcRef.current.stop === 'function') {
          try { srcRef.current.stop() } catch {}
        }
        srcRef.current = null
      }
      // 停麦克风 tracks
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks?.() || []) {
          try { t.stop() } catch {}
        }
        streamRef.current = null
      }
    } finally {
      stopTicker()
      // 复位嘴型
      try {
        const core = model?.internalModel?.coreModel
        if (core) for (const id of mouthParamsRef.current) core.setParameterValueById(id, 0)
      } catch {}
      setIsSpeaking(false)
      speakStopAnim()
    }
  }

  // —— 静音/监听切换 —— //
  useEffect(() => {
    if (fileGainRef.current) fileGainRef.current.gain.value = muteFile ? 0 : 1
  }, [muteFile])

  useEffect(() => {
    if (micGainRef.current) micGainRef.current.gain.value = monitorMic ? 1 : 0
  }, [monitorMic])

  // —— 卸载清理 —— //
  useEffect(() => {
    return () => {
      stopSpeaking()
      if (acRef.current) {
        try { acRef.current.close() } catch {}
        acRef.current = null
      }
    }
  }, [])

  // —— UI —— //
  const disableStart = !model || !isModelLoaded || isSpeaking || (sourceType === 'file' && !audioFile)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Volume2 size={20} />
          口型同步
        </h3>
      </div>

      {/* 音源选择 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSourceType('file')}
          className={`flex items-center gap-2 p-2 rounded border ${sourceType==='file' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700'}`}
        >
          <FileAudio size={16} /> 文件
        </button>
        <button
          onClick={() => setSourceType('mic')}
          className={`flex items-center gap-2 p-2 rounded border ${sourceType==='mic' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700'}`}
        >
          <Radio size={16} /> 麦克风
        </button>
      </div>

      {/* 文件/麦克风附加选项 */}
      {sourceType === 'file' ? (
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={muteFile} onChange={(e)=>setMuteFile(e.target.checked)} />
          静音播放（只驱动口型）
        </label>
      ) : (
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={monitorMic} onChange={(e)=>setMonitorMic(e.target.checked)} />
          监听麦克风（可能产生回声）
        </label>
      )}

      {/* 动作联动 */}
      <div className="grid grid-cols-2 gap-2 items-center">
        <label className="text-sm flex items-center gap-2 col-span-2">
          <input type="checkbox" checked={linkAnim} onChange={(e)=>setLinkAnim(e.target.checked)} />
          <Link size={16} /> 说话时自动动作/表情联动
        </label>
        <div className="text-sm text-gray-300">情绪：</div>
        <select
          className="bg-gray-800 border border-gray-600 rounded p-2 text-sm"
          value={mood}
          onChange={(e)=>setMood(e.target.value)}
        >
          <option value="neutral">neutral</option>
          <option value="happy">happy</option>
          <option value="angry">angry</option>
          <option value="sad">sad</option>
          <option value="surprised">surprised</option>
          <option value="thinking">thinking</option>
        </select>
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-2">
        <Button onClick={startSpeaking} disabled={disableStart} className="flex-1" variant={isSpeaking ? 'secondary' : 'default'}>
          {isSpeaking ? (<><MicOff size={16} className="mr-2" /> 正在说话…</>) : (<><Mic size={16} className="mr-2" /> 开始说话</>)}
        </Button>
        <Button onClick={stopSpeaking} disabled={!isSpeaking} variant="destructive" className="flex-1">
          停止
        </Button>
      </div>

      {/* 敏感度 */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Settings size={16} />
          敏感度：{sensitivity}
        </label>
        <input
          type="range" min="10" max="100" step="5"
          value={sensitivity}
          onChange={(e)=>setSensitivity(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>灵敏</span><span>钝化</span>
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• 麦克风需要 HTTPS 或 localhost，且需允许浏览器权限。</p>
        <p>• 口型刷新与 Pixi 同步，性能更稳；停止时会复位所有嘴部参数。</p>
      </div>
    </div>
  )
}
