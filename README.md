# THINK

A quiet place for unfinished thoughts.

think is a small personal note app for quick thoughts, unfinished writing, observations, and longer private notes. V1 intentionally has no login, registration, email verification, or access restriction.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Cloudflare Pages
- Cloudflare Pages Functions
- Supabase Postgres

## Local setup

Install dependencies:

```bash
npm install
```

Create local environment variables for Pages Functions. Do not commit this file:

```bash
cp .env.example .dev.vars
```

Fill in:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run the app:

```bash
npm run dev
```

For local testing of Pages Functions, use Cloudflare's Pages development workflow if needed. The deployed app reads the same variables from Cloudflare Pages settings.

## Supabase initialization

Run the SQL in `supabase/schema.sql` in the Supabase SQL editor. It creates:

- `public.notes`
- `set_updated_at()` trigger function
- indexes for updated time, pinned status, archived status, and tags

V1 does not use Supabase Auth or user-level RLS.

## Cloudflare Pages

Build settings:

```text
Build command: npm run build
Build output directory: dist
Production branch: main
```

Environment variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Set `SUPABASE_SERVICE_ROLE_KEY` as a Secret / encrypted value. Do not expose it in frontend code.

Custom domain:

```text
think.minamir.cn
```

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run lint
```

## Data export

Use the Settings page to export all non-deleted notes as JSON or Markdown.
