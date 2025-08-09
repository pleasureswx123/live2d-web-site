# test.html API接口分析报告

## 📊 总体统计

通过对test.html文件的详细分析，共识别出 **3个不同的后端服务** 和 **15个HTTP API接口** + **1个WebSocket连接** + **20种WebSocket消息类型**。

## 🌐 后端服务列表

### 1. 主服务 (localhost:8000)
- **用途**: 核心AI聊天、WebSocket通信、文件上传、系统控制
- **协议**: HTTP + WebSocket
- **状态**: ✅ 已运行

### 2. 用户档案管理服务 (localhost:8081)
- **用途**: 用户档案管理界面
- **协议**: HTTP
- **状态**: ✅ 已运行

### 3. 测试服务 (localhost:8082)
- **用途**: 测试和开发环境
- **协议**: HTTP
- **状态**: ✅ 已运行

## 🔗 HTTP API接口详细清单

### 用户管理相关 (4个接口)

#### 1. 获取用户会话信息
- **URL**: `GET http://localhost:8000/api/user/{userId}/session`
- **用途**: 刷新用户会话数据
- **参数**: userId (路径参数)
- **响应**: `{success: boolean, profile: object}`

#### 2. 获取活跃用户列表
- **URL**: `GET http://localhost:8000/memory/users/active`
- **用途**: 获取所有活跃用户列表，用于用户建议和切换
- **响应**: `{success: boolean, active_users: array}`

#### 3. 创建用户档案
- **URL**: `PUT http://localhost:8000/memory/user/{userId}/profile`
- **用途**: 创建新用户档案
- **请求体**: `{name: string, user_id: string, created_at: string}`
- **响应**: `{success: boolean, message: string}`

#### 4. 用户档案管理页面
- **URL**: `GET http://localhost:8081/profile_manager.html`
- **用途**: 打开用户档案管理界面
- **方式**: window.open新窗口

### 文件上传相关 (2个接口)

#### 5. 图片上传
- **URL**: `POST http://localhost:8000/upload/image`
- **用途**: 上传图片文件
- **请求**: FormData with file
- **响应**: `{success: boolean, file_url: string}`

#### 6. 文件上传
- **URL**: `POST http://localhost:8000/upload/file`
- **用途**: 上传其他类型文件
- **请求**: FormData with file
- **响应**: `{success: boolean, file_url: string}`

### 语音合成相关 (1个接口)

#### 7. TTS语音合成
- **URL**: `POST http://localhost:8000/tts/synthesize`
- **用途**: 测试TTS功能
- **请求体**: `{text: string, voice: string}`
- **响应**: 音频数据

### 系统控制相关 (4个接口)

#### 8. 系统状态查询
- **URL**: `GET http://localhost:8000/status`
- **用途**: 获取系统状态信息
- **响应**: `{is_warmed_up: boolean, ...}`

#### 9. 深度思考控制
- **URL**: `POST http://localhost:8000/control/deep_reasoning`
- **用途**: 启用/禁用深度思考模式
- **请求体**: `enabled=true/false` (form-urlencoded)
- **响应**: `{success: boolean, enabled: boolean}`

#### 10. 模型预热
- **URL**: `POST http://localhost:8000/control/warm_up`
- **用途**: 预热LLM模型
- **响应**: `{success: boolean, message: string}`

### 主动对话相关 (2个接口)

#### 11. 设置沉默阈值
- **URL**: `POST /proactive/silence-timeout/{userId}`
- **用途**: 设置用户的主动对话沉默阈值
- **请求体**: `{timeout: number}`
- **响应**: `{success: boolean}`

#### 12. 获取沉默阈值
- **URL**: `GET /proactive/silence-timeout/{userId}`
- **用途**: 获取用户的沉默阈值设置
- **响应**: `{silence_timeout: number}`

## 🔌 WebSocket连接

### WebSocket服务
- **URL**: `ws://localhost:8000/ws`
- **用途**: 实时双向通信
- **连接管理**: 自动重连机制

## 📨 WebSocket消息类型 (20种)

### 客户端发送消息类型 (10种)

#### 1. 初始化连接
```json
{
  "type": "init",
  "user_id": "string"
}
```

#### 2. 聊天消息
```json
{
  "type": "message",
  "content": "string",
  "user_id": "string",
  "image_url": "string?" // 可选
}
```

#### 3. 音频播放完成通知
```json
{
  "type": "audio_playback_complete",
  "message": "string"
}
```

#### 4. 音色切换
```json
{
  "type": "change_voice",
  "voice": "string"
}
```

