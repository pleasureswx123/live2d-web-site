# Live2D 控制面板组件规范

> 控制面板的详细组件结构和实现规范

## 🏗️ 组件架构

### 主要组件层级
```
Live2DControlPanel
├── ExpressionPanel
│   ├── ExpressionGrid
│   ├── ExpressionMixer
│   └── ExpressionPresets
├── MotionPanel
│   ├── MotionGroupTabs
│   ├── MotionSelector
│   ├── PlaybackControls
│   └── MotionQueue
├── AudioPanel
│   ├── AudioInput
│   ├── LipSyncControls
│   ├── AudioVisualizer
│   └── LipSyncPresets
├── EyePanel
│   ├── BlinkControls
│   ├── GazeControls
│   └── EyeExpressionControls
├── PosturePanel
│   ├── HeadControls
│   ├── BodyControls
│   ├── MouseFollowControls
│   └── PosturePresets
└── BreathingPanel
    ├── BreathingToggle
    ├── BreathingSettings
    └── BreathingModes
```

## 📁 文件结构规范

```
src/components/
├── Live2DControlPanel/
│   ├── index.jsx                 # 主控制面板
│   ├── ExpressionPanel/
│   │   ├── index.jsx
│   │   ├── ExpressionGrid.jsx
│   │   ├── ExpressionMixer.jsx
│   │   └── ExpressionPresets.jsx
│   ├── MotionPanel/
│   │   ├── index.jsx
│   │   ├── MotionGroupTabs.jsx
│   │   ├── MotionSelector.jsx
│   │   ├── PlaybackControls.jsx
│   │   └── MotionQueue.jsx
│   ├── AudioPanel/
│   │   ├── index.jsx
│   │   ├── AudioInput.jsx
│   │   ├── LipSyncControls.jsx
│   │   ├── AudioVisualizer.jsx
│   │   └── LipSyncPresets.jsx
│   ├── EyePanel/
│   │   ├── index.jsx
│   │   ├── BlinkControls.jsx
│   │   ├── GazeControls.jsx
│   │   └── EyeExpressionControls.jsx
│   ├── PosturePanel/
│   │   ├── index.jsx
│   │   ├── HeadControls.jsx
│   │   ├── BodyControls.jsx
│   │   ├── MouseFollowControls.jsx
│   │   └── PosturePresets.jsx
│   ├── BreathingPanel/
│   │   ├── index.jsx
│   │   ├── BreathingToggle.jsx
│   │   ├── BreathingSettings.jsx
│   │   └── BreathingModes.jsx
│   └── shared/
│       ├── PanelSection.jsx      # 通用面板容器
│       ├── SliderControl.jsx     # 通用滑块组件
│       ├── ToggleControl.jsx     # 通用开关组件
│       └── PresetManager.jsx     # 通用预设管理
```

## 🎨 UI 组件规范

### 通用组件要求

#### PanelSection 面板容器
```jsx
<PanelSection
  title="表情控制"
  icon="🎭"
  collapsible={true}
  defaultExpanded={true}
  className="expression-panel"
>
  {children}
</PanelSection>
```

#### SliderControl 滑块控制
```jsx
<SliderControl
  label="表情强度"
  value={intensity}
  min={0}
  max={100}
  step={1}
  unit="%"
  onChange={setIntensity}
  showValue={true}
  className="intensity-slider"
/>
```

#### ToggleControl 开关控制
```jsx
<ToggleControl
  label="自动眨眼"
  checked={autoEyeBlink}
  onChange={setAutoEyeBlink}
  description="启用自动眨眼功能"
  className="auto-blink-toggle"
/>
```

### 专用组件规范

#### ExpressionGrid 表情网格
```jsx
<ExpressionGrid
  expressions={[
    { name: 'aojiao', label: '傲娇', icon: '😤' },
    { name: 'wenroudexiao', label: '温柔的笑', icon: '😊' },
    // ... 其他表情
  ]}
  columns={4}
  selectedExpression="wenroudexiao"
  onExpressionSelect={handleExpressionSelect}
  showLabels={true}
  showIcons={true}
/>
```

#### MotionGroupTabs 动作分组标签
```jsx
<MotionGroupTabs
  groups={[
    { id: 'Idle', label: '待机', count: 2 },
    { id: 'TapBody', label: '身体交互', count: 3 },
    { id: 'TapHead', label: '头部交互', count: 2 }
  ]}
  activeGroup="Idle"
  onGroupChange={handleGroupChange}
/>
```

#### PlaybackControls 播放控制
```jsx
<PlaybackControls
  isPlaying={isPlaying}
  isPaused={isPaused}
  canPlay={true}
  canPause={true}
  canStop={true}
  onPlay={handlePlay}
  onPause={handlePause}
  onStop={handleStop}
  showProgress={true}
  progress={playProgress}
/>
```

#### AudioVisualizer 音频可视化
```jsx
<AudioVisualizer
  audioData={audioData}
  type="waveform" // 'waveform' | 'frequency' | 'bars'
  width={300}
  height={100}
  color="#3b82f6"
  backgroundColor="#f1f5f9"
  realtime={true}
/>
```

## 🔧 状态管理规范

