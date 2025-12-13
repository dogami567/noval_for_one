# Spec 007 实现 Code Review（第二架构师）

日期：2025-12-13  
面向：执行 AI / 主架构师  
Review 范围：`92a6777`（feat: compendium places & stories (spec 007)）  
对照规格：`spec/007-compendium-places-stories-final.md`

## 总体结论
007 的主链路已经跑通，方向正确：`places/stories` 数据模型 + 迁移、`/lore`（地区树）+ `/place/<slug>` + `/character/<slug>` + `/story/<slug>` 的公共阅读页、`/admin` 管理端维护 places/stories（含关系）、Markdown 渲染、以及聊天端的“设定资料 Context Pack”注入都已落地。

建议合并到下一个阶段前做一轮“小补丁”，集中修 6 个点（见下文 P0），否则后续数据量上来会出现明显的性能/可用性/安全边界问题。

---

## 已达成（正向反馈）
- **信息架构**：`index.tsx` 用 pathname 分流实现了 `/lore`、`/place`、`/character`、`/story`，符合“无 router 依赖”的约束。
- **内容承载**：`react-markdown` + `skipHtml`（`components/MarkdownRenderer.tsx`）默认安全，符合 Markdown 渲染的 XSS 基线。
- **数据模型升级**：
  - `places` 统一承载大陆/国家/城市/poi，地图 marker 仅渲染有 `map_x/map_y` 的记录（`services/placeService.ts`）。
  - `stories` + `story_characters` + `story_places` 让“多篇短篇 + 多角色/多地点关联”成为一等公民（`services/storyService.ts`）。
- **迁移策略**：`supabase/migrations/007_compendium_places_stories.sql` 复用了旧 `locations.id` 到 `places.id`，并回填 `characters.current_place_id`，能平滑过渡现有地图与角色。
- **Admin 可用性**：`components/AdminPage.tsx` 已覆盖 places/stories 的表单与多选关系，且上传管线扩展到 `place/story`（`api/admin/upload.ts`）。
- **聊天与设定联动（非 embedding）**：`api/chat.ts` 已按输入文本匹配角色/地点，并附上相关短篇摘要注入 system prompt，达到了你预期的“多个角色信息都能被拿到”的效果雏形。

---

## 需修复（按优先级）

### P0（建议上线前修）
1) **Chat Context Pack 换行被压扁，结构信息丢失**
   - 定位：`api/chat.ts:356`（`return clipText(lines.join('\n'), MAX_CONTEXT_PACK_CHARS);`）
   - 问题：`clipText()` 内部会 `replace(/\s+/g, ' ')`，最终把 `\n` 压成空格；Context Pack 的“【角色】/【地点】/【短篇】”结构被弱化，模型利用效果下降。
   - 建议修复：
     - 为 Context Pack 单独做 `truncatePreserveNewlines()`：只按字符截断，不做空白归一化。
     - （可选）把 `buildContextPack()` 的候选列表做内存缓存（TTL 1–5 分钟），避免每次请求全表扫描。

2) **首页数据回退策略过于“全或无”，会导致已填数据看不到**
   - 定位：`App.tsx:45`（`hasDbData = dbLocations.length>0 && dbCharacters.length>0 && dbChronicles.length>0`）
   - 问题：只要编年史没填，就会整站回退 constants（places/characters 即使 DB 已有也看不到）。
   - 建议修复：
     - 拆成分模块回退：places/characters 只要有 DB 就用 DB；chronicles 单独回退，不影响其它模块。

3) **上传接口缺少服务端强制大小限制（仅靠前端）**
   - 定位：`api/admin/upload.ts:95`（`Buffer.from(base64)` 后直接 upload）
   - 问题：前端虽然限制 2MB，但服务端不校验会被大请求打爆内存/超时（admin token 泄露时风险更高）。
   - 建议修复：
     - 在 decode 后校验 `buffer.length`（例如 <= 2MB），超出直接 `400`。
     - （建议）校验 `id` 为 uuid（至少拒绝含 `/` 的输入），防止任意 object key 写入同 bucket。