#### 5. TTS设置同步
```json
{
  "type": "sync_tts_settings",
  "voice": "string",
  "speed": "number"
}
```

#### 6. ASR引擎切换
```json
{
  "type": "change_asr",
  "asr_type": "string"
}
```

#### 7. 语速调节
```json
{
  "type": "change_speed",
  "speed": "number"
}
```

#### 8. 手动阶段切换
```json
{
  "type": "manual_stage_change",
  "stage": "number"
}
```

#### 9. 重置阶段为自动
```json
{
  "type": "reset_stage_auto"
}
```

#### 10. ASR控制
```json
{
  "type": "start_asr" | "stop_asr"
}
```

#### 11. 音频数据流
```json
{
  "type": "audio_chunk",
  "audio_data": "base64_string"
}
```

### 服务端发送消息类型 (10种)

#### 1. 初始化成功
```json
{
  "type": "init_success",
  "user_id": "string"
}
```

#### 2. TTS设置请求
```json
{
  "type": "request_tts_settings"
}
```

#### 3. 搜索状态
```json
{
  "type": "search_start" | "search_complete" | "search_error",
  "query": "string?",
  "error": "string?"
}
```

#### 4. 生成状态
```json
{
  "type": "generation_start" | "generation_chunk" | "generation_end",
  "content": "string?"
}
```

#### 5. TTS音频
```json
{
  "type": "tts_audio_chunk" | "tts_complete",
  "audio_data": "base64_string?",
  "format": "string?",
  "order": "number?"
}
```

#### 6. 语音设置响应
```json
{
  "type": "voice_change_success" | "voice_change_error" | "speed_change_success" | "speed_change_error",
  "voice": "string?",
  "speed": "number?",
  "error": "string?"
}
```

#### 7. ASR响应
```json
{
  "type": "asr_started" | "asr_result" | "asr_stopped" | "asr_error" | "asr_change_success" | "asr_change_error",
  "text": "string?",
  "is_final": "boolean?",
  "confidence": "number?",
  "error": "string?"
}
```

#### 8. 对话阶段更新
```json
{
  "type": "conversation_stage",
  "stage_info": {
    "current_stage": "number",
    "stage_name": "string",
    "description": "string",
    "is_manual": "boolean"
  }
}
```

#### 9. 用户档案活动
```json
{
  "type": "profile_activity" | "profile_updated",
  "activity_info": {
    "completion_rate": "number",
    "key_info_status": "object",
    "recent_activities": "array"
  },
  "conversion_summary": "object?"
}
```

#### 10. 手动阶段响应
```json
{
  "type": "manual_stage_success" | "manual_stage_error",
  "stage": "number?",
  "error": "string?"
}
```

## 🔄 API调用时机和用途

### 页面加载时
1. 自动登录检查
2. 加载最近用户列表
3. 系统状态更新
4. WebSocket连接建立

### 用户交互时
1. 用户登录/切换 → 用户管理API
2. 发送消息 → WebSocket消息
3. 文件上传 → 文件上传API
4. 语音设置 → WebSocket控制消息
5. 系统设置 → 系统控制API

### 实时通信
1. 聊天消息 → WebSocket双向通信
2. 语音数据 → WebSocket音频流
3. 状态同步 → WebSocket状态消息

## 📈 接口使用频率

### 高频接口 (实时使用)
- WebSocket连接和消息 (持续)
- 聊天消息发送 (用户交互)
- 音频数据流 (语音功能)

### 中频接口 (会话级别)
- 用户管理API (登录/切换)
- 系统状态查询 (定期检查)
- 文件上传 (按需使用)

### 低频接口 (配置级别)
- 系统控制API (设置变更)
- 主动对话配置 (用户设置)

## 🛡️ 错误处理机制

### HTTP请求错误处理
- try-catch包装所有fetch请求
- 网络错误重试机制
- 用户友好的错误提示

### WebSocket错误处理
- 连接断开自动重连
- 消息发送失败处理
- 状态同步错误恢复

### 音频处理错误
- 音频播放失败降级
- 麦克风权限错误提示
- ASR/TTS服务错误处理

## 🎯 集成优先级

### 第一优先级 (核心功能)
1. WebSocket实时通信
2. 用户认证和会话管理
3. 聊天消息发送接收

### 第二优先级 (增强功能)
1. 语音识别和合成
2. 文件上传功能
3. 用户档案管理

### 第三优先级 (高级功能)
1. 对话阶段控制
2. 主动对话系统
3. 系统控制和监测
