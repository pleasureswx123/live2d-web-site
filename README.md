# Live2D Web Site

一个基于 React + Vite + Live2D 的现代化 Web 应用，支持 Live2D Cubism 4.x 模型显示和交互。

## ✨ 特性

- 🎭 **Live2D 模型支持** - 完整的 Cubism 4.x 支持
- ⚡ **高性能渲染** - 基于 PIXI.js 6.5.10 的硬件加速
- 🎮 **丰富交互** - 鼠标跟踪、点击响应、表情动作
- 🎵 **音频支持** - 唇同步、音效播放
- 📱 **响应式设计** - 适配各种屏幕尺寸
- 🎨 **现代化 UI** - Tailwind CSS + shadcn/ui

## 🛠 技术栈

- **React 19** - 现代化的前端框架
- **Vite** - 快速的构建工具
- **PIXI.js 6.5.10** - 高性能 2D 渲染引擎
- **pixi-live2d-display 0.4.0** - Live2D 显示库
- **@pixi/sound 4.3.0** - 音频处理库
- **Tailwind CSS** - 实用优先的 CSS 框架
- **shadcn/ui** - 美观的 React 组件库

## 📦 已安装的核心依赖

### Live2D 相关
```json
{
  "pixi.js": "^6.5.10",
  "pixi-live2d-display": "^0.4.0",
  "@pixi/sound": "^4.3.0"
}
```

### 库文件 (public/library/)
- `live2dcubismcore.min.js` - Live2D Core 库
- `live2d.min.js` - Live2D Framework
- `live2dcubismcore.js.map` - Source Map

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 📁 项目结构

```
src/
├── components/
│   ├── ui/                    # shadcn/ui 组件
│   └── Live2DViewer.jsx       # Live2D 模型查看器
├── lib/
│   └── live2d-config.js       # Live2D 配置和工具
├── assets/                    # 静态资源
├── App.jsx                    # 主应用组件
└── main.jsx                   # 应用入口

public/
├── models/
│   └── youyou/               # 悠悠模型文件
│       ├── youyou.model3.json # 模型配置
│       ├── youyou.moc3       # 模型数据
│       ├── textures/         # 纹理文件
│       ├── *.exp3.json       # 表情文件
│       └── *.motion3.json    # 动作文件
└── library/                  # Live2D 库文件
    ├── live2dcubismcore.min.js
    └── live2d.min.js
```

## 🎭 Live2D 功能

### 已配置的参数组
- **LipSync** - 唇同步 (4个参数)
- **EyeBlink** - 自动眨眼 (2个参数)
- **EyeGaze** - 眼球追踪 (2个参数)
- **HeadMovement** - 头部运动 (3个参数)
- **BodyMovement** - 身体运动 (3个参数)
- **Breathing** - 呼吸效果 (1个参数)
- **EyeExpression** - 眼部表情 (2个参数)

### 模型资源
- **20个表情文件** - 完整的情感表达
- **7个动作文件** - 丰富的交互动作
- **103个参数** - 精细的控制能力

## 🎮 使用方法

### 基础使用

```jsx
import Live2DViewer from './components/Live2DViewer'

function App() {
  return (
    <Live2DViewer
      modelPath="/models/youyou/youyou.model3.json"
      width={600}
      height={400}
      onModelLoad={(model, app, info) => {
        console.log('模型加载完成:', info)
      }}
    />
  )
}
```

## 🤖 AI聊天系统集成

本项目已成功集成了完整的AI聊天系统，包含以下功能：

### 💬 智能对话
- **实时聊天**：WebSocket实时通信
- **语音交互**：ASR语音识别 + TTS语音合成
- **Live2D融合**：表情动作与对话内容同步

### 🎭 Live2D智能交互
- **情感表达**：根据对话内容自动切换表情
- **动作响应**：思考、说话、倾听等自然动作
- **口型同步**：TTS播放时的实时口型同步

### 👤 用户档案系统
- **智能档案**：自动收集用户信息
- **对话阶段**：6个关系阶段的智能管理
- **主动对话**：AI主动发起话题

### 🎤 语音功能
- **多引擎支持**：讯飞、豆包等ASR引擎
- **多音色TTS**：可调语速的语音合成
- **便捷录音**：长按空格键或麦克风按钮

### 📊 系统监控
- **性能监测**：实时监控响应时间
- **状态管理**：完整的系统状态追踪
- **错误处理**：智能错误检测和恢复

### 🚀 使用方法

1. **启动后端服务**（需要先启动live2d-server项目中的Python服务）
2. **启动前端项目**：`pnpm dev`
3. **访问应用**：`http://localhost:5173`
4. **开始聊天**：点击左上角图标开始使用各项功能

详细使用指南请参考 [TESTING_GUIDE.md](TESTING_GUIDE.md)

## 📄 许可证

MIT License
