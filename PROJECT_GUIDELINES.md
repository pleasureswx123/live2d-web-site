# Live2D Web Site 项目开发规则

> 本文档定义了 Live2D Web Site 项目的开发规范和必须遵循的规则

## 🌐 基本交互规范

### 语言规范
- **默认使用中文回复** - 除非用户特别要求使用英文
- **技术术语保持英文** - 如 React、PIXI.js、Live2D 等专业术语
- **注释和文档使用中文** - 提高团队理解效率

### 包管理规范
- **默认使用 pnpm 安装** - 所有依赖包管理操作
- **版本锁定** - 使用 pnpm-lock.yaml 确保版本一致性
- **依赖分类** - 区分 dependencies 和 devDependencies

## 📚 技术参考资源

### 官方文档
- **pixi-live2d-display 文档**: https://guansss.github.io/pixi-live2d-display/
- **pixi-live2d-display API**: https://guansss.github.io/pixi-live2d-display/api/
- **PIXI.js 官方文档**: https://pixijs.com/
- **React 官方文档**: https://react.dev/

### 版本兼容性 ✅ 已验证 (@pixi/react 解决方案)
- **PIXI.js**: 7.4.3 (与 @pixi/react 7.1.2 完美兼容)
- **@pixi/react**: 7.1.2 (官方 React 包装器)
- **pixi-live2d-display-lipsyncpatch**: 0.5.0-ls-8 (支持 PIXI.js v7)
- **React**: 18.2.0 (与 @pixi/react 兼容)
- **Node.js**: 18+ (推荐 LTS 版本)
- **Live2D Cubism Core**: 5.1.0 (已验证)

## 🏗️ 项目结构规范

### 目录组织
```
src/
├── components/
│   ├── ui/                    # shadcn/ui 组件
│   └── Live2DViewer.jsx       # Live2D 相关组件
├── lib/
│   ├── utils.js              # 通用工具函数
│   └── live2d-config.js      # Live2D 配置和工具
├── assets/                   # 静态资源
├── App.jsx                   # 主应用组件
└── main.jsx                  # 应用入口

public/
├── models/                   # Live2D 模型文件
│   └── [模型名]/
│       ├── [模型名].model3.json
│       ├── [模型名].moc3
│       ├── textures/
│       ├── *.exp3.json       # 表情文件
│       └── *.motion3.json    # 动作文件
└── library/                  # Live2D 库文件
    ├── live2dcubismcore.min.js
    └── live2d.min.js
```

### 文件命名规范
- **组件文件**: PascalCase (如 `Live2DViewer.jsx`)
- **工具文件**: kebab-case (如 `live2d-config.js`)
- **配置文件**: 遵循工具约定 (如 `vite.config.js`)
- **模型文件**: 使用拼音命名，避免中文字符

## 🎭 Live2D 开发规范

### 模型文件管理
- **文件命名**: 必须使用拼音，禁止中文字符
- **路径引用**: 确保 model3.json 中的所有路径引用正确
- **文件完整性**: 验证模型、纹理、表情、动作文件的完整性

### 参数组配置
必须配置以下参数组：
- **LipSync** - 唇同步功能
- **EyeBlink** - 自动眨眼
- **EyeGaze** - 眼球追踪
- **HeadMovement** - 头部运动
- **BodyMovement** - 身体运动
- **Breathing** - 呼吸效果
- **EyeExpression** - 眼部表情

### 性能优化
- **模型缩放**: 根据显示区域自动调整
- **渲染优化**: 使用 PIXI.js 的性能最佳实践
- **内存管理**: 及时清理不用的模型资源
- **帧率控制**: 保持稳定的渲染帧率

## 🎮 Live2D 功能需求规范

> 基于 `/public/models/youyou/youyou.model3.json` 配置的完整功能需求

### 核心功能模块

#### 1. 🎭 表情控制系统
**需求**: 实现完整的表情切换和控制功能

