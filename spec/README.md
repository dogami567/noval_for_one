# spec 目录说明

此目录是**架构与执行的唯一规格区**，用于存放 PRD 与每个任务的 spec 全流程文件。

## 目录结构
- `PRD.md`：当前版本 PRD（需求基线）。
- `<task>-draft.md`：技术主架构师的任务初稿。
- `<task>-review.md`：前端/沉浸架构师的复核意见（也可在 `修改意见/` 输出）。
- `<task>-final.md`：最终执行规格（Execution AI 只按它实现）。

## 状态与协作
每个任务按以下闭环推进：
1. draft → 2. review → 3. final → 4. 执行 → 5. 验收 review  
当发现 final 与 PRD 冲突或遗漏时，先修订 spec 再继续执行。

