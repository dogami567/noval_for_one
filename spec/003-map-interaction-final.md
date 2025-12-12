# Interaction Architecture Spec: Map → Sidebar → Champions Filtering (Final)

**ID**: 003-map-interaction  
**Status**: FINAL  
**Date**: 2025-12-12  
**Owner**: Technical Architect (GPT‑5.2)  
**Target**: Execution Agent

本任务 spec 继承并遵循全局基线：`spec/000-system-architecture-final.md`。  
本文件为 003 的**唯一执行规格**。

---

## 1. Goals / Non‑Goals

### Goals
- 形成完整交互闭环：**Map Pin 选中 → Sidebar 展示地点 → 显式跳转到 Champions 并按地点筛选 → Travel 切换当前位置**。
- Champions 区域支持“按地点过滤/清除过滤”，并为未来“叙事驱动角色移动”预留字段。
- 保持 002 的视觉/动效效果不被破坏。

### Non‑Goals (V1)
- 不接 Supabase / 真实数据（仍用 `constants.ts` 本地数据）。
- 不做正文/LLM 自动移动角色；只做字段与 UI 管线预留。

---

## 2. Data Model Updates (Client‑side V1)

### 2.1 `Character` 增加位置字段（方案 B）
在 `types.ts` 的 `Character` 中新增：
- `currentLocationId: string` **必填**：角色当前所在地点（驱动筛选/未来状态机）。
- `homeLocationId?: string` 可选：角色出身/主地点（V2+ 叙事用）。

### 2.2 `constants.ts` 补齐字段
为每个 `CHARACTERS` 条目添加 `currentLocationId`，值必须对应 `LOCATIONS[*].id` 之一。  
允许多个角色同属一个地点；允许某些地点暂时无角色。

---

## 3. State Definitions (App‑level)

在 `App.tsx` 维持并新增以下状态：
- `currentLocationId: string`：玩家当前位置（已有）。
- `selectedLocation: Location | null`：地图当前选中地点（已有）。
- `activeLocationId: string | null`：Champions 过滤目标（新增）。

### 3.1 默认规则
- 初始加载：`activeLocationId = currentLocationId`（默认展示“当前地点的英雄”）。
- `selectedLocation` 变化 **不** 自动影响 `activeLocationId`（避免误触即改筛选）。

---

## 4. Interaction Flow (UX Contract)

### 4.1 Map Marker → Sidebar (选择 1A)
- **点击任意 marker**：
  1. `selectedLocation = location`
  2. 打开左侧 `Sidebar` 展示该地点详情
  3. **不滚动页面、不改变 champions 筛选**
- `MapMarker` 只保留**高亮/小标签/动效**；不再承担详细说明与“View Details”按钮（避免与 Sidebar 重复）。

### 4.2 Sidebar → Champions Scroll & Filter (选择 2A + 3B)
在 `Sidebar` 增加一个显式 CTA：
- 文案建议：`View Champions Here`
- 点击行为：
  1. `activeLocationId = selectedLocation.id`
  2. `currentView = 'characters'`（或直接 `scrollIntoView`）
  3. 滚动到 `CharacterGridSection` 顶部并显示过滤指示

### 4.3 Champions Filtering UI
在 `CharacterGridSection` 顶部展示一个过滤栏：
- 当 `activeLocationId != null`：
  - 显示：`Showing champions at <Location.name>`
  - 提供按钮：`Show All` → `activeLocationId = null`
- 当 `activeLocationId == null`：
  - 显示：`All Champions`

过滤逻辑（在 `App.tsx` 计算后下发）：
```ts
const filteredCharacters =
  activeLocationId
    ? characters.filter(c => c.currentLocationId === activeLocationId)
    : characters;
```

空结果态：
- 当过滤后为空时，显示一句沉浸式提示（例如 “No champions are currently here.”）并保留 `Show All`。

### 4.4 Travel Flow (选择 4A)
保持现有 Travel 行为，并补一条规则：
- Travel 成功（`setCurrentLocationId(destination.id)`）后：
  - `activeLocationId = destination.id`（同步到新当前位置）
  - `selectedLocation = null`（Sidebar 关闭）
  - **不自动滚动**（仍需用户显式操作）

### 4.5 Zoom / Scroll Boundary (选择 5A)
- 维持 `InteractiveMap` 的 `Ctrl + Wheel` 缩放策略，避免与页面滚动冲突。
- Marker 的点击/hover 不应破坏拖拽与缩放手势。

---

## 5. Implementation Tasks (by file)

### 5.1 `types.ts`
- 扩展 `Character` 接口增加 `currentLocationId`、`homeLocationId?`。
- 相关组件 props 若引用 Character，补齐类型。

### 5.2 `constants.ts`
- 为所有 `CHARACTERS` 添加 `currentLocationId`。

### 5.3 `components/MapMarker.tsx`
- 移除“选中后浮层详情 + View Details 按钮”这块 UI。
- 保留：
  - type 颜色/光晕/心跳动效
  - 选中/当前地点的视觉区分
  - hover 小标签（可保留）

### 5.4 `components/Sidebar.tsx`
- 新增 CTA 按钮 `View Champions Here`（位置建议在 Footer Action 上方或并列）。
- CTA 点击回调由 `App.tsx` 透传。

### 5.5 `App.tsx`
- 新增 `activeLocationId` 状态与默认初始化。
- 新增 handler：`handleViewChampionsForLocation(location)`  
  - 设置 `activeLocationId`
  - 切换 view/滚动到 champions 区
- Sidebar 增加 prop：`onViewChampions(location)`。
- 向 `CharacterGridSection` 传入 `filteredCharacters` 以及当前过滤信息（locationName/activeLocationId）。

### 5.6 `components/CharacterGridSection.tsx`
- 接收过滤后的列表与过滤信息 props。
- 顶部新增过滤栏 + `Show All` 按钮。
- 空结果态渲染。

---

## 6. Execution Checklist
1. 更新 `types.ts` 与 `constants.ts`（确保数据能按地点过滤）。
2. 精简 `MapMarker` 的选中浮层，保证 Sidebar 成为唯一详情源。
3. Sidebar 加 CTA，并把回调接到 `App.tsx`。
4. `App.tsx` 增加 `activeLocationId` 与滚动/筛选逻辑。
5. Champions 区新增过滤栏与空结果态。

---

## 7. Future Hook: AI‑Driven Character State Machine (V2)
- `currentLocationId` 是未来“叙事/小模型状态机更新角色位置”的唯一驱动字段。  
  后续里程碑将引入：
  - 叙事事件 → 角色状态更新（更新 `currentLocationId`）
  - 触发 Map/Champions 实时联动。

