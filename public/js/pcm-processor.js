// PCM音频处理器工作节点
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.bufferSize = 1024
    this.buffer = new Float32Array(this.bufferSize)
    this.bufferIndex = 0
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0]
    
    if (input.length > 0) {
      const inputChannel = input[0]
      
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex] = inputChannel[i]
        this.bufferIndex++
        
        if (this.bufferIndex >= this.bufferSize) {
          // 转换为16位PCM
          const pcmData = new Int16Array(this.bufferSize)
          for (let j = 0; j < this.bufferSize; j++) {
            // 将浮点数转换为16位整数
            const sample = Math.max(-1, Math.min(1, this.buffer[j]))
            pcmData[j] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
          }
          
          // 发送PCM数据
          this.port.postMessage({
            type: 'pcm-data',
            data: pcmData
          })
          
          this.bufferIndex = 0
        }
      }
    }
    
    return true
  }
}

registerProcessor('pcm-processor', PCMProcessor)
