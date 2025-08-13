# React Hooks 使用规则修复文档

## 🚨 问题描述

在 `WebSocketContext.jsx` 中出现了 React Hooks 使用规则违反的错误：

```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

## 🔍 问题原因

### 1. 在事件处理器中动态导入和调用 hooks

**错误代码:**
```javascript
const onASRResult = (text, isFinal, confidence) => {
  // ❌ 错误：在函数内部使用 require 动态导入 hooks
  const { useASRStore } = require('../stores/asrStore')
  const asrStore = useASRStore.getState()
  // ...
}
```

### 2. 在普通函数中调用 hooks

**错误代码:**
```javascript
const syncCurrentTTSSettings = () => {
  // ❌ 错误：在普通函数中调用 hooks
  const { currentVoice, currentSpeed } = useVoice()
  // ...
}
```

### 3. 在条件语句中调用 store 的 getState

**错误代码:**
```javascript
case 'error':
  // ❌ 错误：多次调用 getState，可能导致状态不一致
  const { currentStreamingMessageId } = useChatMessagesStore.getState()
  if (currentStreamingMessageId) {
    const { updateMessageContent } = useChatMessagesStore.getState()
    // ...
  }
```

## ✅ 解决方案

### 1. 在组件顶层调用所有 hooks

**修复后:**
```javascript
export const WebSocketProvider = ({ children }) => {
  // ✅ 正确：在组件顶层调用所有 hooks
  const { currentUser } = useUserAuthStore()
  const { currentVoice, currentSpeed } = useVoice()
  const asrStore = useASRStore()
  
  // 事件处理器中直接使用已获取的 store 实例
  const onASRResult = (text, isFinal, confidence) => {
    if (asrStore.onASRResult) {
      asrStore.onASRResult(text, isFinal, confidence)
    }
  }
}
```

### 2. 通过闭包传递 hook 返回值

**修复后:**
```javascript
const syncCurrentTTSSettings = () => {
  // ✅ 正确：使用在组件顶层获取的值
  console.log('🔄 同步TTS设置到后端:', {voice: currentVoice, speed: currentSpeed})
  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify({
      type: 'sync_tts_settings',
      voice: currentVoice,
      speed: currentSpeed
    }))
  }
}
```

### 3. 优化 store 状态获取

**修复后:**
```javascript
case 'error':
  hideTypingIndicator()
  // ✅ 正确：一次性获取 store 状态
  const chatStore = useChatMessagesStore.getState()
  if (chatStore.currentStreamingMessageId) {
    chatStore.updateMessageContent(chatStore.currentStreamingMessageId, '抱歉，生成回复时出现了错误...')
    chatStore.finishStreamingMessage()
  } else {
    chatStore.addBotMessage('抱歉，生成回复时出现了错误...')
  }
  break
```

## 📋 React Hooks 使用规则

### ✅ 正确的做法

1. **只在组件顶层调用 hooks**
   ```javascript
   function MyComponent() {
     const [state, setState] = useState(0) // ✅ 正确
     const store = useStore() // ✅ 正确
     
     return <div>...</div>
   }
   ```

2. **在自定义 hooks 中调用其他 hooks**
   ```javascript
   function useCustomHook() {
     const [state, setState] = useState(0) // ✅ 正确
     return { state, setState }
   }
   ```

3. **通过闭包传递 hook 返回值**
   ```javascript
   function MyComponent() {
     const store = useStore() // ✅ 正确
     
     const handleClick = () => {
       store.doSomething() // ✅ 正确：使用闭包中的值
     }
     
     return <button onClick={handleClick}>Click</button>
   }
   ```

### ❌ 错误的做法

1. **在条件语句中调用 hooks**
   ```javascript
   function MyComponent() {
     if (condition) {
       const [state, setState] = useState(0) // ❌ 错误
     }
   }
   ```

2. **在循环中调用 hooks**
   ```javascript
   function MyComponent() {
     for (let i = 0; i < 10; i++) {
       const [state, setState] = useState(0) // ❌ 错误
     }
   }
   ```

3. **在事件处理器中调用 hooks**
   ```javascript
   function MyComponent() {
     const handleClick = () => {
       const [state, setState] = useState(0) // ❌ 错误
     }
   }
   ```

4. **在普通函数中调用 hooks**
   ```javascript
   function regularFunction() {
     const [state, setState] = useState(0) // ❌ 错误
   }
   ```

## 🔧 修复清单

- [x] 移除 `onASRResult` 等函数中的动态 hook 导入
- [x] 在组件顶层调用 `useASRStore`
- [x] 修复 `syncCurrentTTSSettings` 中的 hook 调用
- [x] 优化错误处理中的 store 状态获取
- [x] 确保所有 hooks 都在组件顶层调用
- [x] 添加测试组件验证修复效果

## 🎯 最佳实践

1. **始终在组件或自定义 hook 的顶层调用 hooks**
2. **通过 props 或闭包传递 hook 返回值给事件处理器**
3. **避免在条件语句、循环或嵌套函数中调用 hooks**
4. **使用 ESLint 的 `react-hooks/rules-of-hooks` 规则检测违规**
5. **定期审查代码，确保遵循 hooks 使用规则**

## 📚 参考资料

- [React Hooks 使用规则](https://reactjs.org/docs/hooks-rules.html)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [React Hooks FAQ](https://reactjs.org/docs/hooks-faq.html)

修复完成后，WebSocket Context 现在完全遵循 React Hooks 的使用规则，不会再出现相关错误。
