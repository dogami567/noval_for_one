# Admin Media Spec: 缩略图识别 + 图片上传到 Storage (Final)

**ID**: 005c-admin-media  
**Status**: FINAL  
**Date**: 2025-12-12  
**Owner**: Technical Architect (GPT‑5.2)  
**Target**: Execution Agent

本任务为 005b 的补丁，继承并遵循：  
- `spec/000-system-architecture-final.md`  
- `spec/005-supabase-foundation-final.md`  
- `spec/005b-admin-panel-final.md`

本文件为 005c 的**唯一执行规格**。

---

## 1. Goals / Non‑Goals

### Goals
- 让管理员（非技术用户）在 `/admin` 面板里**一眼识别角色/地点**，避免仅靠名字难以判断对象。
- 支持在管理面板内**直接上传图片到 Supabase Storage**（public buckets），并自动回填/保存 `image_url` 字段。

### Non‑Goals
- 不做复杂的图片裁剪/压缩/多图管理（V1 仅单张 cover/portrait）。
- 不放开游客上传权限；上传必须走后端 service‑role + token gate。

---

## 2. Patch A — 管理列表缩略图 + 预览

### 2.1 角色列表（左侧）
在 `components/AdminPage.tsx` 的角色列表项中：
- 从“只显示 `char.name`”改为：
  - 左侧 32–40px 圆形缩略图（`char.imageUrl`）。
  - 右侧两行文本：
    - 第一行：`char.name`
    - 第二行：`char.title` 或 `char.faction`（灰色小字）
- 若无 `imageUrl`，显示占位（首字母/灰色圆）。

### 2.2 地点列表（左侧）
同样加入缩略图（取 `loc.imageUrl`）+ 两行文本（name + type/status）。

### 2.3 编辑区预览（右侧表单顶部）
在地点/角色编辑表单顶部增加一块“当前图片预览”：
- `img src={form.imageUrl}`，保持宽高比，最大高度约 180–220px。
- 无图时显示“暂无图片”占位框。

---

## 3. Patch B — 图片上传到 Supabase Storage

### 3.1 Buckets 与路径
沿用 005 的 public buckets：
- `locations`
- `characters`

上传路径强约定（由后端生成，前端不直接拼任意 path）：
- 地点封面：`locations/<locationId>/cover.<ext>`
- 角色头像：`characters/<characterId>/portrait.<ext>`

`<ext>` 由上传文件的 mime/type 推断（jpg/png/webp）。

### 3.2 后端上传 API
新增 `api/admin/upload.ts`（Vercel Function）：
- 只接受 `POST`
- Admin 校验与 005b 一致：header `x-admin-token` 必须等于 `ADMIN_EDIT_TOKEN`。
- 使用 `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` 创建 supabaseAdmin。

**Request body（JSON）**
```ts
{
  entity: 'location' | 'character';
  id: string;                   // 必须是已存在的 uuid
  filename: string;             // 原始文件名（用于 ext 推断）
  contentType: string;          // image/jpeg | image/png | image/webp
  base64: string;               // 不带 data: 前缀的 base64
}
```

**Server 行为**
- 校验 `entity` 仅允许 `location|character`。
- 校验 `contentType` 必须为 image/* 且 ext 白名单（jpg/png/webp）。
- 生成 `bucket` 与 `path`（按 3.1）。
- `Buffer.from(base64, 'base64')` → `supabaseAdmin.storage.from(bucket).upload(path, buffer, { upsert: true, contentType })`
- 上传成功后取 public url：
  - `const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)`
  - `data.publicUrl` 作为返回值。

**Response**
```ts
{ publicUrl: string }
```

**错误处理**
- 401：无效 token
- 400：参数缺失/格式不符/不支持的图片类型
- 500：Supabase 上传失败或 env 缺失
- 返回体只包含友好中文 message，不回显任何 key。

### 3.3 前端上传流程
在 `components/AdminPage.tsx`：

**通用交互**
- 在地点/角色表单的 `imageUrl` 输入旁新增：
  - `<input type="file" accept="image/*" />`
  - “上传并替换”按钮
- 若当前对象尚未保存（没有 `selectedLocationId/selectedCharacterId`），禁用上传按钮并提示“请先保存以生成 ID”。

**实现步骤**
1. 用户选择文件后，前端读取为 base64：
   - `FileReader.readAsDataURL(file)` → 去掉 `data:*;base64,` 前缀。
2. 调用新封装的 admin upload client：
   - 新增 `services/adminUploadApi.ts` 或在 `services/adminApi.ts` 内补充 `adminUploadImage(payload)`。
   - 请求 `/api/admin/upload`，header 自动带 `x-admin-token`。
3. 成功后得到 `{ publicUrl }`：
   - `setLocationForm({ ...form, imageUrl: publicUrl })` / `setCharacterForm(...)`
   - **立即调用保存**（复用现有 `handleSaveLocation/handleSaveCharacter`），确保 DB 的 `image_url` 同步更新。

**大小限制提示**
- 若文件 > 2MB，前端提示“图片过大，请压缩后再上传”（避免 Vercel body limit）。

---

## 4. Acceptance Criteria
- `/admin` 左侧列表能通过缩略图+副标题快速识别地点/角色。
- 右侧表单有清晰图片预览。
- 上传图片后：
  - Storage bucket 内出现对应文件（可重复上传覆盖）。
  - 表单 `imageUrl` 自动变为 public URL。
  - 保存后刷新页面仍能正确显示该图片。
- 普通游客路径仍无上传/编辑入口。

