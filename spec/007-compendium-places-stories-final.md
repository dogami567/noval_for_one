# Compendium Architecture Spec: Places (Continent/Country/City) + Stories (Final)

**ID**: 007-compendium-places-stories  
**Status**: FINAL  
**Date**: 2025-12-13  
**Owner**: Technical Architect (GPT-5.2)  
**Target**: Execution Agent

本任务 spec 继承并遵循：  
- `spec/000-system-architecture-final.md`  
- `spec/005-supabase-foundation-final.md`  
- `spec/005b-admin-panel-final.md`  
- `spec/005c-admin-media-final.md`

本文件为 007 的**唯一执行规格**。  
目标：把当前“地图 + 英雄 + 事件”的 MVP，升级为更接近「英雄联盟宇宙官网」的信息架构：**大陆/国家/城市设定页 + 英雄详情页 + 多篇短篇小说阅读页**。

---

## 1. Goals / Non?Goals

### Goals
- 建立“设定集（Compendium）”的**信息架构与数据承载**：
  - `Places`：大陆/国家/城市（层级树），每个节点有独立详情页（slug URL）。
  - `Stories`：短篇小说（多篇=多条记录），每篇有独立阅读页（slug URL）。
  - `Characters`：英雄详情页，可关联多篇短篇。
- 数据层面实现“合并”：**地区（大陆/国家/城市）与地图点统一为 Place**（同一张表）。
- MVP 不引入登录：游客匿名可读；写入继续只允许 `/admin` + serverless service-role。
- 为聊天助手提供“可引用的设定正文来源”（先做规则化检索，不做 embedding）。

### Non?Goals (MVP)
- 不做发布/草稿/隐藏（不引入 `draft/published` 工作流）。
- 不做 SSR/SSG/SEO（仍是 Vite SPA；见 000）。
- 不做向量检索/embedding（pgvector/RAG 留到 V2）。
- 不做 AI 自动落库（AI 只生成草稿，人工在 `/admin` 保存；另开独立 spec 再做）。

---

## 2. Product UX / Routes（LoL Universe 风格最小集）

> 当前项目无 router（仅在 `index.tsx` 用 pathname 分流）；本任务仍保持“无依赖 router”的实现策略，减少引入复杂度。  
> 允许后续 V2 再引入 React Router 并保持 URL 兼容。

### 2.1 Public routes（游客可访问）
- `/`：现有首页（地图/英雄/编年史保持不变）
- `/lore`：设定集首页（大陆树 + 搜索/入口）
- `/place/<slug>`：地点/地区详情页（大陆/国家/城市/POI）
- `/character/<slug>`：英雄详情页（英雄介绍 + 关联短篇列表）
- `/story/<slug>`：短篇阅读页（Markdown 正文）

### 2.2 Navigation（最小可用）
- 在现有 `Navbar` 增加一个入口按钮：`设定集` → `window.location.href='/lore'`
- 在 `CharacterCard`/`Sidebar` 内提供“查看详情”按钮：
  - 英雄：`/character/<slug>`
  - 地点：`/place/<slug>`
- 阅读页顶部提供“返回设定集”链接：`/lore`

---

## 3. Domain Model（统一 Place + 独立 Story）

### 3.1 Place（合并 locations + regions）
**Place** 表示：大陆/国家/城市/地图点（POI），统一称为 Place。  
地图上的 pin 只是 Place 的一种呈现：`map_x/map_y != null` 的 Place 才渲染 marker。

层级示例：
- 大陆（continent）
  - 国家（country）
    - 城市（city）
      - 地标/地点（poi）

### 3.2 Story（短篇）
短篇为独立内容类型（Markdown），通过关系表关联多个角色与地点。

---

## 4. Database Schema (Supabase / public)

> 约定：snake_case；uuid 主键；public 表 anon 只读；写入仅 service-role（沿用 005/005b）。

