# Youyou 模型表情和动作完整映射文档

## 📚 目录

- [表情映射表](#表情映射表)
- [动作映射表](#动作映射表)
- [参数对应关系](#参数对应关系)
- [兼容性配置](#兼容性配置)
- [使用示例](#使用示例)

---

## 🎭 表情映射表

### 强烈情感表情（高优先级）

| 表情名称 | 参数ID | 关键词 | 描述 |
|---------|--------|--------|------|
| `shengqi` | Param22 | 生气、愤怒、讨厌、烦死了、气死了、可恶、混蛋、气死我了、太生气了 | 生气表情 |
| `weiqu` | Param21 | 委屈、难过、伤心、呜呜、好难过、心疼、好委屈、心里难受 | 委屈表情 |
| `yanlei` | Param20 | 哭、眼泪、流泪、哭泣、泪水、呜呜呜、哭哭、好想哭 | 眼泪表情 |
| `hahadaxiao` | Param28 | 哈哈、大笑、笑死、太好笑、哈哈哈、笑、开心、高兴、快乐、笑死我了、太好笑了 | 哈哈大笑 |
| `jingya` | Param25 | 惊讶、什么、怎么会、不会吧、天哪、我的天、震惊、真的吗、不敢相信 | 惊讶表情 |
| `jingxi` | Param26 | 惊喜、太好了、棒、厉害、amazing、太棒了、wonderful、好棒、真棒 | 惊喜表情 |

### 中等情感表情（中优先级）

| 表情名称 | 参数ID | 关键词 | 描述 |
|---------|--------|--------|------|
| `haixiu` | Param23 | 害羞、不好意思、羞涩、脸红红、好害羞、羞羞、脸红 | 害羞表情 |
| `lianhong` | Param16 | 脸红、羞、红脸、害羞、脸红了、好羞 | 脸红表情 |
| `aojiao` | Param24 | 傲娇、得意、骄傲、哼、才不是、略略略、哼、才没有 | 傲娇表情 |
| `tuosai` | Param38 | 思考、想想、让我想想、嗯嗯、考虑、琢磨、让我思考一下、想想看 | 托腮思考 |
| `mimiyan` | Param27 | 满足、舒服、嗯、不错、挺好、还行、满意、舒服了 | 眯眯眼 |
| `guilian` | Param19 | 鬼脸、做鬼脸、扮鬼脸、调皮、捣蛋、恶作剧 | 鬼脸表情 |
| `luolei` | Param30 | 落泪、掉眼泪、泪流、哭泣、哭哭、流泪 | 落泪表情 |

### 动作相关表情（中优先级）

| 表情名称 | 参数ID | 关键词 | 描述 |
|---------|--------|--------|------|
| `baoxiong` | Param39 | 叉腰、抱胸、叉着腰、抱胸、挺胸、自信、得意 | 抱胸动作 |
| `chayao` | Param40 | 叉腰、叉着腰、挺胸、自信、得意 | 叉腰动作 |
| `jianpantaiqi` | Param62 | 键盘、打字、敲键盘、电脑、工作、编程、码字 | 键盘手抬起 |

### 电脑相关表情（中优先级）

| 表情名称 | 参数ID | 关键词 | 描述 |
|---------|--------|--------|------|
| `diannao` | Param50 | 电脑、计算机、编程、代码、工作、学习、上网 | 电脑表情 |
| `diannaofaguang` | Param51 | 电脑发光、电脑亮、屏幕亮、显示器、屏幕 | 电脑发光 |

### 温和表情（低优先级）

| 表情名称 | 参数ID | 关键词 | 描述 |
|---------|--------|--------|------|
| `neutral` | 无参数 | 微笑、温柔、好的、嗯好、可以、没问题、谢谢、你好、再见、嗯、好的、行、可以 | 中性表情 |
| `wenroudexiao` | Param29 | 温柔的笑、甜甜的笑、暖暖的笑、温柔、甜甜、暖暖 | 温柔的笑 |

---

## 🎬 动作映射表

### 基础动作

| 动作名称 | 文件 | 关键词 | 描述 |
|---------|------|--------|------|
| `jichudonghua` | jichudonghua.motion3.json | 待机、休息、等待、发呆、闲着、没事做 | 基础待机动画 |
| `shuijiao` | shuijiao.motion3.json | 睡觉、困了、想睡、打瞌睡、午睡、晚安 | 睡觉动作 |
| `sleep` | sleep.motion3.json | 睡觉、困了、想睡、打瞌睡、午睡、晚安、休息 | 睡眠动作 |

### 互动动作

| 动作名称 | 文件 | 关键词 | 描述 |
|---------|------|--------|------|
| `diantou` | diantou.motion3.json | 点头、点头同意、嗯嗯、好的、同意、赞成 | 点头动作 |
| `huishou` | huishou.motion3.json | 挥手、再见、拜拜、打招呼、你好、挥手告别 | 挥手动作 |
| `yaotou` | yaotou.motion3.json | 摇头、不要、不同意、不行、摇头拒绝、否定 | 摇头动作 |
| `yanzhuzi` | yanzhuzi.motion3.json | 摸头、摸头发、摸头、摸摸头、安慰、鼓励 | 摸头动作 |

### 动作组合别名

| 别名 | 对应动作 | 关键词 | 描述 |
|------|----------|--------|------|
| `wave` | huishou | 挥手、再见、拜拜、打招呼、你好 | 挥手别名 |
| `nod` | diantou | 点头、点头同意、嗯嗯、好的、同意 | 点头别名 |
| `shake` | yaotou | 摇头、不要、不同意、不行、摇头拒绝 | 摇头别名 |
| `pat` | yanzhuzi | 摸头、摸头发、摸头、摸摸头、安慰 | 摸头别名 |

---

## ⚙️ 参数对应关系

### 表情参数（ParamGroup5）

| 参数ID | 参数名称 | 对应表情 | 描述 |
|--------|----------|----------|------|
| Param16 | 脸红 | lianhong | 脸红参数 |
| Param19 | 鬼脸 | guilian | 鬼脸参数 |
| Param20 | 眼泪 | yanlei | 眼泪参数 |
| Param21 | 委屈 | weiqu | 委屈参数 |
| Param22 | 生气 | shengqi | 生气参数 |
| Param23 | 害羞 | haixiu | 害羞参数 |
| Param24 | 傲娇 | aojiao | 傲娇参数 |
| Param25 | 惊讶 | jingya | 惊讶参数 |
| Param26 | 惊喜 | jingxi | 惊喜参数 |
| Param27 | 眯眯眼 | mimiyan | 眯眯眼参数 |
| Param28 | 哈哈大笑 | hahadaxiao | 大笑参数 |
| Param29 | 温柔的笑 | wenroudexiao | 温柔笑参数 |
| Param30 | 落泪 | luolei | 落泪参数 |
| Param37 | 挥手 | huishou | 挥手参数 |
| Param38 | 托腮 | tuosai | 托腮参数 |
| Param39 | 抱胸 | baoxiong | 抱胸参数 |
| Param40 | 叉腰 | chayao | 叉腰参数 |
| Param50 | 电脑 | diannao | 电脑参数 |
| Param51 | 电脑发光 | diannaofaguang | 电脑发光参数 |
| Param62 | 键盘手抬起 | jianpantaiqi | 键盘参数 |

### 嘴部参数（LipSync）

| 参数ID | 参数名称 | 描述 |
|--------|----------|------|
| ParamMouthForm | 嘴变形 | 嘴部形状控制 |
| ParamMouthOpenY | 嘴张开和闭合 | 嘴部开合控制 |
| MouthX | 嘴部X轴位置 | 嘴部左右移动 |
| MouthPuckerWiden | 嘴部形状 | 嘴部形状变化 |

### 其他参数

| 参数ID | 参数名称 | 描述 |
|--------|----------|------|
| Param52-57 | 手臂AA-BC | 手臂动作参数 |
| Param63-64 | 鼠标X/Y | 鼠标跟踪参数 |
| ParamAngleX4-Z3 | 动画角度 | 头部旋转参数 |
| ParamBodyAngleX3-Z3 | 身体旋转 | 身体旋转参数 |

---

## 🔄 兼容性配置

### 口型同步兼容性

#### 完全兼容（不会影响嘴部参数）
- `neutral` - 中性表情
- `wenroudexiao` - 温柔的笑
- `mimiyan` - 眯眯眼
- `tuosai` - 托腮思考
- `haixiu` - 害羞
- `lianhong` - 脸红
- `diannao` - 电脑
- `diannaofaguang` - 电脑发光
- `jianpantaiqi` - 键盘手抬起

#### 部分兼容（会轻微影响嘴部）
- `jingya` - 惊讶
- `jingxi` - 惊喜
- `aojiao` - 傲娇
- `guilian` - 鬼脸
- `luolei` - 落泪

#### 不兼容（会强烈影响嘴部参数）
- `shengqi` - 生气
- `weiqu` - 委屈
- `yanlei` - 眼泪
- `hahadaxiao` - 哈哈大笑
- `baoxiong` - 抱胸
- `chayao` - 叉腰

### 冲突检测

已知的冲突组合：
- `baoxiong` + `huishou` - 叉腰与挥手冲突
- `chayao` + `huishou` - 叉腰与挥手冲突
- `tuosai` + `huishou` - 托腮与挥手冲突
- `weiqu` + `huishou` - 委屈与挥手冲突
- `shengqi` + `huishou` - 生气与挥手冲突

---

## 📝 使用示例

### 基础使用

```javascript
import { useTTSStore } from '../stores/ttsStore'

const ttsStore = useTTSStore()

// 匹配表情
const expression = ttsStore.matchExpression('我好生气啊！')
// 返回: 'shengqi'

// 匹配动作
const motion = ttsStore.matchMotion('再见，拜拜！')
// 返回: 'huishou'

// 组合匹配
const result = ttsStore.matchExpressionAndMotion('我生气了，再见！')
// 返回: { expression: 'shengqi', motion: 'huishou', hasMatch: true }
```

### 播放表情和动作

```javascript
// 播放表情
await ttsStore.playLive2DExpression('happy')

// 播放动作
await ttsStore.playLive2DMotion('wave')

// 播放组合（自动处理冲突）
const result = await ttsStore.playExpressionAndMotion('shengqi', 'huishou', {
  prioritizeExpression: true
})
// 返回: { expression: true, motion: false, reason: 'conflict_prioritize_expression' }
```

### 在 WebSocket 消息处理中使用

```javascript
// 在 WebSocketContext.jsx 中
const handleMessage = async (data) => {
  if (data.type === 'chat') {
    // 匹配表情和动作
    const matchResult = ttsStore.matchExpressionAndMotion(data.content)
    
    if (matchResult.hasMatch) {
      // 播放表情
      if (matchResult.expression) {
        await ttsStore.playLive2DExpression(matchResult.expression)
      }
      
      // 播放动作
      if (matchResult.motion) {
        await ttsStore.playLive2DMotion(matchResult.motion)
      }
    }
  }
}
```

### 测试所有表情和动作

```javascript
// 测试函数
async function testAllExpressionsAndMotions() {
  const ttsStore = useTTSStore()
  
  // 测试所有表情
  const expressions = Object.keys(ttsStore.EXPRESSION_KEYWORDS)
  for (const expression of expressions) {
    console.log(`测试表情: ${expression}`)
    await ttsStore.playLive2DExpression(expression)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // 测试所有动作
  const motions = Object.keys(ttsStore.MOTION_KEYWORDS)
  for (const motion of motions) {
    console.log(`测试动作: ${motion}`)
    await ttsStore.playLive2DMotion(motion)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}
```

---

## 🎯 最佳实践

1. **优先级顺序**：强烈情感表情 > 中等情感表情 > 温和表情
2. **冲突处理**：使用 `playExpressionAndMotion` 自动处理冲突
3. **口型同步**：优先使用 `neutral` 表情以支持口型同步
4. **关键词扩展**：可以根据需要扩展关键词列表
5. **性能优化**：避免频繁的表情切换，使用防抖机制

---

*最后更新: 2024年12月*