4) **关系表缺关键索引，数据量上来后“按角色/地点找短篇”会变慢**
   - 定位：`supabase/migrations/007_compendium_places_stories.sql`：
     - `story_characters`：目前主键为 `(story_id, character_id)`，按 `character_id` 查询缺索引
     - `story_places`：目前主键为 `(story_id, place_id)`，按 `place_id` 查询缺索引
   - 建议修复（migration 加两条即可）：
     - `create index if not exists story_characters_character_id_idx on public.story_characters(character_id);`
     - `create index if not exists story_places_place_id_idx on public.story_places(place_id);`

5) **Lore 地区树递归无“环”防护，误操作 parent_id 会无限递归**
   - 定位：`components/LorePage.tsx:59`（`renderTree()` 递归）
   - 问题：如果管理员把 A 的父级设成 A 的子孙，会导致页面栈溢出/卡死。
   - 建议修复：在渲染时加入 `visited` 集合（或最大深度阈值），检测到重复 id 直接停止并提示“数据存在循环引用”。

6) **搜索时只按 continent 起树，命中子节点但没命中大陆会误显示“暂无大陆数据”**
   - 定位：`components/LorePage.tsx:92`（`continents = filteredPlaces.filter(kind==='continent')`）
   - 问题：用户搜索“某城市”，若 `filteredPlaces` 里没有对应大陆记录，会显示“暂无大陆数据”，实际数据存在。
   - 建议修复（任选一种）：
     - `query` 非空时，增加“扁平搜索结果”列表（直接展示匹配到的 place）。
     - 或者按 `parentId === null` 作为 root 展示，而不是强依赖 continent。

### P1（可后置，但建议尽快）
7) **角色侧边栏仍展示 legacy stories，可能与新短篇体系冲突**
   - 定位：`components/CharacterSidebar.tsx:145`（`character.stories`）
   - 影响：用户在首页点开英雄，会看到旧 jsonb stories（可能为空/不一致）；而新体系在 `/character/<slug>` 才正确。
   - 建议修复：侧边栏隐藏“相关故事”区块，或改为调用 `listStoriesByCharacter(character.id)`（与详情页一致）。

8) **`index.css` 缺失导致构建警告**
   - 定位：`index.html:56`（`<link rel="stylesheet" href="/index.css">`）
   - 现象：`npm run build` 会提示 `index.css doesn't exist...`
   - 建议修复：补一个最小 `index.css`（空文件也行）或移除该 link。

### P2（后续演进建议）
9) **Admin 保存 stories + relations 没有事务一致性**
   - 定位：`api/admin/stories.ts`（先 update/insert story，再 delete+insert 关系）
   - 影响：极端情况下可能出现 story 已写入但关系写入失败的短暂不一致（可接受，但要知晓）。
   - 建议：V2 可考虑 RPC/事务化（或至少“关系失败则返回明确错误并提示重试”）。

10) **Chat Context Pack 每次请求都拉候选全表**
   - 定位：`api/chat.ts`（`select id,name... limit(500/800)`）
   - 建议：加入内存缓存（TTL）或改成基于关键字的 DB 过滤（FTS/ilike），避免数据量上来后耗时明显。

---

## 风险与注意事项（架构层）
- `api/chat.ts` 使用 `service_role` 读取 places/characters/stories：目前这些表是 public lore 表没问题；但未来若添加“私密字段/未公开内容”，要通过 **view** 或拆表避免聊天泄露。
- slug 允许中文是 OK 的，但要持续保持 `encodeURIComponent`/`decodeURIComponent` 一致（当前实现没问题）。

---

## 建议的验证清单（给执行 AI）
1) DB：
   - 执行 `supabase/migrations/007_compendium_places_stories.sql` 后，确认 `places/stories/story_characters/story_places` 均可 anon `select`。
   - 验证 `characters.current_place_id` 不为空，且外键指向 `places.id`。
2) Admin：
   - `/admin` 新建 continent/country/city/poi（poi 填 `map_x/map_y`），保存后 `/lore` 能按树看到。
   - 新建 story，勾选多个角色/地点，保存后 `/place/<slug>` 与 `/character/<slug>` 能看到“相关短篇”。
   - 上传 place/story 封面：尝试超大文件（应被服务端拒绝）。
3) Public：
   - `/lore` 搜索关键字（命中城市/poi 时不应出现“暂无大陆数据”的误提示）。
4) Chat：
   - 输入同时包含多个角色名/别名 + 地点名，确认回复能引用 Context Pack（且结构不被压扁）。

