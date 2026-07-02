# Diary Thoughts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add diary/thought content types so writing defaults to thoughts, diaries are one per date, and the app gets a dedicated diary page.

**Architecture:** Reuse the existing `notes` table, API, and editor. Add `kind` and `diary_date` fields, filter list routes by kind, and make the editor hide thought-only controls when editing a diary.

**Tech Stack:** React, TypeScript, Vite, Vitest, Cloudflare Worker, Supabase REST/Postgres.

---

### Task 1: Data Model and API Helpers

**Files:**
- Modify: `src/types/note.ts`
- Modify: `src/lib/api.ts`
- Modify: `functions/_shared/supabase.ts`
- Modify: `functions/_shared/supabase.test.ts`
- Modify: `supabase/schema.sql`

- [x] Add failing tests proving `notePayload` accepts `kind` and `diary_date`, defaults existing notes to thought-compatible payloads, and rejects invalid kind/date values.
- [x] Implement `NoteKind`, `kind`, and `diary_date` types.
- [x] Extend `notePayload` with strict `thought` / `diary` handling and ISO date validation.
- [x] Update the Supabase schema with `kind`, `diary_date`, check constraints, diary indexes, and the partial unique index for one diary per date.
- [x] Run `npm test -- functions/_shared/supabase.test.ts`.

### Task 2: Worker Diary Semantics

**Files:**
- Modify: `src/worker.ts`
- Add or modify: worker/API tests if current test setup supports them.

- [x] Add failing tests or focused helper tests for list query ordering by `kind=diary`, `kind=thought`, and `kind=all`.
- [x] Create diary records with today as default `diary_date` when missing.
- [x] Return `409` with `{ error: "diary_exists", noteId }` when creating or moving a diary to an occupied date.
- [x] Keep thoughts sorted by pin/update and diaries sorted by `diary_date desc`.
- [x] Run focused tests.

### Task 3: Frontend Routing and Lists

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/NoteListItem.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/NotesPage.tsx`
- Create: `src/pages/DiaryPage.tsx`

- [x] Add failing tests or page-level checks for listNotes calls using `kind=thought`, `kind=diary`, and mixed home content.
- [x] Add `/diary` route and `鏃ヨ` navigation item.
- [x] Filter `璁板綍` to thoughts only.
- [x] Add `鏃ヨ` page filtered to diaries only, sorted by diary date from the API.
- [x] Hide pin controls for diary list items.

### Task 4: Editor Behavior

**Files:**
- Modify: `src/components/NoteEditor.tsx`
- Modify: `src/components/NoteEditor.test.tsx`

- [x] Add failing tests for default thought mode, switching to diary, default diary title/date, no pin button for diary, and existing diary conflict navigation.
- [x] Add a segmented type control on new notes.
- [x] Show date input only for diaries.
- [x] Auto-fill diary title from date unless the user edits the title.
- [x] On `409 diary_exists`, navigate to the existing note id.
- [x] Keep manual save behavior.

### Task 5: Export and Verification

**Files:**
- Modify: `src/lib/export.ts`
- Modify: `src/lib/export.test.ts`
- Modify: `src/worker.ts` markdown export section if needed.
- Modify: `README.md` if setup instructions need the new SQL fields.

- [x] Add failing export tests for `kind` and `diary_date`.
- [x] Update JSON/Markdown export formatting.
- [x] Run `npm run lint`, `npm test`, `npm run build`.
- [x] Use Chrome to verify `/write`, `/notes`, `/diary`, and save behavior.
- [x] Commit implementation and report the Supabase SQL migration needed for production if it cannot be run automatically.

## Self Review

- The plan maps every design requirement to data, API, UI, and tests.
- No placeholder tasks are left.
- Field names are consistent: `kind`, `diary_date`, `thought`, `diary`.
