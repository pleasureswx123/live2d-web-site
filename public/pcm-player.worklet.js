/* public/pcm-player.worklet.js */
// AudioWorklet 播放器
'use strict';

// 说明：
// - 运行在 AudioWorkletGlobalScope（不能使用 import/export）。
// - 通过 this.port.onmessage 接收主线程推送的 Float32Array（单声道样本，-1..1）。
// - 使用一个简单的队列依次播放；输出到所有声道。

class PCMPlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = [];      // Float32Array 队列
    this.current = null;  // 当前帧缓冲
    this.readIndex = 0;   // 当前帧内读指针

    this.port.onmessage = (e) => {
      const { type, chunk } = e.data || {};
      if (type === 'push' && chunk && chunk.length) {
        // 主线程通过 transferList 发送的 Float32Array
        this.queue.push(chunk);
      } else if (type === 'reset') {
        this.queue.length = 0;
        this.current = null;
        this.readIndex = 0;
      }
    };
  }

  _ensureCurrent() {
    if (!this.current || this.readIndex >= this.current.length) {
      this.current = this.queue.shift() || null;
      this.readIndex = 0;
    }
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    const ch0 = output[0];

    // 填充左声道
    for (let i = 0; i < ch0.length; i++) {
      this._ensureCurrent();
      ch0[i] = this.current ? this.current[this.readIndex++] : 0;
    }

    // 复制到其他声道（若有）
    for (let ch = 1; ch < output.length; ch++) {
      const dst = output[ch];
      for (let i = 0; i < dst.length; i++) dst[i] = ch0[i];
    }

    return true; // 持续运行
  }
}

// ★ 别漏了这行：注册处理器名称 'pcm-player'
registerProcessor('pcm-player', PCMPlayerProcessor);
