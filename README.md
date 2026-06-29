# THINK

一个存放未完成想法的地方。

think 是一个很轻的个人想法记录工具，用来保存临时想法、问题灵感、观察记录和较长的个人文字。V1 不包含登录、注册、邮箱验证或访问限制。

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

`SUPABASE_URL` 已写入 `wrangler.jsonc` 的 `vars`，因为它不是密钥。`SUPABASE_SERVICE_ROLE_KEY` 必须使用 Secret / 密钥方式配置，不能提交到 GitHub。当前线上 Worker 使用 Supabase Legacy `service_role` JWT；如果改用新版 `sb_secret_...` 后 Data API 返回 403，请切回 Legacy `service_role` 或确认 Supabase 项目已给对应角色授权。

## Supabase 初始化

在 Supabase SQL Editor 中执行：

```text
supabase/schema.sql
```

它会创建：

- `public.notes`
- `set_updated_at()` 触发器函数
- updated time / pinned / archived / tags 索引

V1 不使用 Supabase Auth，也不配置用户级 RLS。

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
