import { Drawer } from 'vaul'
import { Settings, X } from 'lucide-react'

const RightDrawer = ({ children }) => {
  return (
    <Drawer.Root direction="right">
      <Drawer.Trigger asChild>
        <button
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="打开设置面板"
        >
          <Settings size={24} />
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="bg-white flex flex-col h-full w-[400px] fixed right-0 top-0 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Drawer.Title className="text-lg font-semibold text-gray-800">
                设置面板
              </Drawer.Title>
              <Drawer.Close asChild>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </Drawer.Close>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {children || (
              <div className="text-gray-500 text-center mt-8">
                <p>这里可以放置你的组件</p>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export default RightDrawer