### Zustand Store 结构
```javascript
// src/stores/live2dStore.js
export const useLive2DStore = create((set, get) => ({
  // 表情状态
  expression: {
    current: 'wenroudexiao',
    intensity: 100,
    mixed: [],
    presets: [],
    transitionSpeed: 500
  },
  
  // 动作状态
  motion: {
    currentGroup: 'Idle',
    currentMotion: 0,
    isPlaying: false,
    isPaused: false,
    speed: 1.0,
    loop: true,
    queue: [],
    autoPlay: false
  },
  
  // 音频状态
  audio: {
    source: null,
    isRecording: false,
    lipSync: {
      enabled: true,
      sensitivity: 100,
      language: 'zh-CN'
    },
    visualizer: {
      type: 'waveform',
      enabled: true
    }
  },
  
  // 眼部状态
  eye: {
    blink: {
      auto: true,
      frequency: 4000,
      mode: 'normal'
    },
    gaze: {
      followMouse: true,
      position: { x: 0, y: 0 },
      sensitivity: 1.0
    },
    expression: {
      leftSmile: 0,
      rightSmile: 0
    }
  },
  
  // 姿态状态
  posture: {
    head: { x: 0, y: 0, z: 0 },
    body: { x: 0, y: 0, z: 0 },
    followMouse: true,
    sensitivity: 1.0,
    limits: {
      head: { x: [-30, 30], y: [-30, 30], z: [-30, 30] },
      body: { x: [-15, 15], y: [-15, 15], z: [-15, 15] }
    },
    presets: []
  },
  
  // 呼吸状态
  breathing: {
    enabled: true,
    frequency: 20, // 每分钟次数
    intensity: 50, // 0-100%
    mode: 'normal', // 'calm' | 'normal' | 'excited'
    syncWithEmotion: false
  },
  
  // 全局设置
  settings: {
    panelPosition: 'right', // 'left' | 'right' | 'bottom'
    panelSize: 'medium', // 'small' | 'medium' | 'large'
    autoSave: true,
    shortcuts: true,
    theme: 'light' // 'light' | 'dark'
  },
  
  // Actions
  setExpression: (name, intensity = 100) => set((state) => ({
    expression: { ...state.expression, current: name, intensity }
  })),
  
  playMotion: (group, index) => set((state) => ({
    motion: { 
      ...state.motion, 
      currentGroup: group, 
      currentMotion: index,
      isPlaying: true,
      isPaused: false
    }
  })),
  
  setEyeBlink: (auto, frequency) => set((state) => ({
    eye: {
      ...state.eye,
      blink: { ...state.eye.blink, auto, frequency }
    }
  })),
  
  setHeadAngle: (x, y, z) => set((state) => ({
    posture: {
      ...state.posture,
      head: { x, y, z }
    }
  })),
  
  resetAll: () => set(() => ({
    // 重置所有状态到默认值
  }))
}))
```

## 🎯 交互行为规范

### 实时响应要求
- **参数调节**: 滑块拖动时实时更新模型
- **表情切换**: 点击后立即开始过渡
- **动作播放**: 点击后立即开始播放
- **开关切换**: 立即生效

### 防抖处理
```javascript
// 对频繁变化的参数进行防抖
const debouncedSetParameter = useMemo(
  () => debounce((paramId, value) => {
    live2dModel.setParameter(paramId, value)
  }, 16), // 约60fps
  [live2dModel]
)
```

### 错误处理
```javascript
// 统一的错误处理
const handleError = (error, context) => {
  console.error(`Live2D Error in ${context}:`, error)
  // 显示用户友好的错误提示
  toast.error(`${context}操作失败: ${error.message}`)
}
```

## 📱 响应式设计规范

### 断点设置
```css
/* Tailwind CSS 断点 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
```

### 布局适配
- **桌面端**: 侧边栏布局，面板固定在右侧
- **平板端**: 底部抽屉布局，可上拉展开
- **手机端**: 全屏模态布局，分页显示

### 触摸优化
- **按钮大小**: 最小44px×44px
- **滑块**: 增大触摸区域
- **手势**: 支持滑动切换面板

## 🎨 主题和样式规范

### 颜色系统
```css
/* 主题颜色变量 */
:root {
  --panel-bg: #ffffff;
  --panel-border: #e2e8f0;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --accent-primary: #3b82f6;
  --accent-secondary: #8b5cf6;
}

[data-theme="dark"] {
  --panel-bg: #1e293b;
  --panel-border: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --accent-primary: #60a5fa;
  --accent-secondary: #a78bfa;
}
```

### 动画规范
```css
/* 统一的动画时长 */
.transition-fast { transition-duration: 150ms; }
.transition-normal { transition-duration: 300ms; }
.transition-slow { transition-duration: 500ms; }

/* 缓动函数 */
.ease-smooth { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
```

## 🔧 开发工具和调试

### 开发模式功能
- **参数监控**: 实时显示所有参数值
- **性能监控**: FPS、内存使用情况
- **日志记录**: 详细的操作日志
- **状态导出**: 导出当前状态用于调试

### 调试面板
```jsx
{process.env.NODE_ENV === 'development' && (
  <DebugPanel
    showParameters={true}
    showPerformance={true}
    showLogs={true}
    exportState={true}
  />
)}
```

---

*此规范文档定义了控制面板的完整实现标准，所有组件开发必须严格遵循此规范。*
