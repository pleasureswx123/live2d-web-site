# Live2D 功能需求详细规范

> 基于 `/public/models/youyou/youyou.model3.json` 配置的完整功能实现规范

## 📋 功能总览

### 🎭 表情系统 (20个表情) ✅ 已验证
| 表情名称 | 拼音标识 | 功能描述 | 优先级 |
|---------|---------|---------|--------|
| 傲娇 | aojiao | 傲娇表情，微微撅嘴 | 高 |
| 叉腰 | chayao | 叉腰姿态，自信表现 | 中 |
| 哈哈大笑 | hahadaxiao | 开心大笑，眼睛弯曲 | 高 |
| 委屈 | weiqu | 委屈表情，眼含泪水 | 高 |
| 害羞 | haixiu | 害羞表情，脸红低头 | 高 |
| 惊喜 | jingxi | 惊喜表情，眼睛发亮 | 中 |
| 惊讶 | jingya | 惊讶表情，张大嘴巴 | 中 |
| 托腮 | tuosai | 托腮思考，手托下巴 | 中 |
| 抱胸 | baoxiong | 抱胸姿态，双手交叉 | 中 |
| 挥手 | huishou | 挥手表情，友好招呼 | 高 |
| 温柔的笑 | wenroudexiao | 温柔微笑，默认表情 | 高 |
| 生气 | shengqi | 生气表情，皱眉瞪眼 | 高 |
| 电脑 | diannao | 使用电脑，专注状态 | 低 |
| 电脑发光 | diannaofaguang | 电脑发光效果 | 低 |
| 眯眯眼 | mimiyan | 眯眼表情，满足状态 | 中 |
| 眼泪 | yanlei | 流泪表情，伤心状态 | 高 |
| 脸红 | lianhong | 脸红表情，害羞状态 | 高 |
| 落泪 | luolei | 落泪表情，哭泣状态 | 中 |
| 键盘抬起 | jianpantaiqi | 键盘操作姿态 | 低 |
| 鬼脸 | guilian | 调皮鬼脸，吐舌头 | 中 |

### 🎬 动作系统 (7个动作，3个分组) ✅ 已验证

#### Idle 待机动作组
| 动作名称 | 拼音标识 | 功能描述 | 循环 |
|---------|---------|---------|------|
| 睡觉 | sleep | 睡眠动作，缓慢呼吸 | 是 |
| 基础动画 | jichudonghua | 基础待机动作 | 是 |

#### TapBody 身体交互组
| 动作名称 | 拼音标识 | 功能描述 | 触发方式 |
|---------|---------|---------|---------|
| 挥手 | huishou | 挥手动作 | 点击身体 |
| 点头 | diantou | 点头动作 | 点击身体 |
| 摇头 | yaotou | 摇头动作 | 点击身体 |

#### TapHead 头部交互组
| 动作名称 | 拼音标识 | 功能描述 | 触发方式 |
|---------|---------|---------|---------|
| 眼珠子 | yanzhuzi | 眼珠转动 | 点击头部 |
| 睡觉 | shuijiao | 睡觉动作 | 点击头部 |

### 🎛️ 参数控制系统 (7个参数组，17个参数)

#### LipSync 唇同步组 (4个参数)
- **ParamMouthForm** - 嘴部形状变化
- **ParamMouthOpenY** - 嘴部张开程度
- **MouthX** - 嘴部左右移动
- **MouthPuckerWiden** - 嘴部收缩张开

#### EyeBlink 眨眼组 (2个参数)
- **ParamEyeLOpen** - 左眼开闭
- **ParamEyeROpen** - 右眼开闭

#### EyeGaze 眼球追踪组 (2个参数)
- **ParamEyeBallX** - 眼珠X轴移动
- **ParamEyeBallY** - 眼珠Y轴移动

#### HeadMovement 头部运动组 (3个参数)
- **ParamAngleX** - 头部X轴旋转
- **ParamAngleY** - 头部Y轴旋转
- **ParamAngleZ** - 头部Z轴旋转

#### BodyMovement 身体运动组 (3个参数)
- **ParamBodyAngleX** - 身体X轴旋转
- **ParamBodyAngleY** - 身体Y轴旋转
- **ParamBodyAngleZ** - 身体Z轴旋转

#### Breathing 呼吸组 (1个参数)
- **ParamBreath** - 呼吸效果

#### EyeExpression 眼部表情组 (2个参数)
- **ParamEyeLSmile** - 左眼微笑
- **ParamEyeRSmile** - 右眼微笑

## 🎮 控制面板功能规范

### 主控制面板布局
```
┌─────────────────────────────────────┐
│ Live2D 控制面板                      │
├─────────────────────────────────────┤
│ 🎭 表情控制 [展开/折叠]              │
│ 🎬 动作控制 [展开/折叠]              │
│ 🎵 音频控制 [展开/折叠]              │
│ 👁️ 眼部控制 [展开/折叠]              │
│ 🎯 姿态控制 [展开/折叠]              │
│ 🫁 呼吸控制 [展开/折叠]              │
├─────────────────────────────────────┤
│ 💾 预设管理 | 🔄 重置 | ⚙️ 设置      │
└─────────────────────────────────────┘
```

### 1. 🎭 表情控制面板

#### 基础功能
- **表情选择器**: 20个表情的网格或下拉选择
- **当前表情显示**: 显示当前激活的表情名称
- **表情强度**: 滑块控制 (0-100%)
- **切换速度**: 表情过渡时间设置 (100-2000ms)

