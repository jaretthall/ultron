## Ultron Main Branch – School Mode and Data Isolation Implementation Plan

### Objectives
- Consolidate data backup/export/import into a single place: `Settings > Advanced > Data Backup & Restore`.
- Make App Mode fully functional: Student mode uses Classes/Assignments terminology, hides counseling, and adjusts AI guidance.
- Ensure per-user data isolation: each signed-in user only sees their own data (short-term app-level filtering, long-term RLS enforcement).
- Bump application version per policy after changes.

---

### 1) Consolidate Backup/Export UI to Advanced tab only

Current state
- Duplicate controls exist:
  - `Settings > Sync > Backup & Data Management` (Export/Import buttons)
  - `Settings > Security > Data Management > Download My Data`
  - Desired single source: `Settings > Advanced > Data Backup & Restore` (already wired with export/import handlers)

Edits
- File: `src/components/settings/SettingsPage.tsx`
  - Remove the entire "Backup & Data Management" block under the `Sync` tab UI.
  - Remove "Data Management > Download My Data" block under the `Security` tab UI.
  - Keep `Advanced > Data Backup & Restore` section with:
    - `handleExportData` (already implemented and downloads a JSON backup with projects, tasks, schedules, tags, categories, notes, and preferences)
    - `handleImportData` (already implemented; re-IDs entities and re-links relationships)

Acceptance criteria
- Export/Import buttons are visible only under `Settings > Advanced`.
- Export downloads a JSON backup; Import restores entities mapped to the current user.
- No data-export/import buttons in `Sync` or `Security` tabs.

Risk/notes
- Ensure `fileInputRef` remains scoped to Advanced tab controls.

---

### 2) App Mode (Business vs Student) – make it functional across UI

Problems identified
- `useAppMode` stores mode in `localStorage` and Settings toggles the value, but the rest of the UI does not consume labels, so switching modes appears ineffective.
- `labelsStudent` exists in `src/constants/labels.ts`, but only the Settings page imports `useAppMode`/`useLabels`.

Planned changes
- Introduce a consistent labels consumption pattern using `useLabels()` in UI components that render labels/titles for projects/tasks.
- Where components currently hardcode strings (e.g., "Projects", "Tasks", "Project Dashboard", etc.), replace with `const labels = useLabels()` and use `labels.projects`, `labels.tasks`, etc.
- Hide counseling features in Student mode.

Scope of UI edits (illustrative, not exhaustive)
- Replace hardcoded strings in:
  - `src/components/Dashboard.tsx` (cards/titles)
  - `src/components/projects/*` (modals, headers)
  - `src/components/tasks/*` (titles, management pages)
  - `src/components/project_dashboard/*` (dashboard labels)
  - `src/components/home/*` (any headings mentioning Projects/Tasks)
  - Navigation labels/buttons where rendered
- Conditional visibility for counseling-related components when `appMode === 'student'`:
  - Example files: `src/components/calendar/CounselingSessionModal.tsx`, `src/components/home/ClinicalNotesAlert.tsx` (either hide or feature-flag behind mode checks)

Persistence of App Mode (optional but recommended)
- Persist to DB for cross-device consistency:
  - DB: add `app_mode` column to `user_preferences` (text enum: 'business'|'student')
  - On toggle: update both localStorage (immediate UI) and `user_preferences` via `userPreferencesService.update()`
  - On app load: if `user_preferences.app_mode` exists, seed localStorage value

Code edits
- File: `src/hooks/useLabels.ts`
  - No change required for API. Ensure it stays the single source of truth for reading the active mode and resolving labels.
- File: `src/components/settings/SettingsPage.tsx`
  - Keep the existing App Mode radio group and "Apply Mode Change" button; add DB update if `app_mode` is introduced in `user_preferences`.
- Multiple UI files
  - Replace hardcoded strings with `useLabels()` lookups.
  - Add conditional rendering for counseling features based on `appMode`.

Acceptance criteria
- Toggling App Mode and clicking "Apply Mode Change" switches visible UI strings between Business (Projects/Tasks) and Student (Classes/Assignments) across dashboards/pages.
- Counseling UI does not appear in Student mode.
- App Mode persists between sessions and (if enabled) syncs across devices via `user_preferences.app_mode`.

---

### 3) AI behavior alignment for Student mode

Goals
- In Student mode, tailor AI prompts/directions to:
  - Refer to “Classes” instead of “Projects” and “Assignments” instead of “Tasks”.
  - Bias planning/suggestions to academic contexts (due dates, class schedules, study sessions, workload by course).

Where to implement
- Client: `src/services/aiService.ts`
  - Ensure `userPreferences` (or an added `app_mode`) is forwarded to serverless APIs
- Serverless endpoints (prompts live here):
  - `api/ai-daily-plan.js`
  - `api/ai-unified.js`

