import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Live2D Web Site
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              使用 React + Vite + Tailwind CSS + shadcn/ui
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
              <p className="text-lg mb-4">计数器测试</p>
              <Button
                onClick={() => setCount((count) => count + 1)}
                className="text-lg px-6 py-3"
              >
                点击次数: {count}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="p-6 border rounded-lg bg-card">
                <h3 className="font-semibold mb-2">Tailwind CSS</h3>
                <p className="text-sm text-muted-foreground">
                  实用优先的 CSS 框架，已配置完成
                </p>
              </div>
              <div className="p-6 border rounded-lg bg-card">
                <h3 className="font-semibold mb-2">shadcn/ui</h3>
                <p className="text-sm text-muted-foreground">
                  美观的 React 组件库，已配置完成
                </p>
              </div>
              <div className="p-6 border rounded-lg bg-card">
                <h3 className="font-semibold mb-2">Live2D</h3>
                <p className="text-sm text-muted-foreground">
                  准备集成 Live2D 显示功能
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
