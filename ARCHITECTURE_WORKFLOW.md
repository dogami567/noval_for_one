# 架构协作流程（Architect Workflow）

本文件仅用于**架构协作与交付规范**，不替代 `AGENTS.md`（执行 AI 规范）。

## 1. 文件权威顺序（Single Source of Truth）
1. `spec/<task>-final.md`：每个任务的**唯一执行规格**，执行 AI 只按它实现与提交流程。
2. `spec/PRD.md`：产品需求基线，final spec 必须严格对齐。
3. `GEMINI.md` / 其它 persona 文档：背景与原则参考，**不得直接指挥执行**。

当 1 与 2/3 冲突时，以 1 为准；若发现 1 与 2 冲突，先修订 spec 再执行。

## 2. 角色分工

### 2.1 技术主架构师（Spec Owner，默认 GPT‑5.2）
- 负责系统级技术边界与落地性：数据流、服务层、类型、安全、性能、失败路径。
- 产出 `spec/<task>-draft.md` 与合并后的 `spec/<task>-final.md`。
- 对执行结果做“对 final spec 的验收式 review”。

### 2.2 前端/沉浸架构师（Gemini）
- 负责 UX/视觉/交互架构：双世界体验一致性、动效与沉浸风格、LLM 交互体验、前端性能与降级。
- 审阅 `spec/<task>-draft.md` 并输出 `spec/<task>-review.md` 或在 `修改意见/` 给出明确修改点。
- 对 UI/交互 PR 做沉浸与一致性审查。

### 2.3 执行 AI（Codex / 其他）
- 只阅读：`AGENTS.md` + `spec/<task>-final.md`（必要时参照 `spec/PRD.md`）。
- 按 final spec 实现、运行最小验证、完成 Git 提交流程。
- 不接受 persona 文档的“口头指挥”，所有变更必须回到 spec。

## 3. Spec 生命周期（每个任务一个闭环）

### 3.1 产出与复核
1. **Draft**：技术主架构师基于 PRD 与现状写 `spec/<task>-draft.md`。  
   - 必含：目标、范围/非目标、约束、设计要点、数据/状态流、任务拆解、验收标准、风险/技术债。
2. **Review**：前端/沉浸架构师复核并补充/质疑（输出 `spec/<task>-review.md` 或 `修改意见/`）。  
3. **Final**：技术主架构师合并后产出 `spec/<task>-final.md`，并在顶部标记版本与日期。

### 3.2 下发与执行
4. **Handoff**：将 final spec 作为唯一执行规格交给执行 AI。  
5. **Implement & Commit**：执行 AI 按 AGENTS 流程实现并提交。  
6. **Acceptance Review**：两位架构师按 final spec 验收式评审；若发现 spec 漏洞，回到 Draft/Review 修订再继续。

## 4. 任务拆分策略
- **默认一次下发一个 final spec**：执行 AI 只实现 final spec 对应的完整任务，然后我们 review。
- **任务很大时拆里程碑**：每个里程碑都独立走一轮 “draft → review → final → 执行 → 验收” 小闭环，避免执行 AI 跟着半成品来回改。

## 5. 目录约定
`spec/` 目录用于存放 PRD 与任务 spec：
- `spec/PRD.md`：当前版本 PRD（规范基线）。
- `spec/<task>-draft.md`：主架构初稿。
- `spec/<task>-review.md`：复核意见。
- `spec/<task>-final.md`：最终执行规格。

`修改意见/` 用于存放架构指令、复核记录与讨论纪要。