### 4.1 New table: `places`（public read）
字段：
- `id uuid pk default gen_random_uuid()`
- `parent_id uuid null references public.places(id) on delete set null`
- `kind text not null`（`continent|country|city|poi`）
- `name text not null`
- `slug text not null unique`（URL 使用；允许中文 slug）
- `description text`（短介绍）
- `lore_md text`（正文/设定，Markdown）
- `cover_image_url text`
- `map_x numeric null`（0–100）
- `map_y numeric null`（0–100）
- `status text not null default 'unlocked'`（沿用 locked/unlocked gating；非重点但保留兼容）
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

索引建议：
- `unique (slug)`
- `index (parent_id)`
- `index (kind)`

RLS：
- enable RLS
- `select` policy：`using (true)`
- 不创建任何 `insert/update/delete` policy

### 4.2 Update table: `characters`（public read）
新增/调整字段（保持旧字段尽量不破坏 UI）：
- 新增：`slug text not null unique`
- 新增：`aliases text[] null`（用于聊天/搜索的别名，可选；为空也可）
- 替换外键：
  - `current_location_id` → `current_place_id uuid not null references public.places(id)`
  - `home_location_id` → `home_place_id uuid null references public.places(id)`
- 移除/弃用：`stories jsonb`（改用 `stories` 表 + 关系表；过渡期可保留但 UI 不再依赖）

RLS：维持 public 只读策略不变。