**功能列表** (基于 Expressions 配置):
- **傲娇** (aojiao) - 傲娇表情
- **叉腰** (chayao) - 叉腰姿态
- **哈哈大笑** (hahadaxiao) - 开心大笑
- **委屈** (weiqu) - 委屈表情
- **害羞** (haixiu) - 害羞表情
- **惊喜** (jingxi) - 惊喜表情
- **惊讶** (jingya) - 惊讶表情
- **托腮** (tuosai) - 托腮思考
- **抱胸** (baoxiong) - 抱胸姿态
- **挥手** (huishou) - 挥手表情
- **温柔的笑** (wenroudexiao) - 温柔微笑
- **生气** (shengqi) - 生气表情
- **电脑** (diannao) - 使用电脑
- **电脑发光** (diannaofaguang) - 电脑发光效果
- **眯眯眼** (mimiyan) - 眯眼表情
- **眼泪** (yanlei) - 流泪表情
- **脸红** (lianhong) - 脸红表情
- **落泪** (luolei) - 落泪表情
- **键盘抬起** (jianpantaiqi) - 键盘操作
- **鬼脸** (guilian) - 调皮鬼脸

**控制面板要求**:
- 表情选择器 (下拉菜单或网格布局)
- 表情预览功能
- 表情切换动画过渡
- 表情强度调节 (0-1)
- 表情混合功能 (多个表情叠加)

#### 2. 🎬 动作控制系统
**需求**: 实现动作播放和切换功能

**动作分组** (基于 Motions 配置):

**待机动作 (Idle)**:
- **睡觉** (sleep) - 睡眠动作
- **基础动画** (jichudonghua) - 基础待机动作

**身体交互 (TapBody)**:
- **挥手** (huishou) - 挥手动作
- **点头** (diantou) - 点头动作
- **摇头** (yaotou) - 摇头动作

**头部交互 (TapHead)**:
- **眼珠子** (yanzhuzi) - 眼珠转动
- **睡觉** (shuijiao) - 睡觉动作

**控制面板要求**:
- 动作分组选择器
- 动作播放控制 (播放/暂停/停止)
- 动作循环设置
- 动作播放速度调节
- 动作队列管理 (连续播放多个动作)

#### 3. 🎵 音频同步系统
**需求**: 实现唇同步和音频播放功能

**唇同步参数** (基于 LipSync 组):
- **ParamMouthForm** - 嘴部形状变化
- **ParamMouthOpenY** - 嘴部张开程度
- **MouthX** - 嘴部左右移动
- **MouthPuckerWiden** - 嘴部收缩张开

**控制面板要求**:
- 音频文件上传/选择
- 实时音频输入 (麦克风)
- 唇同步强度调节
- 音频波形显示
- 音频播放控制
- 唇同步参数手动调节

#### 4. 👁️ 眼部控制系统
**需求**: 实现眼部动画和交互功能

**眨眼控制** (基于 EyeBlink 组):
- **ParamEyeLOpen** - 左眼开闭
- **ParamEyeROpen** - 右眼开闭

**眼球追踪** (基于 EyeGaze 组):
- **ParamEyeBallX** - 眼珠X轴移动
- **ParamEyeBallY** - 眼珠Y轴移动

**眼部表情** (基于 EyeExpression 组):
- **ParamEyeLSmile** - 左眼微笑
- **ParamEyeRSmile** - 右眼微笑

**控制面板要求**:
- 自动眨眼开关和频率调节
- 手动眨眼触发
- 眼球跟随鼠标开关
- 眼球位置手动控制
- 眼部表情强度调节

#### 5. 🎯 头部和身体控制系统
**需求**: 实现头部和身体的姿态控制

**头部运动** (基于 HeadMovement 组):
- **ParamAngleX** - 头部X轴旋转
- **ParamAngleY** - 头部Y轴旋转
- **ParamAngleZ** - 头部Z轴旋转

**身体运动** (基于 BodyMovement 组):
- **ParamBodyAngleX** - 身体X轴旋转
- **ParamBodyAngleY** - 身体Y轴旋转
- **ParamBodyAngleZ** - 身体Z轴旋转

**控制面板要求**:
- 头部跟随鼠标开关
- 头部角度手动调节 (滑块控制)
- 身体姿态调节
- 姿态预设保存和加载
- 重置到默认姿态

#### 6. 🫁 呼吸效果系统
**需求**: 实现自然的呼吸动画

**呼吸控制** (基于 Breathing 组):
- **ParamBreath** - 呼吸效果参数

**控制面板要求**:
- 自动呼吸开关
- 呼吸频率调节
- 呼吸强度调节
- 呼吸模式选择 (平静/急促/深呼吸)