#### 高级功能
- **表情混合**: 同时激活多个表情
- **表情预设**: 保存常用的表情组合
- **随机表情**: 自动随机切换表情
- **表情历史**: 最近使用的表情快速选择

#### 控件规范
```jsx
<ExpressionPanel>
  <ExpressionGrid expressions={20} columns={4} />
  <IntensitySlider min={0} max={100} step={1} />
  <TransitionSpeed min={100} max={2000} step={50} />
  <ExpressionMixer maxMix={3} />
  <PresetManager slots={10} />
</ExpressionPanel>
```

### 2. 🎬 动作控制面板

#### 基础功能
- **动作分组**: Idle、TapBody、TapHead 三个分组
- **动作选择**: 每组内的动作选择
- **播放控制**: 播放/暂停/停止按钮
- **循环设置**: 单次播放或循环播放

#### 高级功能
- **播放速度**: 0.5x - 2.0x 速度调节
- **动作队列**: 连续播放多个动作
- **自动播放**: 定时自动播放待机动作
- **动作混合**: 上半身和下半身独立动作

#### 控件规范
```jsx
<MotionPanel>
  <MotionGroupTabs groups={['Idle', 'TapBody', 'TapHead']} />
  <MotionSelector motions={currentGroupMotions} />
  <PlaybackControls play={true} pause={false} stop={false} />
  <SpeedControl min={0.5} max={2.0} step={0.1} />
  <MotionQueue maxQueue={5} />
</MotionPanel>
```

### 3. 🎵 音频控制面板

#### 基础功能
- **音频输入**: 文件上传或麦克风输入
- **唇同步开关**: 启用/禁用唇同步
- **同步强度**: 唇同步敏感度调节
- **音频可视化**: 实时音频波形显示

#### 高级功能
- **音频格式支持**: MP3、WAV、OGG 格式
- **实时录音**: 麦克风实时输入
- **音频剪辑**: 简单的音频编辑功能
- **唇同步预设**: 不同语言的唇同步配置

#### 控件规范
```jsx
<AudioPanel>
  <AudioInput accept=".mp3,.wav,.ogg" microphone={true} />
  <LipSyncToggle enabled={true} />
  <SensitivitySlider min={0} max={200} step={5} />
  <AudioVisualizer type="waveform" realtime={true} />
  <LipSyncPresets languages={['中文', '英文', '日文']} />
</AudioPanel>
```

### 4. 👁️ 眼部控制面板

#### 基础功能
- **自动眨眼**: 开关和频率调节 (2-10秒)
- **手动眨眼**: 立即触发眨眼
- **眼球跟随**: 跟随鼠标移动
- **眼球位置**: 手动设置眼球位置

#### 高级功能
- **眨眼模式**: 正常/快速/慢速眨眼
- **眼神设置**: 专注/游离/害羞等眼神
- **眼部表情**: 微笑眼、生气眼等
- **视线预设**: 常用的视线方向预设

#### 控件规范
```jsx
<EyePanel>
  <BlinkControls auto={true} frequency={4000} />
  <ManualBlink trigger={handleBlink} />
  <GazeFollow enabled={true} />
  <EyePosition x={0} y={0} range={[-1, 1]} />
  <EyeExpression smile={0} angry={0} />
</EyePanel>
```

### 5. 🎯 姿态控制面板

#### 基础功能
- **头部角度**: X/Y/Z 三轴旋转控制
- **身体角度**: X/Y/Z 三轴旋转控制
- **鼠标跟随**: 头部跟随鼠标移动
- **姿态重置**: 恢复默认姿态

#### 高级功能
- **姿态预设**: 保存常用姿态
- **跟随灵敏度**: 鼠标跟随的响应速度
- **角度限制**: 设置旋转角度的最大值
- **姿态动画**: 姿态切换的动画效果

#### 控件规范
```jsx
<PosturePanel>
  <HeadControls x={0} y={0} z={0} range={[-30, 30]} />
  <BodyControls x={0} y={0} z={0} range={[-15, 15]} />
  <MouseFollow enabled={true} sensitivity={1.0} />
  <PosturePresets slots={8} />
  <ResetButton target="all" />
</PosturePanel>
```

### 6. 🫁 呼吸控制面板

#### 基础功能
- **自动呼吸**: 开关控制
- **呼吸频率**: 每分钟呼吸次数 (12-30次)
- **呼吸强度**: 呼吸幅度大小 (0-100%)
- **呼吸模式**: 平静/正常/急促

#### 高级功能
- **呼吸曲线**: 自定义呼吸节奏曲线
- **情绪呼吸**: 根据表情调整呼吸模式
- **呼吸音效**: 配合呼吸的音效
- **呼吸同步**: 与音频节拍同步

#### 控件规范
```jsx
<BreathingPanel>
  <BreathingToggle enabled={true} />
  <FrequencySlider min={12} max={30} step={1} />
  <IntensitySlider min={0} max={100} step={5} />
  <BreathingMode options={['calm', 'normal', 'excited']} />
  <BreathingCurve customizable={true} />
</BreathingPanel>
```

## 🔧 技术实现要求

### 状态管理
- 使用 Zustand 管理复杂状态
- 实现状态持久化 (localStorage)
- 支持状态导入/导出

### 性能优化
- 参数变化防抖处理
- 动画帧优化
- 内存泄漏防护

### 用户体验
- 实时预览所有调整
- 平滑的动画过渡
- 直观的视觉反馈

### 兼容性
- 支持桌面端和移动端
- 键盘快捷键支持
- 触摸手势支持

---

*此文档将作为 Live2D 功能开发的详细规范，所有功能实现必须严格遵循此规范。*
