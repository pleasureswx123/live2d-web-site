import { useState } from 'react'
import { runExpressionTest, matchExpression, EXPRESSION_NAMES } from '../utils/expressionTest'

export default function ExpressionTestPanel() {
  const [testText, setTestText] = useState('')
  const [matchResult, setMatchResult] = useState(null)

  const handleTest = () => {
    const result = matchExpression(testText)
    setMatchResult(result)
    
    // 如果有匹配结果，尝试播放表情
    if (result && window.live2dModel) {
      try {
        if (typeof window.live2dModel.expression === 'function') {
          window.live2dModel.expression(result.expression)
          console.log(`🎭 播放表情: ${result.expression}`)
        }
      } catch (error) {
        console.error('表情播放失败:', error)
      }
    }
  }

  const runAllTests = () => {
    runExpressionTest()
  }

  const testSamples = [
    '哈哈，这太好笑了！',
    '我有点生气了',
    '好害羞啊，不好意思',
    '让我想想这个问题',
    '太棒了，真是太惊喜了！',
    '什么？这怎么可能！',
    '呜呜，我好委屈',
    '谢谢你，这样很好'
  ]

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">🎭 Live2D表情同步测试</h2>
      
      {/* 文本输入测试 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">文本表情匹配测试</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="输入包含表情关键词的文本..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleTest}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            测试匹配
          </button>
        </div>
        
        {matchResult && (
          <div className="p-3 bg-green-100 border border-green-300 rounded">
            <p><strong>匹配表情:</strong> {EXPRESSION_NAMES[matchResult.expression] || matchResult.expression}</p>
            <p><strong>关键词:</strong> {matchResult.keyword}</p>
            <p><strong>表情ID:</strong> {matchResult.expression}</p>
          </div>
        )}
        
        {testText && !matchResult && (
          <div className="p-3 bg-yellow-100 border border-yellow-300 rounded">
            <p>未匹配到任何表情</p>
          </div>
        )}
      </div>

      {/* 示例文本快速测试 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">示例文本快速测试</h3>
        <div className="grid grid-cols-2 gap-2">
          {testSamples.map((sample, index) => (
            <button
              key={index}
              onClick={() => {
                setTestText(sample)
                const result = matchExpression(sample)
                setMatchResult(result)
                
                // 自动播放表情
                if (result && window.live2dModel) {
                  try {
                    if (typeof window.live2dModel.expression === 'function') {
                      window.live2dModel.expression(result.expression)
                    }
                  } catch (error) {
                    console.error('表情播放失败:', error)
                  }
                }
              }}
              className="p-2 text-sm bg-gray-200 hover:bg-gray-300 rounded text-left"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* 控制台测试 */}
      <div>
        <h3 className="text-lg font-semibold mb-2">控制台测试</h3>
        <button
          onClick={runAllTests}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          运行完整测试 (查看控制台)
        </button>
        <p className="text-sm text-gray-600 mt-2">
          点击按钮后，请查看浏览器控制台查看详细测试结果
        </p>
      </div>

      {/* 表情列表 */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">可用表情列表</h3>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {Object.entries(EXPRESSION_NAMES).map(([id, name]) => (
            <div key={id} className="p-2 bg-blue-100 rounded">
              <div className="font-medium">{name}</div>
              <div className="text-gray-600">{id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