### 🎛️ 控制面板技术规范

#### 界面布局要求
- **响应式设计**: 适配桌面端和移动端
- **模块化布局**: 每个功能模块独立可折叠
- **实时预览**: 所有调节立即反映到模型上
- **状态保存**: 用户设置本地存储
- **快捷操作**: 支持键盘快捷键

#### 组件技术要求
- **使用 shadcn/ui 组件库**
- **Tailwind CSS 样式系统**
- **Zustand 状态管理** (复杂状态)
- **React Hook Form** (表单控制)
- **Framer Motion** (动画过渡)

#### 控制面板功能模块

**1. 表情控制面板**
```jsx
// 组件结构示例
<ExpressionPanel>
  <ExpressionSelector expressions={expressions} />
  <ExpressionIntensity value={intensity} onChange={setIntensity} />
  <ExpressionMixer selectedExpressions={mixed} />
  <ExpressionPresets presets={savedPresets} />
</ExpressionPanel>
```

**2. 动作控制面板**
```jsx
<MotionPanel>
  <MotionGroupSelector groups={motionGroups} />
  <MotionPlayback controls={playbackControls} />
  <MotionQueue queue={motionQueue} />
  <MotionSettings speed={speed} loop={loop} />
</MotionPanel>
```

**3. 音频控制面板**
```jsx
<AudioPanel>
  <AudioInput source={audioSource} />
  <LipSyncControls parameters={lipSyncParams} />
  <AudioVisualizer waveform={audioData} />
  <AudioSettings sensitivity={sensitivity} />
</AudioPanel>
```

**4. 眼部控制面板**
```jsx
<EyePanel>
  <BlinkControls auto={autoBlink} frequency={blinkRate} />
  <GazeControls followMouse={mouseFollow} position={eyePosition} />
  <EyeExpressionControls smile={eyeSmile} />
</EyePanel>
```

**5. 姿态控制面板**
```jsx
<PosturePanel>
  <HeadControls angles={headAngles} followMouse={headFollow} />
  <BodyControls angles={bodyAngles} />
  <PosturePresets presets={posturePresets} />
  <BreathingControls auto={autoBreath} settings={breathSettings} />
</PosturePanel>
```

#### 数据流和状态管理

**状态结构**:
```javascript
const live2dState = {
  // 表情状态
  expressions: {
    current: 'wenroudexiao',
    intensity: 1.0,
    mixed: [],
    presets: []
  },

  // 动作状态
  motions: {
    currentGroup: 'Idle',
    currentMotion: 0,
    isPlaying: false,
    speed: 1.0,
    loop: true,
    queue: []
  },

  // 音频状态
  audio: {
    source: null,
    lipSync: {
      enabled: true,
      sensitivity: 1.0,
      parameters: {}
    }
  },

  // 眼部状态
  eyes: {
    blink: {
      auto: true,
      frequency: 4000
    },
    gaze: {
      followMouse: true,
      position: { x: 0, y: 0 }
    },
    expression: {
      smile: 0
    }
  },

  // 姿态状态
  posture: {
    head: { x: 0, y: 0, z: 0 },
    body: { x: 0, y: 0, z: 0 },
    followMouse: true
  },

  // 呼吸状态
  breathing: {
    auto: true,
    frequency: 3000,
    intensity: 0.5,
    mode: 'calm'
  }
}
```

#### API 接口规范

**模型控制接口**:
```javascript
// 表情控制
setExpression(name, intensity = 1.0, duration = 500)
mixExpressions(expressions = [])
resetExpression()

// 动作控制
playMotion(group, index, priority = 3)
stopMotion()
queueMotion(motions = [])

// 参数控制
setParameter(id, value, duration = 0)
getParameter(id)
resetParameters()

// 音频控制
setAudioSource(source)
enableLipSync(enabled = true)
setLipSyncSensitivity(value)

// 眼部控制
setAutoEyeBlink(enabled, frequency)
setEyeGaze(x, y)
setEyeExpression(type, value)

// 姿态控制
setHeadAngle(x, y, z)
setBodyAngle(x, y, z)
enableMouseFollow(enabled)

// 呼吸控制
setBreathing(enabled, frequency, intensity)
```

### 🔧 实现优先级

