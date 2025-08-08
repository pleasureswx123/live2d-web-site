# Live2D Web Site 配置文档

## 项目概述
这是一个基于 React + Vite 的 Live2D 网站项目，已完成 Tailwind CSS 和 shadcn/ui 的初始化配置。

## 已安装的依赖包

### 核心依赖
- `react` (19.1.1) - React 框架
- `react-dom` (19.1.1) - React DOM 渲染
- `vite` (5.4.19) - 构建工具

### UI 和样式
- `tailwindcss` (3.4.17) - CSS 框架
- `@shadcn/ui` (0.0.4) - UI 组件库
- `@radix-ui/react-dialog` (1.1.14) - 对话框组件
- `@radix-ui/react-popover` (1.1.14) - 弹出框组件
- `@radix-ui/react-dropdown-menu` (2.1.15) - 下拉菜单组件
- `@radix-ui/react-slot` - Slot 组件
- `class-variance-authority` (0.7.1) - 样式变体管理
- `clsx` (2.1.1) - 条件类名工具
- `tailwind-merge` (3.3.1) - Tailwind 类名合并

### 动画和交互
- `framer-motion` (12.23.12) - 动画库
- `react-intersection-observer` (9.16.0) - 交叉观察器
- `vaul` (1.1.2) - 抽屉组件

### Live2D 相关
- `pixi-live2d-display` (0.4.0) - Live2D 显示库
- `pixi.js` (6.5.10) - 2D 渲染引擎

### 图标和工具
- `lucide-react` (0.539.0) - 图标库
- `zustand` (5.0.7) - 状态管理

### 开发依赖
- `autoprefixer` (10.4.21) - CSS 自动前缀

## 配置文件

### 1. Tailwind CSS 配置 (`tailwind.config.js`)
- 配置了内容路径扫描
- 添加了 shadcn/ui 的颜色系统
- 配置了自定义动画和边框半径

### 2. PostCSS 配置 (`postcss.config.js`)
- 自动生成，包含 Tailwind CSS 和 autoprefixer

### 3. Vite 配置 (`vite.config.js`)
- 添加了路径别名 `@` 指向 `./src`

### 4. JavaScript 配置 (`jsconfig.json`)
- 配置了基础路径和路径映射

### 5. shadcn/ui 配置 (`components.json`)
- 配置了组件样式和路径别名

## 项目结构
```
src/
├── components/
│   └── ui/
│       └── button.jsx     # shadcn/ui Button 组件
├── lib/
│   └── utils.js          # 工具函数 (cn)
├── assets/
├── App.jsx               # 主应用组件
├── main.jsx              # 应用入口
└── index.css             # 全局样式 (包含 Tailwind CSS)
```

## 样式系统

### CSS 变量
项目使用 CSS 变量系统，支持亮色和暗色主题：
- `--background`, `--foreground` - 背景和前景色
- `--primary`, `--secondary` - 主要和次要颜色
- `--muted`, `--accent` - 静音和强调色
- `--destructive` - 危险操作颜色
- `--border`, `--input`, `--ring` - 边框、输入框、焦点环颜色

### Tailwind CSS 类
所有 Tailwind CSS 类都可以正常使用，包括：
- 响应式设计类
- 颜色系统类
- 布局和间距类
- 动画类

## 开发服务器
```bash
pnpm dev
```
服务器运行在 `http://localhost:5173`

## 下一步
1. 集成 Live2D 模型显示功能
2. 添加更多 shadcn/ui 组件
3. 实现主题切换功能
4. 添加页面路由
5. 集成状态管理

## 注意事项
- 使用 Vite 5.4.19 版本以避免兼容性问题
- 所有路径别名使用 `@/` 前缀
- 组件使用 `.jsx` 扩展名
- 已配置完整的 TypeScript 类型支持（通过 jsconfig.json）
