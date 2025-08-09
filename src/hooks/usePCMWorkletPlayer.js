// 负责：创建/复用 AudioContext 与 Worklet、推送 PCM16、必要时做重采样，并提供 Analyser 供口型使用。
import { useEffect, useRef } from 'react'

export function usePCMWorkletPlayer() {
  const acRef = useRef(null)
  const nodeRef = useRef(null)
  const analyserRef = useRef(null)
  const gainRef = useRef(null)

  async function ensureContext() {
    if (!acRef.current || acRef.current.state === 'closed') {
      const AC = window.AudioContext || window.webkitAudioContext
      acRef.current = new AC({ latencyHint: 'interactive' })
    }
    if (acRef.current.state === 'suspended') await acRef.current.resume()
    return acRef.current
  }

  async function ensureWorklet() {
    const ac = await ensureContext()
    if (!nodeRef.current) {
      await ac.audioWorklet.addModule('/pcm-player.worklet.js')
      const node = new AudioWorkletNode(ac, 'pcm-player')
      const analyser = ac.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.05
      const gain = ac.createGain()
      gain.gain.value = 1

      node.connect(analyser)
      analyser.connect(gain)
      gain.connect(ac.destination)

      nodeRef.current = node
      analyserRef.current = analyser
      gainRef.current = gain
    }
    return { ac: acRef.current, node: nodeRef.current }
  }

  function setMuted(muted) {
    if (gainRef.current) gainRef.current.gain.value = muted ? 0 : 1
  }

  // PCM16(base64) → Float32，必要时重采样到 AC 采样率
  function pcm16ToFloat32(base64, srcRate, dstRate) {
    const bin = atob(base64)
    const len = bin.length / 2
    const pcm = new Int16Array(len)
    for (let i = 0; i < len; i++) {
      const lo = bin.charCodeAt(2*i)
      const hi = bin.charCodeAt(2*i + 1)
      const val = (hi << 8) | lo
      pcm[i] = val >= 0x8000 ? val - 0x10000 : val
    }
    // 转 float32 [-1,1]
    const f32src = new Float32Array(len)
    for (let i = 0; i < len; i++) f32src[i] = pcm[i] / 32768

    if (srcRate === dstRate) return f32src
    // 线性重采样
    const ratio = dstRate / srcRate
    const outLen = Math.round(f32src.length * ratio)
    const out = new Float32Array(outLen)
    for (let i = 0; i < outLen; i++) {
      const t = i / ratio
      const i0 = Math.floor(t)
      const i1 = Math.min(f32src.length - 1, i0 + 1)
      const alpha = t - i0
      out[i] = f32src[i0] * (1 - alpha) + f32src[i1] * alpha
    }
    return out
  }

  async function pushPCM16(base64, srcRate) {
    const { ac, node } = await ensureWorklet()
    const f32 = pcm16ToFloat32(base64, srcRate, ac.sampleRate)
    node.port.postMessage({ type: 'push', chunk: f32 }, [f32.buffer])
  }

  async function reset() {
    const { node } = await ensureWorklet()
    node.port.postMessage({ type: 'reset' })
  }

  useEffect(() => () => { try { acRef.current?.close() } catch {} }, [])

  return {
    analyser: analyserRef,
    pushPCM16,
    reset,
    setMuted,
    ensureContext,
  }
}
