# GEMINI.md 复核意见（第二架构师）

日期：2025-12-12  
面向：主架构师 / 执行代理

## 总体评价
`GEMINI.md` 作为首席架构师 persona 与执行准则，结构清晰、可操作性强，能够为后续执行代理提供较明确的边界与优先级。当前版本的主要不足在于若干关键约束仍停留在“原则级”描述，缺少默认策略与落地机制，可能在执行阶段引发歧义或风格/实现跑偏。

## 亮点
- **双世界划分明确**：Archive(静态/SSR) 与 Tavern(动态/CSR) 的定位清楚，能直接指导渲染策略、性能优先级与交互模式。
- **分层与边界简单可执行**：State/Logic/UI 的职责划分与 `services/` 强类型 DB 访问规则一致，利于长期维护。
- **沉浸式审美上升为架构约束**：对“Hextech / Dark Fantasy + 玻璃态 + 动画即 UX”的强调，有助于保持产品体验一致性。
- **安全底线正确**：Supabase 作为唯一 SoT、用户数据必须 RLS、禁止组件内直连 DB，属于必要且合理的 PR 阻断条件。

## 需补充/澄清
- **Archive 渲染策略应更细化**：目前只写 SSR preferred。建议补充一段“默认模式 + 例外条件”，明确 Map/Wiki/Reader 的 SSR/SSG/ISR/Streaming 选择与 revalidate 触发来源，避免执行层争议。
- **工作流程需与根 `AGENTS.md` 对齐**：GEMINI 里写的是 `think start <steps>`；根 AGENTS 要求 Context7 + sequentialthinking 组合。建议统一命令/流程表述，避免代理误用。
- **Lore Consistency 落地机制缺失**：需要明确 Tavern 生成如何接入 Wiki/Character Attributes（RAG/检索范围、结构化 schema 注入、输出校验/拒答/重写策略）。
- **美术/动画约束需补一条非功能底线**：建议显式要求对低端设备降级、`prefers-reduced-motion` 支持、可访问性/对比度基线，以平衡玻璃态+重动画与性能/可用性。
- **组件边界规则建议给出目录示例与强制方式**：若目录已确定（如 `src/components/archive|tavern`），可写死路径；否则可写“领域边界原则 + 预期目录”，并考虑用 lint/boundary 规则做 PR 阻断。
- **Supabase 权限模型需进一步声明**：建议补充“前端 anon-key 可做什么、需要 service-role 的操作走哪里（edge function / server action）”，避免执行层把高权限逻辑放前端。

## 风险/关注点
- **Tavern LLM 延迟与失败路径未定义**：目前只写不阻塞 UI。建议明确是否流式输出、乐观 UI 的范围、失败/重试/中断的 UX 规范。
- **类型来源与同步机制不明确**：`types.ts` 强约束很好，但需明确其生成/维护方式（Supabase codegen / zod schema / 手工），以及 DB schema 变更后的同步流程。

## 建议与主架构师讨论的问题
- Archive 的“渲染策略矩阵”：哪些页面必须 SSR？哪些可 SSG/ISR？revalidate 来源（编辑、DB 变更、定时）？
- Tavern 的 LLM 延迟治理与体验：是否采用流式、分段生成、或先占位后补全？失败/重试/中断如何反馈？
- Lore 一致性保障：Character Attributes 如何注入 prompt？违背约束时如何处理（重写/回滚/提示用户）？
- 领域边界的强制手段：是否需要 ESLint boundary / tsconfig path / import 规则作为 PR 阻断？
- 服务层与类型策略：`services/` 的接口设计与 `types.ts` 的更新如何联动？是否需要自动化 codegen 与 CI 检查？

## 对 `GEMINI.md` 的具体改动建议（可直接合入）
1. 在“Dual World Architecture”段落增加一小节：
   - Archive 默认渲染模式列表（Map/Wiki/Reader 各自 SSR/SSG/ISR/Streaming 的默认与例外）。
   - revalidate/缓存失效策略简述。
2. 在“Tools & Environment”里统一流程描述：
   - 明确“新需求 → Context7(如适用) → sequentialthinking → 再动手”的仓库级标准。
3. 在“Data Integrity / Lore Consistency”中新增落地机制说明：
   - Tavern 生成必须检索的 lore 来源范围；
   - 结构化约束注入与输出校验策略。
4. 在“Immersion & Aesthetics”增加非功能底线：
   - 性能预算、低端设备/弱网降级、`prefers-reduced-motion` 支持、可访问性对比度基线。
5. 在“Component Boundaries”与“Supabase Access”两条规则后补充：
   - 预期目录示例/依赖方向；
   - service-role 逻辑所在位置与前端可用能力边界。

— 以上建议以减少执行歧义、提升可落地性为目标。
