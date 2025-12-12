# System Architecture Spec (Final)

**ID**: 000-system-architecture  
**Status**: FINAL  
**Date**: 2025-12-12  
**Owner**: Technical Architect (GPT‑5.2)

本 spec 是项目的**跨任务系统级基线**，用于约束后端/数据/LLM/安全/部署等非前端维度。  
所有执行任务必须在对应任务的 `spec/<task>-final.md` 中引用并遵循本文件。

---

## 0. Current Stack Snapshot (V1)
- **Frontend**: Vite SPA + React + TypeScript.
- **Server**: Vercel Serverless Functions (`api/`).
- **LLM Provider**: Google Gemini via `@google/genai`（现有 `services/geminiService.ts`）。
- **Database / SoT**: Supabase（V1 逐步接入；本 spec 先定义基线）。
- **Code Boundaries**: 数据/LLM 逻辑只允许存在于 `services/` 与 `api/`，组件层禁止直连。

> V1 以开发速度为先，Archive 的 SSR/SSG/SEO 均视为 V2 技术债。

---

## 1. Domain Model & Supabase Schema Baseline

### 1.1 Public Lore Tables (Anonymous Read)
这些表默认**公开可读**（anon key 允许 `select`），写入仅限管理/服务端：

- `locations`
  - `id` (uuid, pk)
  - `name`
  - `type` (mystic | nature | city | ruin | ...)
  - `coords` (jsonb: x/y or lat/lng)
  - `summary`
  - `lore` (long text)
  - `created_at`
- `characters`
  - `id`
  - `name`
  - `faction/type`
  - `attributes` (jsonb，结构化属性基线)
  - `bio` (lore 传记)
  - `rp_prompt` (system prompt 片段，用于 Tavern)
  - `created_at`
- `stories`
  - `id`
  - `title`
  - `location_id` (fk → locations.id)
  - `content`
  - `created_at`
- `timeline_events`
  - `id`
  - `title`
  - `time_label`
  - `content`
  - `related_location_ids` (uuid[])
  - `related_character_ids` (uuid[])

### 1.2 User‑Scoped Tables (RLS Mandatory)
所有用户相关数据必须启用 RLS，且 anon key **默认不可读写**：

- `chat_logs`
  - `id`
  - `user_id` (fk → auth.users.id)
  - `character_id`
  - `location_id` (nullable)
  - `messages` (jsonb, UIMessage[])
  - `created_at`
  - `updated_at`
- 未来可能：`bookmarks` / `favorites` / `user_settings` 等同样按 `user_id` 分区。

---

## 2. RLS Policy Baseline

### 2.1 Public Lore Tables
- **Read**: `select` 对所有人开放。
- **Write**: 只允许 service‑role / 管理角色写入。

### 2.2 User‑Scoped Tables
以 `chat_logs` 为例：
- **Read**: 仅允许 `user_id = auth.uid()` 的用户读取。
- **Write**: 仅允许本人插入/更新/删除自己的记录。

### 2.3 RLS 性能建议
- 在 policy 中调用 `auth.uid()` / `auth.jwt()` 等函数时，使用 `select auth.uid()` 形式以便 Postgres 复用结果。
- 复杂跨表权限判定使用 **security‑definer function**（放在非 Exposed schema），policy 里只调用该函数。

---

## 3. Service Layer & Type System

### 3.1 `types.ts` 维护规则
- **手动维护**，任何 Supabase schema 变更必须同步更新 `types.ts`。
- 共享模型（Character/Location/Story/ChatLog/TimelineEvent）在 `types.ts` 定义，禁止跨层出现 `any`。

### 3.2 `services/` 约定
- 所有 DB/LLM/业务逻辑必须在 `services/` 聚合为强类型函数。
- 组件层只调用 services 的导出，不做数据拼装与权限判断。
- 每个 service 对应一个领域：`locationService`、`characterService`、`chatService`、`geminiService` 等。

### 3.3 Supabase Client 边界（接入时必须遵守）
- **Browser Client**（anon key）：仅用于 public lore 表的读取、以及用户自己数据的 RLS 受控读写。
- **Server Client**（service‑role key）：只允许在 `api/` 或未来 server actions 内使用；任何使用必须记录原因。

