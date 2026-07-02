# 日记与思考分流设计

## 背景

当前 `think` 是一个个人想法记录网站，所有内容都存在同一套 `notes` 数据里。新的目标是在不引入登录、社交、复杂模板的前提下，把内容分成两类：

- `思考`：默认类型，继续用于零散想法、问题、观察和长一点的文字。
- `日记`：按日期组织，每天只能有一篇，可补写过去日期。

这不是重做产品，而是在现有记录系统上增加“类型”和“日记日期”两个概念。

## 目标

1. 写作时可以选择 `思考` 或 `日记`，默认是 `思考`。
2. 顶部导航新增 `日记`。
3. `记录` 页面只显示思考。
4. `日记` 页面只显示日记，并按日记日期倒序。
5. 首页可以混合显示最近内容。
6. 日记一天只能一篇。
7. 日记默认使用撰写当天日期，也可以手动修改日期，用于补写。
8. 日记标题默认自动生成日期标题，例如 `2026年7月2日`。
9. 日记保留标题、正文、标签、归档、删除和手动保存。
10. 日记不显示置顶入口。

## 非目标

- 不做登录、注册、用户系统。
- 不做公开博客、评论、点赞、分享。
- 不引入富文本编辑器。
- 不做复杂日历视图。
- 不把日记做成强制模板。
- 不新增独立 `diaries` 表。

## 推荐方案

在现有 `notes` 表上增加字段：

```sql
kind text not null default 'thought',
diary_date date
```

其中：

- `kind = 'thought'` 表示思考。
- `kind = 'diary'` 表示日记。
- `diary_date` 只对日记有意义。

使用部分唯一索引保证“一天一篇日记”：

```sql
create unique index if not exists notes_diary_date_unique
on public.notes (diary_date)
where kind = 'diary' and is_deleted = false;
```

保留软删除逻辑。已软删除的日记不占用日期，可以重新创建同一天日记。

## 数据迁移

现有记录全部视为思考：

```sql
alter table public.notes
add column if not exists kind text not null default 'thought';

alter table public.notes
add column if not exists diary_date date;

update public.notes
set kind = 'thought'
where kind is null;
```

增加约束：

```sql
alter table public.notes
drop constraint if exists notes_kind_check;

alter table public.notes
add constraint notes_kind_check
check (kind in ('thought', 'diary'));
```

日记日期规则：

- 创建日记时如果没有传 `diary_date`，服务端使用当天日期。
- `kind = 'diary'` 时必须有 `diary_date`。
- `kind = 'thought'` 时 `diary_date` 可以为空。

## 页面设计

### 顶部导航

新增 `日记`：

```text
首页 / 写下 / 记录 / 日记 / 归档 / 设置
```

### 写作页 `/write`

新增类型选择控件：

```text
类型：思考 / 日记
```

默认选择 `思考`。

当选择 `思考`：

- 行为与当前记录一致。
- 保存后进入 `/notes/:id`。
- 列表按 `updated_at desc` 排序。
- 修改内容会更新 `updated_at`，因此可回到记录列表顶部。

当选择 `日记`：

- 默认日期为今天。
- 默认标题自动生成日期标题。
- 显示日期输入。
- 保存时如果该日期已存在日记，直接打开已有日记，不创建重复记录。
- 保存后进入 `/notes/:id`，但详情页按日记模式展示。

### 日记页 `/diary`

新增页面，只显示 `kind = 'diary'` 且未删除的记录。

排序：

```text
diary_date desc
```

每条展示：

- 日记日期
- 标题
- 内容摘要
- 标签
- 更新时间可作为次要信息显示

空状态文案：

```text
还没有日记。
从今天开始写一点。
```

### 记录页 `/notes`

只显示 `kind = 'thought'` 且未删除的记录。

排序保持现状：

```text
is_pinned desc, updated_at desc
```

### 详情页 `/notes/:id`

