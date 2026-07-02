# THINK

一个轻量的个人思考与日记记录网站。

think 用来保存零散想法、问题灵感、观察记录、长一点的个人文字，以及按日期整理的日记。当前版本不包含登录、注册、邮箱验证或访问限制。

## 功能

- 写作时可选择 `思考` 或 `日记`，默认是思考
- 思考按最近更新时间排序
- 日记按日记日期倒序排序
- 日记一天只能一篇，可补写过去日期
- 手动保存，避免每输入一个字就保存
- 标签、搜索、归档、软删除
- JSON / Markdown 导出

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS
- Cloudflare Workers 静态资源部署
- Cloudflare Worker API
- Supabase Postgres

## 本地运行

安装依赖：

```bash
npm install
```

本地开发：

```bash
npm run dev
```

运行验证：

```bash
npm run lint
npm test
npm run build
```

## 环境变量

`.env.example` 中列出需要的变量：

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

线上环境需要在 Cloudflare Worker 中配置：

```text
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_URL` 已写入 `wrangler.jsonc` 的 `vars`，因为它不是密钥。`SUPABASE_SERVICE_ROLE_KEY` 必须使用 Secret / 密钥方式配置，不能提交到 GitHub。

## Supabase 初始化 / 迁移

在 Supabase SQL Editor 中执行：

```text
supabase/schema.sql
```

它会创建或补齐：

- `public.notes`
- `kind`：`thought` / `diary`
- `diary_date`：日记日期
- `set_updated_at()` 触发器函数
- updated time / pinned / archived / tags / diary date 索引
- `notes_diary_date_unique`：保证同一天只有一篇未删除日记
- service role 对 `public.notes` 的读写权限

当前版本不使用 Supabase Auth，也不配置用户级 RLS。

## Cloudflare 部署

当前项目按 Worker 静态资源部署：

```bash
npx wrangler deploy
```

`wrangler.jsonc` 包含：

- Worker 名称：`think`
- 静态资源目录：`dist`
- SPA fallback
- 自定义域名：`think.minamir.cn`
- Worker API 入口：`src/worker.ts`

构建由 Wrangler 执行：

```text
npm run build
```

## API

Worker 处理以下接口：

```text
GET    /api/notes
GET    /api/notes?kind=thought
GET    /api/notes?kind=diary
GET    /api/notes?kind=all
POST   /api/notes
GET    /api/notes/:id
PATCH  /api/notes/:id
DELETE /api/notes/:id
GET    /api/export?format=json
GET    /api/export?format=markdown
```

## 数据导出

在设置页可以导出所有未删除记录：

- JSON
- Markdown

Markdown 导出会包含内容类型和日记日期。