Implementation steps
- Add `app_mode` to the payload of AI requests:
  - From `aiService` when calling `/api/ai-daily-plan` and `/api/ai-unified`.
  - If `app_mode` is not in DB, derive from `localStorage` via `useAppMode()` on the client, then include in body.
- In `api/ai-daily-plan.js` and `api/ai-unified.js`:
  - Incorporate `app_mode` into system prompt/templates.
  - If `app_mode === 'student'`:
    - Use the domain language: Classes/Assignments.
    - Prioritize due dates, syllabus milestones, exam periods.
    - Encourage study blocks and review sessions.
    - De-emphasize business jargon.
  - If `business` (default): keep current behavior.
- Optional: Add a small helper `getPromptContext(appMode)` co-located in each API file to keep prompts maintainable.

Acceptance criteria
- In Student mode, AI outputs consistently use Classes/Assignments and scheduling emphasizes academic needs.
- In Business mode, no change in AI behavior.

---

### 4) Per-user data isolation (RLS + application filters)

Immediate fixes (application-level filtering)
- Audit data reads to ensure they filter by `user_id`.
  - Critical: `services/databaseService.ts` → `projectsService.getAll()` currently returns all rows; add `.eq('user_id', user.id)` to match tasks/schedules patterns.
  - Confirm all getAll/getBy* methods apply `user_id` filters consistently.
- Ensure all create/update/delete operations set and constrain `user_id` (already present in most flows via `getCustomAuthUser()`).

Long-term: enforce RLS in Supabase
- Recommended policy (per table):
  - Enable RLS: `ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;`
  - Policies:
    - SELECT: `USING (user_id = auth.uid()::text)`
    - INSERT: `WITH CHECK (user_id = auth.uid()::text)`
    - UPDATE: `USING (user_id = auth.uid()::text)`
    - DELETE: `USING (user_id = auth.uid()::text)`
- Apply to: `users`, `user_preferences`, `projects`, `tasks`, `tags`, `tag_categories`, `notes`, `schedules`, `documents`, `plans`.
- If using serverless functions with the service key, they BYPASS RLS; add explicit checks server-side to match `user_id` to the authenticated user.

Auth alignment
- Best practice: Use Supabase Auth sessions so `auth.uid()` is populated; migrate away from permissive anon policies.
- If you must keep CustomAuth for now:
  - Maintain strict application-level `.eq('user_id', user.id)` filters on every query.
  - Avoid permissive anon RLS policies in production.
  - Consider proxying all DB writes through serverless functions where user_id is validated server-side.

Validation
- Manual test: user A and user B should not see each other’s entities.
- Add integration tests to verify `getAll()` only returns rows with the signed-in `user.id`.

---

### 5) Database migration: user_preferences.app_mode (optional but recommended)

SQL (example)
```sql
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS app_mode TEXT CHECK (app_mode IN ('business','student'));
```
- Update `userPreferencesService.update()` to accept `app_mode`.
- On Settings toggle save, send `{ app_mode: 'business' | 'student' }` to persist.

---

### 6) Version bump and footer/version displays

- File: `src/constants.ts`
  - Bump `APP_VERSION` from `3.3.0` to `3.3.2` per patch policy after these changes land.
- Verify any places showing version (e.g., `Settings > Advanced > System Information`) reflect the new version.

---

### 7) Testing plan

Unit/integration
- Add unit tests for `databaseService.projectsService.getAll()` to verify user filter.
- Add tests for any helper that resolves labels from `useLabels()`.

E2E (Cypress)
- Update navigation tests to confirm only one export/import location exists:
  - `Settings > Sync` should NOT show export/import
  - `Settings > Security` should NOT show download-my-data
  - `Settings > Advanced` should show Export/Import and perform a working export
- Add a test to toggle App Mode and assert UI labels change (Dashboard, Projects/Tasks pages -> Classes/Assignments).
- Add a test to ensure counseling components are hidden in Student mode.
- Add a test that two different users do not see each other’s data (seeded or mocked users).

---

### 8) Rollout steps
- Implement UI edits and filtering changes.
- Run SQL migration for `user_preferences.app_mode` (if adopting persistence).
- Deploy serverless API prompt updates for AI.
- Verify per-user filters in all services; add missing `.eq('user_id', user.id)` calls.
- Run test suite; fix regressions.
- Bump `APP_VERSION` to `3.3.2`.

---

### 9) Acceptance checklist
- Only one place to export/import data (Advanced tab) and it works.
- App Mode visibly affects labels throughout the app; Student mode hides counseling.
- AI guidance reflects Student/Business modes appropriately.
- All reads are filtered by `user_id`; RLS policy plan ready and/or enabled.
- Version updated to `3.3.2`.