### 4.3 New table: `stories`（public read）
字段：
- `id uuid pk default gen_random_uuid()`
- `title text not null`
- `slug text not null unique`
- `excerpt text`
- `content_md text not null`（Markdown 正文）
- `cover_image_url text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

RLS：同 `places`（public select only）。

### 4.4 New table: `story_characters`（public read）
多对多：一篇故事可关联多角色；一名角色可有多篇故事。

字段：
- `story_id uuid not null references public.stories(id) on delete cascade`
- `character_id uuid not null references public.characters(id) on delete cascade`
- `relation text null`（可选：main|supporting|mentioned）
- `created_at timestamptz not null default now()`

约束：
- `primary key (story_id, character_id)`

RLS：public select only。

### 4.5 New table: `story_places`（public read）
多对多：一篇故事可关联多个地点（大陆/国家/城市/poi 均可）。

字段：
- `story_id uuid not null references public.stories(id) on delete cascade`
- `place_id uuid not null references public.places(id) on delete cascade`
- `created_at timestamptz not null default now()`

约束：
- `primary key (story_id, place_id)`

RLS：public select only。

---

## 5. Migration Plan（从 locations 迁移到 places）

### 5.1 新增 migration 文件
新增：`supabase/migrations/007_compendium_places_stories.sql`

执行顺序建议：
1. `create table public.places ...`
2. 从旧表复制：
   - `insert into public.places (...) select ... from public.locations ...`
   - 旧 `locations.id` 直接复用到 `places.id`（确保引用可平滑迁移）
3. 为 `characters` 增加新列并回填：
   - `alter table public.characters add column current_place_id uuid;`
   - `update public.characters set current_place_id = current_location_id;`
   - 同理 `home_place_id`
4. 切换外键约束到 `places`
5. 逐步弃用旧列（同一个 migration 内可 drop；或分两步 migration 更安全）：
   - `drop column current_location_id` / `home_location_id`
6. 可选：为现有 `characters`/`places` 生成 slug（若 admin 尚未补齐）

### 5.2 Slug 生成规则（MVP 简化）
- 允许中文 slug，推荐默认：`slug = name`
- 若重名：在后端/管理员界面提示并要求手动修改；或自动在末尾加短 hash（如 `-a1b2c3`）

### 5.3 旧数据处理
- `characters.stories jsonb`：
  - 允许保留为 legacy（只读），但 public 阅读页/关联关系以 `stories` 表为准。
  - 可选迁移：把 jsonb 数组导入为 `stories` 占位记录（`content_md` 置为 `''` 或 “待补完”），并写入 `story_characters` 关系。

---

## 6. Storage（图片）

沿用 005 的 public buckets + 005c 的上传管线，新增建议 bucket：
- `places`
- `stories`

路径约定（示例）：
- `places/<placeId>/cover.jpg`
- `stories/<storyId>/cover.jpg`

`/admin` 支持上传后自动写入 `cover_image_url`（参照 005c）。

---

## 7. Serverless Admin API（新增/调整）

> 管理端仍然：`/admin` + `x-admin-token` + `service_role`。

### 7.1 新增 endpoints
- `api/admin/places.ts`：CRUD `places`
- `api/admin/stories.ts`：CRUD `stories`
- `api/admin/story-characters.ts`：维护故事-角色关系（可简化：在 `stories.ts` 内一并保存）
- `api/admin/story-places.ts`：维护故事-地点关系（同上）

### 7.2 兼容/迁移策略
- 保留旧 `api/admin/locations.ts`（可选）：
  - 过渡期可继续读旧表或直接代理到 `places`（取决于迁移是否完成）
- `api/admin/characters.ts` 更新字段名：
  - `current_place_id/home_place_id`
  - `slug/aliases`

### 7.3 Admin UI（/admin）
在现有 Tabs 基础上扩展：
- `地点/地区(Places)`：支持选择 `kind` + `parent_id`（树状层级），并支持（可选）填写 `map_x/map_y`
- `短篇(Stories)`：编辑 `title/slug/excerpt/content_md/cover_image_url`
  - 关联管理（最小可用）：
    - 右侧增加“关联角色（多选）”
    - 右侧增加“关联地点（多选）”
  - 保存策略：一次保存 story 本体 + 两个关系表（先删后插，避免 diff 复杂）

---

## 8. Public Reading Pages（前端）

### 8.1 New services（只读）
新增：
- `services/placeService.ts`
  - `listPlaces()`（全量或按 kind/parent 分组）
  - `getPlaceBySlug(slug)`
  - `listChildPlaces(placeId)`
- `services/storyService.ts`
  - `listStories()`（可选）
  - `getStoryBySlug(slug)`
  - `listStoriesByCharacter(characterId)`
  - `listStoriesByPlace(placeId)`（可选：含子树）

调整：
- `services/locationService.ts`：迁移为 placeService 或保留为兼容层（但最终 UI 应使用 Place 命名）
- `services/characterService.ts`：增加 `getCharacterBySlug(slug)`；字段改为 `currentPlaceId/homePlaceId`

### 8.2 Markdown 渲染（最小可用）
为 `Story.content_md` 与 `Place.lore_md` 提供 Markdown 渲染：
- MVP 可引入轻量 markdown renderer（例如 `marked`/`react-markdown`，择一）
- 必须做最小 XSS 约束（禁用 raw HTML 或做 sanitize）

---

## 9. Chat Context（先不 embedding 的“够用方案”）

目标：当用户在聊天里提到多个角色/地点时，助手能基于设定正文回答（而不是纯幻想）。

MVP 策略（不做 embedding）：
- 在 `api/chat.ts` 里做“实体命中”：
  - 从用户输入中匹配 `characters.name` 与 `characters.aliases`（可选）
  - 从用户输入中匹配 `places.name`
- 命中后拉取：
  - 对角色：`name/title/faction/description/lore/bio`（限制长度）
  - 对地点：`name/kind/description/lore_md`（限制长度）
  - 对故事：最多带上关联故事的 `title/excerpt`（先不带全文）
- 将以上拼成 `Context Pack` 注入 system prompt（总长度做硬限制）

升级路径（V2）：
- 先加 Postgres FTS（全文关键字搜索）
- 再加 pgvector（语义检索；Supabase 上通常需要封装 SQL function 用 `rpc()` 调用）

---

## 10. Acceptance Criteria

- Supabase：
  - `places/stories/story_characters/story_places` 建表完成且 anon 可读。
  - `characters` 成功切换到 `current_place_id/home_place_id` 外键。
- Admin：
  - `/admin` 可编辑 places（层级 + 可选 map 坐标）与 stories（正文 + 关联角色/地点）并持久化。
  - 图片上传可覆盖 `places/stories`（或至少允许填 URL）。
- Public：
  - `/lore` 可看到大陆/国家/城市树入口。
  - `/place/<slug>`、`/character/<slug>`、`/story/<slug>` 均可访问并正确渲染 Markdown。
  - 现有 `/` 的地图/英雄/编年史不被破坏（或清晰说明“本阶段将 UI 拆为主页 + 设定集页”）。
