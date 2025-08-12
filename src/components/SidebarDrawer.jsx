import { Menu, X } from 'lucide-react'
import { Drawer } from 'vaul'

const SidebarDrawer = ({ children }) => {
  return (
    <Drawer.Root direction="left">
      <Drawer.Trigger asChild>
        <button
          className="fixed bottom-4 left-4 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors"
          title="打开侧边栏"
        >
          <Menu size={20} />
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="bg-white flex flex-col h-full w-80 fixed left-0 top-0 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Drawer.Title className="text-lg font-semibold text-gray-800">
                侧边栏
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

export default SidebarDrawer