详情页继续复用 `NoteEditor`，但根据记录类型调整界面。

思考模式：

- 显示置顶按钮。
- 不显示日记日期。

日记模式：

- 不显示置顶按钮。
- 显示日记日期输入。
- 修改内容不会自动改变日记日期。
- 修改日记日期时，如果目标日期已有另一篇日记，保存应失败并提示已有日记。

### 首页 `/`

首页混合显示最近内容：

- 思考按 `updated_at` 参与最近内容。
- 日记按 `diary_date` 或 `updated_at` 显示都可接受；为了页面语义稳定，首页显示最近内容时优先使用记录更新时间，日记卡片同时展示日记日期。

## API 设计

### 列表接口

扩展现有接口：

```text
GET /api/notes?kind=thought
GET /api/notes?kind=diary
GET /api/notes?kind=all
```

排序规则：

- `kind=thought`：`is_pinned.desc,updated_at.desc`
- `kind=diary`：`diary_date.desc,updated_at.desc`
- `kind=all` 或未传：用于首页，按 `updated_at.desc`

### 创建接口

`POST /api/notes`

新增字段：

```ts
kind?: 'thought' | 'diary'
diary_date?: string
```

规则：

- 未传 `kind` 时默认为 `thought`。
- `kind = 'diary'` 且未传 `diary_date` 时，服务端填当天日期。
- `kind = 'diary'` 时，如果相同 `diary_date` 已存在未删除日记，返回 `409`，响应里包含已有日记 id。

建议响应：

```json
{
  "error": "diary_exists",
  "noteId": "existing-note-id"
}
```

前端收到后跳转到已有日记。

### 更新接口

`PATCH /api/notes/:id`

规则：

- 思考可以更新标题、正文、标签、置顶、归档。
- 日记可以更新标题、正文、标签、归档、日记日期。
- 日记忽略或拒绝 `is_pinned` 更新。
- 日记改到已有日期时返回 `409 diary_exists`。

## 导出

导出 JSON 和 Markdown 时保留全部未删除内容，并增加类型信息。

Markdown 中日记建议显示：

```markdown
## 2026年7月2日

Type: diary
Diary date: 2026-07-02
Updated: ...
Tags: ...
```

思考显示：

```markdown
## 标题

Type: thought
Created: ...
Updated: ...
Tags: ...
```

## UI 约束

- 保持安静、温暖、文字优先。
- 类型选择使用分段控件，不做大卡片。
- 日期输入只在日记模式显示。
- 日记页不做复杂日历，不做统计图。
- 所有按钮和标签在手机端不能拥挤。

## 错误处理

1. 创建日记时日期已存在：跳转已有日记。
2. 修改日记日期时日期已存在：提示该日期已有日记，不自动合并。
3. 保存失败：沿用当前本地草稿兜底。
4. `diary_date` 无效：提示日期无效。

## 测试计划

重点测试：

1. 新建默认类型为思考。
2. 新建思考后出现在记录页，不出现在日记页。
3. 新建日记后出现在日记页，不出现在记录页。
4. 日记默认标题为日期。
5. 同一天创建第二篇日记时打开已有日记。
6. 日记页按 `diary_date desc` 排序。
7. 修改日记内容不改变 `diary_date`。
8. 日记编辑界面不显示置顶按钮。
9. 思考编辑界面继续显示置顶按钮。
10. 导出内容包含 `kind` 和 `diary_date`。

## 实施边界

这次改动应限制在：

- Supabase schema
- Note 类型
- API payload/query
- 写作/编辑组件
- 新增日记页
- 导航和首页列表过滤
- 导出格式
- 对应测试

不做无关视觉重做，不调整登录、安全策略，不引入新依赖。

## 自审结果

- 无占位符或待定项。
- 数据模型、API 和页面规则一致。
- 范围可在一次实现计划中完成。
- “一天一篇日记”的创建和修改冲突处理已明确。
