/**
 * Live2D表情同步测试工具
 * 用于测试表情关键词匹配功能
 */

// 表情关键词映射表 - 与WebSocketContext中保持一致
const EXPRESSION_KEYWORDS = {
  // 强烈情感表情 - 高优先级
  'shengqi': ['生气', '愤怒', '讨厌', '烦死了', '气死了', '可恶', '混蛋'],
  'weiqu': ['委屈', '难过', '伤心', '呜呜', '好难过', '心疼'],
  'yanlei': ['哭', '眼泪', '流泪', '哭泣', '泪水', '呜呜呜'],
  'hahadaxiao': ['哈哈', '大笑', '笑死', '太好笑', '哈哈哈', '笑', '开心', '高兴', '快乐'],
  'jingya': ['惊讶', '什么', '怎么会', '不会吧', '天哪', '我的天', '震惊'],
  'jingxi': ['惊喜', '太好了', '棒', '厉害', 'amazing', '太棒了', 'wonderful'],
  
  // 中等情感表情 - 中优先级  
  'haixiu': ['害羞', '不好意思', '羞涩', '脸红红', '好害羞'],
  'lianhong': ['脸红', '羞', '红脸', '害羞'],
  'aojiao': ['傲娇', '得意', '骄傲', '哼', '才不是', '略略略'],
  'tuosai': ['思考', '想想', '让我想想', '嗯嗯', '考虑', '琢磨'],
  'mimiyan': ['满足', '舒服', '嗯', '不错', '挺好', '还行'],
  
  // 温和表情 - 低优先级
  'wenroudexiao': ['微笑', '温柔', '好的', '嗯好', '可以', '没问题', '谢谢']
}

// 表情匹配函数
const matchExpression = (text) => {
  if (!text || typeof text !== 'string') return null
  
  // 按优先级顺序检查关键词
  for (const [expression, keywords] of Object.entries(EXPRESSION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return { expression, keyword }
      }
    }
  }
  
  return null
}

// 测试用例
const testCases = [
  '哈哈，这太好笑了！',
  '我有点生气了',
  '好害羞啊，不好意思',
  '让我想想这个问题',
  '太棒了，真是太惊喜了！',
  '什么？这怎么可能！',
  '呜呜，我好委屈',
  '谢谢你，这样很好',
  '我很开心能帮助你',
  '这让我很满足',
  '普通的文本，没有表情关键词'
]

// 运行测试
export const runExpressionTest = () => {
  console.log('🎭 开始表情匹配测试...')
  console.log('=' * 50)
  
  testCases.forEach((text, index) => {
    const result = matchExpression(text)
    console.log(`测试 ${index + 1}: "${text}"`)
    if (result) {
      console.log(`  ✅ 匹配表情: ${result.expression} (关键词: ${result.keyword})`)
    } else {
      console.log(`  ❌ 无匹配表情`)
    }
    console.log('')
  })
  
  console.log('🎭 表情匹配测试完成')
}

// 表情名称映射（中文显示）
export const EXPRESSION_NAMES = {
  'aojiao': '傲娇',
  'hahadaxiao': '哈哈大笑', 
  'haixiu': '害羞',
  'jingxi': '惊喜',
  'jingya': '惊讶',
  'shengqi': '生气',
  'weiqu': '委屈',
  'wenroudexiao': '温柔的笑',
  'yanlei': '眼泪',
  'lianhong': '脸红',
  'mimiyan': '眯眯眼',
  'tuosai': '托腮'
}

export { matchExpression, EXPRESSION_KEYWORDS }
