# World Visibility Spec: Locked Locations & Character Discovery (Final)

**ID**: 004-locked-visibility  
**Status**: FINAL  
**Date**: 2025-12-12  
**Owner**: Technical Architect (GPT‑5.2)  
**Target**: Execution Agent

本任务 spec 继承并遵循全局基线：`spec/000-system-architecture-final.md`。  
本文件为 004 的**唯一执行规格**。

---

## 1. Goals / Non‑Goals

### Goals
- 在现有 003 交互上加入“**锁定地点不可知英雄**”规则：  
  **按地点筛选到 locked 地点时不显示英雄**。
- 引入“角色发现/伏笔/显露”三阶段，支持群像叙事的非线性出现。
- 为 V2 的“叙事/小模型状态机驱动世界变化（C 主驱动）”预留字段与事件协议。

### Non‑Goals (V1)
- 不实现小模型事件抽取/后端状态机（只做字段与 UI 管线）。
- 不接 Supabase（仍使用本地 `constants.ts` 数据）。

---

## 2. Data Model Updates (Client‑side V1)

### 2.1 `Character.discoveryStage`
在 `types.ts` 的 `Character` 中新增：
```ts
discoveryStage: 'hidden' | 'rumor' | 'revealed';
```
语义：
- `hidden`：玩家完全未知，**全局列表不可见**。
- `rumor`：伏笔/线索阶段，**全局可见但信息受限**。
- `revealed`：已正式登场，**全量可见**。

### 2.2 `constants.ts`
为每个 `CHARACTERS` 条目补齐 `discoveryStage`。  
初始建议（可按你当前剧情调整）：
- 主线已登场角色：`revealed`
- 伏笔角色：`rumor`
- 尚未出现角色：`hidden`

---

## 3. Visibility Rules (UX Contract)

### 3.1 Global “Show All” List (1B)
当 `activeLocationId == null` 时（全局列表）：
- 显示 `discoveryStage ∈ { rumor, revealed }` 的角色。
- 隐藏 `hidden`。

呈现：
- `revealed`：使用现有完整卡片样式。
- `rumor`：使用“剪影/占位卡”样式：  
  - `name/title` 可显示或半遮（例如 “???” + 一句线索）。  
  - 不展示 lore/详细描述。  
  - 视觉上低饱和/半透明。

### 3.2 Location Filtered List (Locked Gating)
当 `activeLocationId != null` 且该地点 `status === 'locked'`：
- **列表强制为空**（即便有角色 `currentLocationId` 指向该地）。
- 显示锁定提示文案（沉浸式）：  
  `“The region is sealed. No champions are known to dwell here.”`
- 仍保留 `Show All` 清除过滤按钮。

当 `status === 'unlocked'`：
- 正常按 `currentLocationId === activeLocationId` 过滤展示。

### 3.3 Sidebar CTA
`Sidebar` 的 `View Champions Here`：
- 对 unlocked 地点：保持 003 行为（滚动 + 设置过滤）。
- 对 locked 地点：仍可点击，但进入 3.2 的“锁定空结果态”。

---

## 4. Implementation Tasks (by file)

### 4.1 `types.ts`
- 为 `Character` 增加 `discoveryStage` 字段与 union 类型。

### 4.2 `constants.ts`
- 为所有 `CHARACTERS` 增加 `discoveryStage`。

### 4.3 `App.tsx`
- 计算 `activeLocation` 后，增加锁定 gating：
```ts
const isActiveLocationLocked = activeLocation?.status === 'locked';
const filteredCharacters =
  activeLocationId && !isActiveLocationLocked
    ? characters.filter(c => c.currentLocationId === activeLocationId)
    : activeLocationId
      ? []
      : characters.filter(c => c.discoveryStage !== 'hidden');
```
- 额外把 `isActiveLocationLocked` 与 `activeLocationName` 传给 `CharacterGridSection`。

### 4.4 `components/CharacterGridSection.tsx`
- 当 `activeLocationId == null`：
  - 只渲染 rumor/revealed；rumor 使用占位卡样式。
- 当 `activeLocationId != null && isActiveLocationLocked`：
  - 使用 3.2 的锁定提示空结果态（覆盖已有空结果）。

### 4.5 `components/Sidebar.tsx`
- 无需新增逻辑，仅保持 CTA 可点击并走既有回调。

---

## 5. Future Hook: Narrative / AI‑Driven World Progression (V2)

### 5.1 Event Schema (预留)
后续小模型/剧情管线输出的标准事件：
```ts
type WorldEvent =
  | { type: 'CHARACTER_MOVED'; characterId: string; toLocationId: string; reason?: string }
  | { type: 'LOCATION_UNLOCKED'; locationId: string; reason?: string }
  | { type: 'CHARACTER_DISCOVERY_UPDATED'; characterId: string; stage: 'hidden'|'rumor'|'revealed'; reason?: string };
```

### 5.2 Hybrid Strategy (C 主驱动 + B 辅发现)
- **C 主驱动**：叙事/小模型事件更新 `currentLocationId`、`locations.status`、`discoveryStage`。
- **B 辅发现**：玩家 Travel/探索只影响“是否触发/确认事件”，不规定顺序。

### 5.3 Manual Fallback
- 所有 V2 事件进入数据库前必须经过：
  1. 规则校验（字段存在、地点/角色合法、状态迁移合理）。
  2. **人工确认开关**：  
     - 不确定事件先写为 `rumor` 或暂不落库；  
     - 允许你在后台/脚本中手动调整 `discoveryStage`、`currentLocationId`、`status`。

---

## 6. Execution Checklist
1. 扩展 `Character` 类型并补齐常量数据。
2. App 层加入锁定地点 gating 与全局隐藏规则。
3. Champions 区加入 rumor 占位卡样式与 locked 空结果态。