#### 第一阶段 (核心功能)
1. ✅ **基础模型显示** - 已完成
2. 🎭 **表情切换系统** - 高优先级
3. 🎬 **基础动作播放** - 高优先级
4. 👁️ **眨眼和眼球跟踪** - 中优先级

#### 第二阶段 (交互增强)
1. 🎵 **音频和唇同步** - 高优先级
2. 🎯 **鼠标跟随** - 中优先级
3. 🫁 **呼吸效果** - 中优先级
4. 🎛️ **基础控制面板** - 高优先级

#### 第三阶段 (高级功能)
1. 🎨 **表情混合** - 中优先级
2. 📱 **移动端适配** - 中优先级
3. 💾 **设置保存** - 低优先级
4. 🎮 **快捷键支持** - 低优先级

#### 第四阶段 (扩展功能)
1. 🎪 **动作队列** - 低优先级
2. 📊 **性能监控** - 低优先级
3. 🎨 **主题切换** - 低优先级
4. 📤 **配置导出** - 低优先级

## 💻 代码开发规范

### React 组件规范
- **函数组件**: 优先使用函数组件和 Hooks
- **Props 类型**: 使用 JSDoc 注释说明 props 类型
- **状态管理**: 简单状态用 useState，复杂状态考虑 Zustand
- **副作用**: 合理使用 useEffect，注意清理函数

### 样式规范
- **Tailwind CSS**: 优先使用 Tailwind 类名
- **shadcn/ui**: 使用 shadcn/ui 组件库
- **CSS 变量**: 支持主题切换的颜色系统
- **响应式**: 移动端优先的响应式设计

### 代码质量
- **ESLint**: 遵循项目的 ESLint 配置
- **格式化**: 保持代码格式一致性
- **注释**: 关键逻辑必须添加中文注释
- **错误处理**: 完善的错误处理和用户提示

## 🔧 开发工作流

### 依赖管理
```bash
# 安装依赖
pnpm install

# 添加依赖
pnpm add [package-name]

# 添加开发依赖
pnpm add -D [package-name]

# 移除依赖
pnpm remove [package-name]
```

### 开发命令
```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview

# 代码检查
pnpm lint
```

### Git 工作流
- **提交信息**: 使用中文描述，格式清晰
- **分支管理**: 功能分支开发，主分支保持稳定
- **代码审查**: 重要功能需要代码审查

## 🛡️ 安全和最佳实践

### 操作安全
- **重要操作确认**: 删除文件、修改配置前征求确认
- **备份意识**: 重要修改前建议备份
- **权限控制**: 避免不必要的文件系统操作

### 性能考虑
- **Live2D 性能**: 监控模型渲染性能
- **内存使用**: 避免内存泄漏
- **加载优化**: 优化模型和资源加载速度
- **错误恢复**: 提供友好的错误处理

### 兼容性
- **浏览器支持**: 确保主流浏览器兼容
- **设备适配**: 支持不同屏幕尺寸
- **性能分级**: 根据设备性能调整功能

## 📝 文档维护

### 必须维护的文档
- **README.md**: 项目介绍和使用说明
- **SETUP.md**: 配置和安装指南
- **PROJECT_GUIDELINES.md**: 本开发规则文档
- **代码注释**: 关键函数和组件的注释

### 文档更新原则
- **同步更新**: 代码变更时同步更新文档
- **中文优先**: 文档使用中文编写
- **示例完整**: 提供完整的使用示例
- **版本记录**: 记录重要的版本变更

## 🚀 部署规范

### 部署前检查
- [ ] 所有测试通过
- [ ] Live2D 功能正常
- [ ] 响应式设计验证
- [ ] 性能指标达标
- [ ] 错误处理完善

### 部署平台
- **推荐**: Vercel (最佳兼容性)
- **备选**: Netlify, GitHub Pages
- **要求**: 支持静态文件托管和 HTTPS

---

## ⚠️ 重要提醒

1. **严格遵循**: 本文档的所有规范都必须严格遵循
2. **持续更新**: 随着项目发展及时更新本文档
3. **团队共识**: 所有开发者都必须熟悉并遵循这些规则
4. **质量优先**: 代码质量和用户体验是最高优先级

---

*最后更新: 2025年1月*
*版本: 1.0.0*