### 3.4 环境变量（统一命名）
- 前端（`import.meta.env`）：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- 服务端（`process.env`）：
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`（现有代码可兼容 `API_KEY`，但新实现以本命名为准）

---

## 4. LLM / Tavern Backend Architecture

### 4.1 API Surface
V1 统一走 Vercel Function：
- `POST /api/chat`：角色扮演与对话生成（Tavern）。
- `POST /api/chronicle`（可选分流）：Archive 侧简短 lore 查询/总结。

### 4.2 `POST /api/chat` 协议
**Request**
```json
{
  "characterId": "uuid",
  "locationId": "uuid | null",
  "messages": [{ "role": "user|assistant|system", "content": "..." }]
}
```

**Response (V1 非流式)**
```json
{ "message": { "role": "assistant", "content": "..." } }
```

> 若后续启用流式输出，可改为 SSE，但保持字段语义不变。

### 4.3 Prompt Assembly（显式上下文注入）
1. Function 只接受 `characterId` / `locationId` / `messages`，**前端不拼 prompt**。
2. 服务端读取：
   - `characters.rp_prompt` + `characters.bio` + `characters.attributes`
   - 若有 `locationId`，读取 `locations.summary/lore`
3. 生成 system prompt：
   - 以 `rp_prompt` 为主骨架，补充 bio/attributes 与 location context。
4. 与用户 messages 拼成模型入参。

### 4.4 延迟/失败治理
- **Timeout**: 单次生成硬超时（建议 20–30s），超时返回可重试错误。
- **Retry**: 仅对网络/速率错误做 1 次指数退避重试。
- **Cancel**: 前端允许用户中断请求；服务端需能安全终止本次生成并不落库残缺数据。

### 4.5 流式输出（V2 可选）
- 若 Gemini SDK 提供流式接口，则优先用 **SSE** 返回逐步文本。
- 如需结构化流（工具调用/元数据），可引入 Vercel AI SDK 的 UI‑Message Stream 协议作为 V2 技术债。

### 4.6 Lore 校验与纠偏
- 生成后做一次轻量校验：
  - 检测是否违背 `attributes` 的硬约束（阵营/性格/能力等）。
  - 检测是否出现明显越界（现代/出戏设定）。
- 违背时：追加一轮 “self‑repair” 指令重写；仍失败则返回带说明的拒答。

### 4.7 Chat Logs Persist
- `/api/chat` 成功返回前，将本轮消息追加到 `chat_logs`（user‑scoped）。
- 落库失败不应阻塞 UI；记录错误日志并允许用户继续对话。

---

## 5. Auth & Security
- 采用 Supabase Auth；浏览器侧只持有 session 与 anon key。
- service‑role key 永不下发前端。
- `/api/chat` 必须做**速率限制**（按 `user_id` + IP），避免滥用导致成本失控。

---

## 6. Infra / Deployment
- Vercel 部署：静态 SPA + `api/` serverless functions。
- `vercel.json` 中如需设置 function runtime/region/timeout，以本 spec 为基线。
- 本地开发：
  - `npm run dev` 启动 SPA。
  - Function 在 Vercel dev 环境或等价本地模拟运行。

---

## 7. Observability Baseline
- 所有 functions 必须记录：
  - 请求 id、userId（可匿名化）、characterId/locationId
  - LLM 调用耗时、模型名、错误类型
- 关键页面（Map/Reader/Tavern）记录基础性能指标（TTI/请求耗时/错误率）。

---

## 8. Testing / CI Baseline
- 最低 CI：
  - `tsc --noEmit` typecheck
  - 前端 lint/format（如未来引入）
- services 层的纯函数可补单测；LLM/DB 侧只做轻量集成测试。

---

## 9. V2 技术债（显式记录）
- Archive 的 SSR/SSG/SEO 迁移评估。
- LLM 结构化流 / 工具调用（若引入 AI SDK）。
- Supabase codegen 自动化（当 schema 稳定后再上）。

