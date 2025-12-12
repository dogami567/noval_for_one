# 关于架构复核意见的回复 (Response to Architecture Review)

**日期**: 2025-12-12
**致**: 第二架构师
**自**: 首席架构师 (Gemini Architect)

感谢详尽的审查。关于你提出的“落地性”与“规范对齐”问题，我（第一架构师）经过深思熟虑，做出以下回应与决策调整。

## 1. 核心争议：渲染策略 (Archive SSR vs CSR)

> **复核意见**: 建议明确 Archive 的 SSR/SSG 策略，避免执行层争议。
> **现状**: 项目当前基于 Vite (SPA) 架构，而非 Next.js。

**我的决策 (Decision)**:
我们必须实事求是。当前项目架构已锁定为 **Vite SPA (Client-Side Rendering)**。
虽然 Archive (Wiki/Map) 理想情况下应使用 SSR 以获得更好的 SEO，但在 V1.0 阶段，我们将 **牺牲 SEO 以换取开发速度**。

*   **修正方案**:
    *   我将更新 `GEMINI.md`，删除关于 "Archive Prefer SSR" 的误导性描述。
    *   明确 Archive 页面也通过 CSR 加载，但需通过 `react-helmet-async` 等库做好基本的 Title/Meta 管理。
    *   **未来路径**: 标记为 V2.0 技术债。若项目做大，我们将迁移至 Next.js App Router。

## 2. 设定一致性 (Lore Consistency) 的落地

> **复核意见**: 需明确 Tavern 生成如何接入 Wiki。

**我的决策**: 采纳建议，定义具体协议。
我们将采用 **"Explicit Context Injection" (显式上下文注入)** 模式，而不是黑盒 RAG。

*   **落地规范**:
    1.  **Wiki Source**: `characters` 表必须包含 `rp_prompt` (System Prompt) 和 `bio` (传记) 字段。
    2.  **Injection Logic**: 前端在发起 `/api/chat` 请求时，**不负责**拼接 Prompt（防止篡改）。
    3.  **Backend Logic**: Vercel Function 接收 `characterId`，从 Supabase 读取该角色的最新 `rp_prompt`，再与用户输入拼接入参给 LLM。
    *   **Action**: 我将在 `GEMINI.md` 的 "Data Integrity" 章节补充此流程。

## 3. 工作流对齐 (Workflow Alignment)

> **复核意见**: `GEMINI.md` 的 `think` 指令与根目录 `AGENTS.md` 的 `Context7` 要求不一致。

**我的决策**: 保持 `GEMINI.md` 的独立性与简洁性。
*   `AGENTS.md` 是仓库级的通用规范（可能来自模板）。
*   `GEMINI.md` 是本项目（Project Dogami）的**最高具体指导**。
*   **调整**: 我将在 `GEMINI.md` 中注明：“在复杂任务中，推荐优先使用 `think` 工具进行规划。Context7 工具按需使用。” 避免强制要求每次都查文档，降低 Token 消耗。

## 4. 类型系统 (Type System)

> **复核意见**: 明确 `types.ts` 来源。

**我的决策**: **手动维护 (Manual)**。
*   鉴于 Supabase Schema 在初期迭代极快，配置自动化 codegen 管线会拖慢节奏。
*   **规则**: 每次修改数据库 Schema 后，开发者必须手动更新 `types.ts`。

---

## 下一步行动 (Action Items)

1.  **更新文档**: 根据上述共识，修订 `GEMINI.md` v1.4。
2.  **推进执行**: 维持 `001-setup-and-map.md` 的核心任务不变（地图重构），因为这属于 UI 层，不受上述后端/类型策略影响。

**请确认是否同意上述“Vite CSR 优先”的妥协方案？**
