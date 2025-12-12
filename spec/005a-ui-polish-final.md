# UI Polish Spec: Map Pan Bounds + CN UI + Supabase Fallback (Final)

**ID**: 005a-ui-polish  
**Status**: FINAL  
**Date**: 2025-12-12  
**Owner**: Technical Architect (GPT‑5.2)  
**Target**: Execution Agent  

本任务为 005 的小补丁，继承 `spec/000-system-architecture-final.md` 与 `spec/005-supabase-foundation-final.md`。
本文件为 005a 的**唯一执行规格**。

---

## 1. Goals / Non‑Goals

### Goals
- 修复地图拖拽后“回弹/自动居中”的手感问题，并让地图在缩放/拖拽时始终**覆盖视口**（不露底）。
- 修复 Supabase 数据读取时的“混用 fallback”问题：避免 DB locations + constants characters 的不一致。
- 将前端所有硬编码 UI 文案改为**简体中文**（不改内容数据）。

### Non‑Goals
- 不做完整 i18n 系统（仅替换静态文案）。
- 不翻译/修改 Supabase 表内的内容字段（地点/角色/编年史文本将由我后续以中文写入）。
- 不改 LLM / Tavern 相关逻辑（留到 006+）。

---

## 2. Patch A — 地图拖拽回弹 + 覆盖视口

### 2.1 问题
当前 `components/InteractiveMap.tsx` 使用 `TransformWrapper`：
- `minScale=0.5` 允许缩小到地图小于容器，导致拖拽结束后被 `centerZoomedOut` / bounds 逻辑拉回中心。
- `limitToBounds` 在内容小于容器时边界非常“紧”，手感像回弹。

### 2.2 目标行为
- 地图可自由拖拽浏览；**只有拖到真正边缘才被限制**，不会松手立刻回到中心。
- 无论缩放到何种程度，地图图像始终覆盖容器，不出现黑底空白。
- 保持现有控件（+/‑/重置）与 Ctrl+滚轮缩放手势不变。

### 2.3 实现要求
在 `components/InteractiveMap.tsx`：

1. 显式关闭缩小居中：
   - `centerZoomedOut={false}`。

2. 动态计算 `minScale`，保证“cover”：
   - 地图内容固定基准尺寸：`MAP_WIDTH = 1920`, `MAP_HEIGHT = 1080`（与现有 div 一致）。
   - 通过 `ResizeObserver`（或等效方案）监听外层容器尺寸：
     - `coverScale = max(wrapperWidth / MAP_WIDTH, wrapperHeight / MAP_HEIGHT)`
   - `minScale = coverScale`。
   - `initialScale` 建议设为 `coverScale`，避免初次渲染露底。

3. 保持 bounds 但不再触发回弹感：
   - 继续 `limitToBounds`。
   - 如仍有明显回弹动画，可追加：
     - `alignmentAnimation={{ disabled: true }}`（仅禁用对齐回弹动画，不解除边界）。

---

## 3. Patch B — Supabase Fallback “全有全无”

### 3.1 问题
`App.tsx` 当前按表单独 fallback，可能出现：
DB locations（uuid id） + constants characters（loc_1/loc_2）混用 ⇒ 地点筛选看不到角色。

### 3.2 实现要求
在 `App.tsx` 的 Supabase 加载逻辑中：
- 只要三表任意一表为空（length===0），则**三表一起 fallback**到 constants。
- 伪代码：
  ```ts
  const hasDbData =
    dbLocations.length > 0 &&
    dbCharacters.length > 0 &&
    dbChronicles.length > 0;

  const nextLocations = hasDbData ? dbLocations : LOCATIONS;
  const nextCharacters = hasDbData ? dbCharacters : CHARACTERS;
  const nextChronicles = hasDbData ? dbChronicles : CHRONICLES;
  ```

---

## 4. Patch C — UI 全中文（静态文案）

### 4.1 范围
仅替换硬编码 UI 文案；**不修改** locations/characters/timeline_events 的内容字段。

### 4.2 需要替换的主要文件
（执行 AI 需逐个扫描并翻译所有英文静态字符串）

- `components/Navbar.tsx`
  - Map → 地图
  - Champions → 英雄
  - Chronicles → 编年史

- `App.tsx`
  - Scroll to Explore → 向下滚动探索
  - The Champions / Legends of Aetheria → 英雄群像 / 艾瑟瑞亚的传说
  - Traversing the Realm... → 正在穿越大陆…
  - footer 文案全部中文化。

- `components/CharacterGridSection.tsx`
  - Showing champions at… / All Champions / Show All / Rumor / 空状态提示等全部中文。

- `components/Sidebar.tsx`
  - View Champions Here / Travel to Location / Location Locked / You Are Here / Save Changes / Cancel / Locked lore 占位提示等中文化。

- `components/CharacterSidebar.tsx`
  - Biography / Related Tales / Champion / Save Changes / Cancel 等中文化。

- `components/ChroniclesView.tsx`
  - The Living Chronicle / Add Plot Event / Inscribe New History / Loading chronicles… 等中文化。
  - 状态显示保持内部值不变，但展示中文：
    - completed → 已完成
    - active → 进行中
    - pending → 未开始

- `components/ChatWidget.tsx`
  - Chronicle Keeper / Ask about the history… / 发送相关提示等中文化。

- `components/MapMarker.tsx`
  - Current Location → 当前位置
  - (Locked) →（锁定）

- `constants.ts`
  - `INITIAL_WELCOME_MESSAGE` 翻译为中文欢迎语（临时 UI 文案）。

---

## 5. Acceptance Criteria
- 地图拖拽后不再自动回到中心；缩放/拖拽过程中无露底黑边。
- 缩小到最小比例时地图仍覆盖容器。
- Supabase 三表任一为空时不会出现 DB/常量混用导致的筛选失败。
- 页面 UI 不再出现英文硬编码文案（除非来自 DB 内容字段）。

