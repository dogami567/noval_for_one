# Chat Backend Spec: OpenAI‑Compatible Proxy via Vercel (Final)

**ID**: 006-chat-backend  
**Status**: FINAL  
**Date**: 2025-12-12  
**Owner**: Technical Architect (GPT‑5.2)  
**Target**: Execution Agent

本任务继承并遵循：  
- `spec/000-system-architecture-final.md`  
- `spec/005-supabase-foundation-final.md`

本文件为 006 的**唯一执行规格**。

---

## 1. Goals / Non‑Goals

### Goals
- 将聊天能力从“前端直连 provider SDK”迁移到 **Vercel Serverless Functions**，防止密钥泄漏并便于后续统一替换模型/中转。
- 使用 **OpenAI 兼容协议中转**（`/v1/chat/completions`）作为 LLM 入口，支持非流式输出。
- 保持现有 `ChatWidget` UI/交互不变（按钮、输入、typing 状态、位置上下文）。
- Prompt/系统指令改为中文风格，输出自然中文。

### Non‑Goals
- 本阶段不做 streaming（留到 006a）。
- 不引入正式 RAG / world_state 记忆读写（只预留接口参数）。
- 不改 Supabase schema。

---

## 2. Environment & Secrets

### 2.1 Vercel 环境变量（仅后端）
在 Vercel 项目里配置（**不要出现在前端 env**）：
```
LLM_BASE_URL=https://api.linkapi.org
LLM_API_KEY=<your-proxy-key>
LLM_MODEL=gpt-5.2-all
```

说明：
- `LLM_BASE_URL` 指向 OpenAI 兼容中转根地址。
- `LLM_MODEL` 为中转侧注册的模型名。

### 2.2 Frontend env
前端不再需要任何 LLM key / baseUrl。

---

## 3. Serverless Chat API

### 3.1 新增 `api/chat.ts`
实现一个 Vercel Function：
- 路径：`api/chat.ts`
- 方法：`POST`
- Request body：
  ```ts
  {
    message: string;              // 用户当前输入
    context?: string;             // 选中地点的上下文（中文或英文都可）
    history?: { role: 'user'|'assistant'; content: string }[]; // 可选：最近对话
  }
  ```
- Response：
  ```ts
  { text: string }
  ```

### 3.2 LLM 调用方式
用 `fetch` 走 OpenAI Chat Completions 协议（非流式）：
- URL：`${LLM_BASE_URL}/v1/chat/completions`
- Headers：
  - `Authorization: Bearer ${LLM_API_KEY}`
  - `Content-Type: application/json`
- Body 结构：
  ```json
  {
    "model": "<LLM_MODEL>",
    "messages": [
      { "role": "system", "content": "<systemPrompt>" },
      ...history,
      { "role": "user", "content": "<message>" }
    ],
    "temperature": 0.7,
    "max_tokens": 180,
    "stream": false
  }
  ```

### 3.3 systemPrompt（中文）
放在 `api/chat.ts` 中拼接，示例语气：
```
你是「编年史守护者」，一位栖居在奇幻大陆地图中的古老智能。
口吻睿智、略带史诗感，但保持友好与简洁。

当前选中地点信息（如有）：${context ?? '无'}。

回答要求：
- 80 字以内，中文输出。
- 若被问及地点/角色，结合已知信息进行沉浸式扩写，但不要胡编完全违背设定的事实。
- 如果用户想继续探索，引导其查看地图或英雄群像。
```

### 3.4 错误处理
- 缺少 env：返回 `500` + `{ text: '后端未配置 LLM 环境变量' }`
- provider 返回非 2xx：透传 `status=500`，`text` 为友好中文提示。
- 永远不要把 `LLM_API_KEY` 打到日志或返回体。

---

## 4. Frontend Refactor

### 4.1 移除前端直连
- `services/geminiService.ts` 不再调用 `@google/genai`。
- 替换为基于 `/api/chat` 的实现，可保留文件名（减少 diff），导出函数名仍为 `generateChronicleResponse`。

### 4.2 `generateChronicleResponse` 新实现
在 `services/geminiService.ts`：
- `generateChronicleResponse(userMessage, context)` 内部：
  - 组装 body `{ message: userMessage, context }`
  - `fetch('/api/chat', { method:'POST', body: JSON.stringify(body) })`
  - 读取 `{ text }` 返回。
- 错误时返回中文兜底：`'档案馆暂时无法回应，请稍后再试。'`

### 4.3 ChatWidget 保持现有行为
`components/ChatWidget.tsx` 基本不改，仅确保：
- typing 状态与错误兜底仍正常。
- 不需要向前端注入 key。

（可选增强）将最近 6 条对话作为 `history` 一起发给后端，提高连贯性；但必须保证 payload 小且不影响现有 UI。

---

## 5. Acceptance Criteria
- 生产环境中前端 bundle 不包含任何 LLM key/baseUrl。
- `ChatWidget` 能正常收到来自 `/api/chat` 的中文回复。
- 后端 `/api/chat` 在 env 配置正确时稳定返回；未配置时有明确中文错误提示。
- 现有 UI/交互（开启/关闭、输入、typing、引用选中地点）无回归。

