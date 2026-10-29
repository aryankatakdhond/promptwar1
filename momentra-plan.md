# MOMENTRA — The Celebration Command Center
## Implementation Plan

---

## Top-Level Overview

Build **MOMENTRA** — a complete, production-quality, full-stack web application for planning weddings, birthdays, anniversaries, and community events. The stack is **Next.js 14 App Router + TypeScript + Tailwind CSS + Recharts + Zod + Lucide icons**. The signature feature is the **Ripple Replanning Engine**, which propagates changes across all affected planning entities. A **Gemini AI Copilot** runs server-side; the app is fully functional without an API key via a deterministic local engine. All event data persists in **localStorage / IndexedDB**. The app ships with three fully-seeded demo events and a polished PDF-export capability.

The implementation is organized into **13 sequential sub-tasks**, each with a clear boundary. Every sub-task is self-contained and reviewable.

---

## Sub-Task 1 — Project Scaffold & Design System

**Intent:** Bootstrap the Next.js project with every dependency pinned, configure Tailwind with the MOMENTRA design tokens, and establish the shared component library (Button, Badge, Card, Input, Dialog, Toast, Skeleton, Select, Tabs).

**Expected Outcomes:**
- `next dev` starts cleanly on `localhost:3000`
- Design tokens (colors, typography, spacing) match the MOMENTRA brand
- Shared UI components are importable from `@/components/ui`
- `.env.example` and `.gitignore` in place

**Todo List:**
1. `npx create-next-app@14 momentra --ts --tailwind --eslint --app --src-dir --import-alias "@/*"` (run inside workspace root)
2. Install production deps: `recharts`, `lucide-react`, `zod`, `@google/generative-ai`, `jspdf`, `jspdf-autotable`, `date-fns`, `uuid`, `papaparse`
3. Install dev deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitejs/plugin-react`, `jsdom`, `@types/uuid`, `@types/papaparse`
4. Configure `tailwind.config.ts` with MOMENTRA color tokens: `ivory`, `midnight`, `terracotta`, `sage`, `gold`
5. Add global CSS variables and base styles in `globals.css`
6. Create `src/components/ui/` with: `Button`, `Badge`, `Card`, `Input`, `Textarea`, `Select`, `Dialog`, `Toast/Toaster`, `Skeleton`, `Tabs`, `Progress`, `Tooltip`, `DropdownMenu`, `Separator`, `Avatar`
7. Create `src/lib/utils.ts` with `cn()` helper
8. Add `.env.example` (`GEMINI_API_KEY=`, `NEXT_PUBLIC_APP_ENV=`)
9. Add `.gitignore` entries for `.env.local`, `.env`
10. Add `vitest.config.ts` and `src/test/setup.ts`

**Relevant Context:** Empty workspace — full scaffold required. Tailwind v3 compatible with Next.js 14.

**Status:** `[x] complete`

---

## Sub-Task 2 — Domain Models & Type System

**Intent:** Define all TypeScript interfaces and Zod schemas for every domain entity. These types are the contract between all features — budget, timeline, vendors, guests, AI, persistence, and exports.

**Expected Outcomes:**
- All domain types exported from `src/types/`
- Zod schemas for every entity, usable for runtime validation
- No `any` types in domain layer

**Todo List:**
1. `src/types/event.ts` — `EventType`, `EventProfile`, `EventTheme`, `CurrencyCode`, `EventStatus`
2. `src/types/budget.ts` — `BudgetCategory`, `BudgetAllocation`, `BudgetPlan`, `BudgetScenario`, `AllocationPriority`, `SpendRecord`
3. `src/types/timeline.ts` — `PlanningTask`, `TaskStatus`, `TaskCategory`, `TaskPriority`, `TaskDependency`, `TimelinePhase`
4. `src/types/vendor.ts` — `VendorCategory`, `VendorEntry`, `VendorStatus`, `VendorQuote`, `VendorPaymentMilestone`
5. `src/types/guest.ts` — `Guest`, `GuestStatus`, `DietaryRequirement`, `AccessibilityNeed`, `HouseholdGroup`
6. `src/types/runofshow.ts` — `ShowBlock`, `ShowSchedule`, `BlockCategory`
7. `src/types/risk.ts` — `RiskItem`, `RiskSeverity`, `ReadinessScore`, `RiskCategory`
8. `src/types/ai.ts` — `CopilotRequest`, `CopilotResponse`, `ChangeSet`, `ChangeOperation`, `AffectedEntity`
9. `src/types/ideas.ts` — `CreativeConcept`, `IdeaStatus`, `DecorPalette`
10. `src/types/persistence.ts` — `AppState`, `StoredEvent`, `StorageVersion`, `MigrationResult`
11. `src/schemas/` — Zod schemas mirroring all types above, with `.parse()` used at persistence boundaries and AI response parsing
12. `src/types/index.ts` — barrel export

**Relevant Context:** Budget arithmetic must use integer rupees (no floating point). Dates must be stored as ISO strings and converted to `Date` objects at use sites.

**Status:** `[x] complete`

---

## Sub-Task 3 — Core Calculation Engines

**Intent:** Implement three deterministic, thoroughly-tested engines: (A) Budget Engine with exact-sum proportional allocation + largest-remainder, (B) Timeline Engine with real calendar date math and dependency checking, (C) Risk/Readiness Engine with a rule-based scoring system. No AI involvement — these are pure functions.

**Expected Outcomes:**
- `src/lib/budget-engine.ts` — all budget math passes automated tests
- `src/lib/timeline-engine.ts` — deadline calculations verified against real dates
- `src/lib/risk-engine.ts` — readiness score responds correctly to plan state changes
- `src/lib/currency.ts` — formatting utilities for INR and other currencies
- All tests pass: `npx vitest run`

**Todo List:**
1. `src/lib/currency.ts`: `formatCurrency(amount, code)`, `parseCurrency()`, currency code list
2. `src/lib/budget-engine.ts`:
   - `allocateBudget(total, categories, lockedItems, contingencyPct)` → uses proportional allocation + largest-remainder to ensure `sum === total`
   - `rebalanceBudget(plan, change)` → respects locked flags, rebalances flexible categories
   - `applyScenario(plan, scenario)` → returns new plan without mutating original
   - `validateBudgetPlan(plan)` → checks sum, no negatives, contingency present
   - `getBudgetHealth(plan)` → returns health metrics
3. `src/lib/timeline-engine.ts`:
   - `generateTimeline(event)` → returns tasks with real calendar due dates using `date-fns`
   - `recalculateDueDates(tasks, newEventDate)` → shifts all non-pinned tasks
   - `detectDependencyConflicts(tasks)` → returns conflicting pairs
   - `getOverdueTasks(tasks)` → based on `Date.now()`
   - `getDueSoonTasks(tasks, windowDays)` → 
   - `getNextAction(tasks)` → returns single highest-priority actionable task
   - `compressSchedule(tasks, eventDate)` → flags impossible lead times
4. `src/lib/risk-engine.ts`:
   - `calculateReadinessScore(event, tasks, vendors, guests, budget, runOfShow)` → deterministic 0–100
   - `detectRisks(event, ...)` → returns `RiskItem[]` with severity and recommended actions
   - Checks: budget overrun, unbooked critical vendors, overdue tasks, outdoor without backup, capacity exceeded, dietary/accessibility unresolved, incomplete run of show
5. `src/lib/ripple-engine.ts`:
   - `applyRippleChange(event, change, lockedItems)` → orchestrates all engines after a change
   - `previewRippleChange(event, change)` → returns preview without mutating state
   - `identifyAffectedEntities(change)` → returns entity list for the impact preview UI
6. Write `src/test/budget-engine.test.ts` — all 9 required test scenarios
7. Write `src/test/timeline-engine.test.ts` — deadline and dependency tests
8. Write `src/test/risk-engine.test.ts` — readiness score tests
9. Write `src/test/ripple-engine.test.ts` — ripple propagation and lock-preservation tests

**Relevant Context:** Use `date-fns` `addDays`, `subDays`, `differenceInDays`, `isPast`, `isBefore`. Budget integers only — multiply/divide by 100 only at display layer if needed, or keep everything in whole rupees.

**Status:** `[x] complete`

---

## Sub-Task 4 — Demo Data Seeder

**Intent:** Create three fully-populated, date-relative demo events that exercise all application features without requiring an API key or any user input. All fictional vendor quotes are clearly labeled "Illustrative Demo" and no prices are presented as verified market prices.

**Expected Outcomes:**
- `src/data/demo-events.ts` exports `DEMO_EVENTS: StoredEvent[]`
- Each demo contains complete profile, budget, tasks, vendors, guests, run-of-show, risks, and ideas
- All dates are computed relative to `Date.now()` so no deadlines are hardcoded

**Todo List:**
1. **Wedding demo**: "Priya & Rohan's Wedding" — 120 guests, INR 1,500,000 budget, 9 months away, multi-category budget, full vendor list, 45 tasks, 20 guests, run of show, 3 creative concepts
2. **Birthday demo**: "Aarav's 30th Surprise Party" — 40 guests, INR 150,000 budget, 6 weeks away, activities, catering, smaller vendor set
3. **Community event demo**: "Greenfield Neighborhood Festival" — 300 guests, INR 800,000 budget, 10 weeks away, staffing, safety, detailed run sheet
4. All vendor entries marked `isIllustrative: true` with disclaimer
5. All budget allocations validated to sum exactly to total
6. Seeder uses `generateTimeline()` and `allocateBudget()` from the engines to produce real data

**Relevant Context:** Demo events are pre-loaded into localStorage on first app open. They must remain fully editable.

**Status:** `[x] complete`

---

## Sub-Task 5 — Persistence Layer

**Intent:** Implement a versioned, validated persistence layer using localStorage with graceful corrupted-data recovery. Every write is validated against Zod schemas before committing.

**Expected Outcomes:**
- `src/lib/persistence.ts` exports `loadAppState()`, `saveAppState()`, `resetAppState()`, `migrateIfNeeded()`
- Corrupt or missing data falls back to demo events with a visible warning
- Storage version increments on schema change with a migration function

**Todo List:**
1. `src/lib/persistence.ts`:
   - `STORAGE_KEY` and `STORAGE_VERSION` constants
   - `loadAppState()`: reads, parses, validates with Zod, returns `AppState | null`
   - `saveAppState(state)`: validates before writing, catches QuotaExceededError
   - `resetAppState()`: confirms then clears, reloads demo data
   - `migrateIfNeeded(raw)`: version-check and migration stub
   - `recoverFromCorruption()`: logs warning, seeds demos, returns fresh state
2. `src/context/AppContext.tsx`: React context + `useReducer` holding `AppState`, `dispatch`, `activeEventId`, helpers
3. `AppContext` auto-saves to localStorage on every state change (debounced 500ms)
4. `useEvent()` hook returning the active event and a typed `dispatch`
5. Write `src/test/persistence.test.ts`

**Relevant Context:** Use `JSON.parse`/`JSON.stringify` for localStorage. Never store GEMINI_API_KEY or raw guest PII in the log.

**Status:** `[x] complete`

---

## Sub-Task 6 — Welcome Screen & Event Setup Wizard

**Intent:** Build the polished welcome screen and multi-step guided event creation wizard (11 steps) with full validation, progress indicators, back/skip, and smooth transitions.

**Expected Outcomes:**
- `src/app/page.tsx` renders the welcome screen with hero, feature highlights, and CTA buttons
- "Start New Celebration" opens the wizard
- "Open Demo Event" immediately opens the wedding demo in the dashboard
- The wizard collects: event type, name, date/time, city, guest count, currency, budget, theme, indoor/outdoor, dietary needs, accessibility, priorities, and optional traditions
- Completing the wizard generates a full plan via `generateTimeline()` + `allocateBudget()` and navigates to the dashboard

**Todo List:**
1. `src/app/page.tsx` — Hero section: brand, tagline, feature highlights, CTAs, sample event cards
2. `src/components/wizard/EventWizard.tsx` — step manager with progress bar
3. Step components (one file each in `src/components/wizard/steps/`):
   - `EventTypeStep` — wedding / birthday / anniversary / community cards
   - `EventDetailsStep` — name, date, time, city
   - `GuestCountStep` — slider + input, indoor/outdoor toggle
   - `BudgetStep` — total budget input, currency selector (INR default)
   - `ThemeStep` — style keywords, color preference picker
   - `DietaryStep` — checkboxes: vegetarian, vegan, halal, kosher, nut-free, gluten-free, other
   - `AccessibilityStep` — wheelchair, hearing, visual, mixed-age
   - `PrioritiesStep` — drag-rank 5 categories
   - `TraditionsStep` — free-text, optional, clearly labeled as "optional cultural notes"
   - `ReviewStep` — summary of all choices with edit-back links
   - `GeneratingStep` — skeleton + progress animation while plan generates
4. Wizard state managed in `useReducer` with Zod validation on each step
5. "Skip" available on optional steps; "Back" always available
6. On completion: call `generateTimeline()`, `allocateBudget()`, `detectRisks()`, save to `AppState`, navigate to `/dashboard/[id]`

**Relevant Context:** Do not infer religion or traditions from city/location. `TraditionsStep` must have explicit opt-in framing.

**Status:** `[x] complete`

---

## Sub-Task 7 — Main Dashboard Shell & Navigation

**Intent:** Build the dashboard layout with the top navigation bar, sidebar/tab navigation (Overview, Budget, Timeline, Vendors, Ideas, Guests, Run of Show, AI Copilot), event switcher, and the Overview tab content.

**Expected Outcomes:**
- `src/app/dashboard/[id]/page.tsx` and `layout.tsx` render correctly
- All 8 tabs exist and navigate without errors
- Overview tab shows: countdown, budget ring, task progress, vendor progress, RSVP totals, readiness score, next-action panel
- Event switcher in the header lists all saved events and lets the user create a new one

**Todo List:**
1. `src/app/dashboard/layout.tsx` — sidebar + header shell, mobile-responsive drawer
2. `src/app/dashboard/[id]/page.tsx` — reads `params.id`, loads event, renders active tab
3. `src/components/dashboard/Sidebar.tsx` — nav items with Lucide icons, active highlight, mobile collapse
4. `src/components/dashboard/Header.tsx` — MOMENTRA logo, event switcher dropdown, notification bell (risk count), user avatar placeholder
5. `src/components/dashboard/overview/OverviewTab.tsx`:
   - `CountdownCard` — days/hours until event, date display
   - `BudgetRingChart` — Recharts PieChart: planned vs. remaining vs. contingency
   - `TaskProgressCard` — completed/total tasks, progress bar
   - `VendorProgressCard` — booked/total vendors, by-status breakdown
   - `RSVPCard` — accepted/declined/pending counts
   - `ReadinessScoreCard` — score gauge, top 3 risks with severity badges
   - `NextActionPanel` — highlighted next recommended task with due date
6. All cards show skeleton loading states and meaningful empty states

**Relevant Context:** `useEvent()` hook from Sub-Task 5 provides active event data. Recharts `PieChart`, `BarChart`, `LineChart` all imported from `recharts`.

**Status:** `[x] complete`

---

## Sub-Task 8 — Budget Tab & Scenario Engine UI

**Intent:** Build the full Budget tab: category table with editing, actual vs. planned bars, scenario comparison panel, and the add/edit/lock/delete category interactions. Wire to the budget engine for exact-sum arithmetic.

**Expected Outcomes:**
- Budget tab shows all allocations summing exactly to total
- Category rows show planned, actual, remaining, %, confidence, saving suggestion
- Users can edit amounts, lock categories, change priority
- Scenario panel shows "Current", "Save 15%", "Premium", "+30 Guests" with per-category delta display
- Real-time validation warns when a category goes negative or total mismatches

**Todo List:**
1. `src/components/dashboard/budget/BudgetTab.tsx` — layout: summary bar + category table + scenario panel
2. `BudgetSummaryBar` — total, spent, remaining, contingency in a horizontal banner with progress fill
3. `BudgetCategoryTable` — sortable table; each row: icon, name, priority badge, planned, actual, remaining, %, lock toggle, edit button
4. `BudgetCategoryRow` — inline edit mode with input validation; save calls `rebalanceBudget()`
5. `AddCategoryDialog` — name, estimated amount, priority; validates sum before commit
6. `ScenarioPanel` — tabs for 4 scenarios; each shows old→new per category with delta badges; "Apply" button calls `applyScenario()` + ripple
7. `BudgetHealthAlert` — dismissible banner when actual > planned in any category
8. `BudgetBreakdownChart` — Recharts `BarChart` with planned vs. actual bars per category
9. All arithmetic routed through `budget-engine.ts`; UI never performs raw sums
10. Toast on successful rebalance; dialog confirmation for scenario application

**Relevant Context:** `applyScenario()` returns a new plan; dispatch `UPDATE_BUDGET` action; do not mutate state directly.

**Status:** `[x] complete`

---

## Sub-Task 9 — Timeline Tab

**Intent:** Build the Timeline tab with list view, calendar/Gantt-style timeline view, task detail drawer, status filtering, dependency conflict badges, overdue highlights, and the "Do This Next" recommendation.

**Expected Outcomes:**
- Timeline tab shows all tasks with correct due dates
- Overdue and due-soon tasks visually highlighted
- Dependency conflicts shown with a warning icon and explanation
- Status can be changed inline (Not Started → In Progress → Done)
- Task creation/edit dialog works with validation
- "Do This Next" panel persists at the top of the list view

**Todo List:**
1. `src/components/dashboard/timeline/TimelineTab.tsx` — toolbar: filters (status, category, priority), view toggle (list/calendar), search
2. `TaskListView` — grouped by phase/category; each row: status icon, title, due date, priority badge, dependency indicator, assignee chip, action menu
3. `TaskDetailDrawer` — slide-in panel: full task details, description, dependencies, edit form, status dropdown, completion toggle
4. `CalendarView` — month grid using `date-fns`, tasks rendered as chips on their due-date cell; overflow indicator
5. `DependencyConflictBanner` — shown when `detectDependencyConflicts()` returns items
6. `DoThisNextCard` — pinned at list top; uses `getNextAction()`
7. `AddEditTaskDialog` — fields: title, description, category, priority, due date, dependencies (multi-select from existing tasks), assigned to
8. `CompressScheduleWarning` — shown when `compressSchedule()` flags risky lead times
9. Status change dispatches `UPDATE_TASK` action; recalculates risk score after change
10. Task filters persist in URL query params

**Relevant Context:** `date-fns` `format`, `parseISO`, `startOfMonth`, `endOfMonth`, `eachDayOfInterval` used in calendar view.

**Status:** `[x] complete`

---

## Sub-Task 10 — Vendors, Ideas, Guests, Run of Show Tabs

**Intent:** Build the four remaining dashboard tabs. These are feature-complete but less algorithmically complex than Budget and Timeline.

**Expected Outcomes:**
- Vendors tab: filterable kanban/table, vendor detail drawer, add/edit/delete, status pipeline, quote entry
- Ideas tab: concept cards with save/reject/regenerate, accessible color palette display
- Guests tab: add/edit/delete guests, RSVP tracking, dietary/accessibility tags, CSV export, capacity warning
- Run of Show tab: editable timeline blocks, overlap detection, print-friendly view

**Todo List:**

**Vendors Tab:**
1. `VendorsTab.tsx` — filter bar (category, status), view toggle (board/table)
2. `VendorBoardView` — 6-column status kanban with drag-or-button status change
3. `VendorTableView` — sortable table: category, name, status, estimated, quoted, deadline, actions
4. `VendorDetailDrawer` — full form: all vendor fields, questions-to-ask list, red flags checklist, payment milestones, contract reminder toggle
5. `AddEditVendorDialog` — validation, illustrative-data disclaimer for demo entries
6. Vendor status change triggers ripple check (e.g., critical vendor still unbooked near deadline)

**Ideas Tab:**
7. `IdeasTab.tsx` — concept cards grid, regenerate-section controls
8. `ConceptCard` — theme name, creative direction, color palette swatches, menu direction, activities, budget impact, accessibility note, save/reject buttons
9. Ideas loaded from demo data or generated by local engine; AI can regenerate individual sections
10. Saved ideas panel at bottom

**Guests Tab:**
11. `GuestsTab.tsx` — search, filters (status, dietary, accessibility), totals banner
12. `GuestTable` — columns: name, group, RSVP status, dietary, accessibility, plus-one, invitation status, actions
13. `AddEditGuestDialog` — all guest fields with validation
14. `GuestTotalsBar` — invited / confirmed / declined / pending with color coding
15. Capacity warning banner when confirmed > venue capacity
16. CSV export using `papaparse`

**Run of Show Tab:**
17. `RunOfShowTab.tsx` — timeline header, blocks list, overlap warning banner, print button
18. `ShowBlockRow` — start time, end time, duration, activity, responsible person, location/zone, backup notes, edit/delete
19. `AddEditBlockDialog` — fields with time validation (no overlaps)
20. `OverlapWarning` — lists conflicting blocks with times
21. Print-friendly CSS class `print:` applied to run sheet layout

**Relevant Context:** Guest count changes dispatch `UPDATE_GUESTS` which triggers ripple check for venue capacity, catering budget, and risk score.

**Status:** `[x] complete`

---

## Sub-Task 11 — AI Copilot & Ripple Engine Integration

**Intent:** Build the AI Copilot tab, the server-side Gemini API route, the Ripple Engine UI (change-impact preview, confirm/discard, undo), and wire everything together. The app must work gracefully without an API key using the local demo engine.

**Expected Outcomes:**
- AI Copilot chat interface with message history, typing indicator, and structured response display
- Gemini API route at `POST /api/copilot` uses server-side `GEMINI_API_KEY` only
- Local engine fallback clearly labeled "Local Planning Engine — No API key configured"
- Ripple change-impact preview modal shows affected entities before applying
- Undo stack (last 5 changes) accessible from a toast or header icon
- Invalid AI outputs are rejected; user sees a friendly error

**Todo List:**
1. `src/app/api/copilot/route.ts`:
   - Reads `GEMINI_API_KEY` from `process.env` (never from client)
   - Accepts `POST { eventState, userMessage }`
   - Validates request with Zod
   - Calls `@google/generative-ai` with structured prompt + response schema
   - Parses and validates AI response with Zod `CopilotResponseSchema`
   - Returns `{ changeset, explanation, requiresConfirmation }` or `{ error }`
   - Handles rate limits, malformed responses, missing key (returns `{ fallback: true }`)
2. `src/lib/local-engine.ts` — deterministic fallback: parses natural language keywords (guest count, budget cut, date change, dietary, outdoor/indoor) and produces a `ChangeSet` using the calculation engines
3. `src/components/dashboard/copilot/CopilotTab.tsx`:
   - Chat message list with `UserMessage` and `AssistantMessage` components
   - Input bar with send button and suggested prompts (pre-written example requests)
   - AI status indicator: "Live Gemini Pro" or "Local Demo Engine"
   - On response: shows `ChangeImpactPreview` before applying
4. `ChangeImpactPreview` modal — lists affected entities, old→new values, warns about high-impact changes, Apply / Discard buttons
5. `UndoToast` — appears after every applied change with "Undo" action (last 5 states stored in `AppContext`)
6. `RippleIndicator` — animated icon shown in sidebar tabs that have pending ripple changes
7. Wire the copilot to `applyRippleChange()` after user confirms; dispatch `APPLY_CHANGESET` to `AppContext`
8. Suggested prompts visible in the UI: "Reduce budget by 15%, keep photography", "Add 30 guests", "Move celebration 2 weeks earlier", "Make it rain-safe", "Go more sustainable"

**Relevant Context:** `GEMINI_API_KEY` must never appear in browser network payloads. The API route strips the key from all logs. The local engine must produce real, non-trivial output.

**Status:** `[x] complete`

---

## Sub-Task 12 — Risk Radar Tab & PDF/CSV Export

**Intent:** Build the Risk Radar tab with rule-based readiness score visualization, per-risk cards with recommended actions, and the full PDF/CSV export system.

**Expected Outcomes:**
- Risk Radar tab shows score gauge, risk cards grouped by severity, and explanations of how the score is calculated
- PDF export downloads a real, multi-page, formatted document with all event data
- CSV exports work for guests and tasks
- Both exports contain actual event data, not placeholder text

**Todo List:**
1. `src/components/dashboard/risk/RiskRadarTab.tsx`:
   - `ReadinessGauge` — Recharts `RadialBarChart` showing 0–100 score with color zones
   - `ScoreBreakdownTable` — what contributes to the score, factor by factor
   - `RiskCardList` — sorted by severity (Critical → High → Medium → Low)
   - `RiskCard` — severity badge, category icon, explanation, affected entities list, recommended action button that navigates to the relevant tab/section
   - Empty state: "No risks detected — your event is looking great"
2. `src/lib/export/pdf-export.ts`:
   - Uses `jspdf` + `jspdf-autotable`
   - Pages: Cover (event name, date, tagline), Executive Summary, Budget Table, Timeline Table, Vendor List, Guest Summary, Creative Concepts, Run of Show, Risk Report
   - Currency formatting, page numbers, MOMENTRA branding header/footer
   - `exportEventPDF(event, budget, tasks, vendors, guests, runOfShow, risks)` → triggers download
3. `src/lib/export/csv-export.ts`:
   - `exportGuestsCSV(guests)` — all guest fields
   - `exportTasksCSV(tasks)` — all task fields
   - Uses `papaparse` `unparse()`
4. Export buttons in header and relevant tabs; toast on completion; error handling for large data sets

**Relevant Context:** `jspdf-autotable` handles table pagination automatically. Currency must use `formatCurrency()` from Sub-Task 3, not raw numbers.

**Status:** `[x] complete`

---

## Sub-Task 13 — Final Integration, Tests, Build & README

**Intent:** Run all tests, fix errors, run the production build, verify the complete user journey end-to-end, and write the README with full setup and deployment instructions.

**Expected Outcomes:**
- `npx vitest run` — all tests pass
- `npx next build` — no TypeScript or lint errors
- End-to-end user journey verified: welcome → demo event → ripple change → budget check → export PDF
- `README.md` complete with setup, env vars, demo instructions, limitations, deployment notes

**Todo List:**
1. Fix any TypeScript errors from `npx tsc --noEmit`
2. Fix any ESLint errors from `npx next lint`
3. Run `npx vitest run` and fix failing tests
4. Manual smoke test: load app, open wedding demo, change guest count from 120 to 150, verify ripple updates tasks + budget + risk score
5. Manual smoke test: run "Reduce budget by 15%, keep photography" through local engine, verify locked category unchanged
6. Manual smoke test: download PDF, verify it contains real event data
7. Verify no API key is needed for full demo functionality
8. Verify responsive layout at 375px, 768px, 1280px
9. Write `README.md`:
   - Prerequisites (Node 18+, npm)
   - Setup: `npm install`, `cp .env.example .env.local`, `npm run dev`
   - Environment variables: `GEMINI_API_KEY` (optional), `NEXT_PUBLIC_APP_ENV`
   - Demo walkthrough steps
   - Architecture overview
   - Known limitations
   - Deployment (Vercel one-click)
10. Final `npx next build` confirming clean build

**Relevant Context:** This is the integration sub-task — treat any blocking error as a blocker and fix it before marking done.

**Status:** `[x] complete`

---

## Architecture Diagram

```
src/
├── app/
│   ├── page.tsx                    # Welcome screen
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard shell
│   │   └── [id]/
│   │       └── page.tsx            # Tab router
│   └── api/
│       └── copilot/
│           └── route.ts            # Gemini server route
├── components/
│   ├── ui/                         # Design system components
│   ├── wizard/                     # Event setup wizard
│   └── dashboard/
│       ├── overview/
│       ├── budget/
│       ├── timeline/
│       ├── vendors/
│       ├── ideas/
│       ├── guests/
│       ├── runofshow/
│       ├── copilot/
│       └── risk/
├── lib/
│   ├── budget-engine.ts            # Exact-sum allocation
│   ├── timeline-engine.ts          # Calendar date math
│   ├── risk-engine.ts              # Rule-based readiness
│   ├── ripple-engine.ts            # Change propagation
│   ├── local-engine.ts             # Offline AI fallback
│   ├── currency.ts                 # Formatting
│   ├── persistence.ts              # localStorage
│   └── export/
│       ├── pdf-export.ts
│       └── csv-export.ts
├── types/                          # TypeScript interfaces
├── schemas/                        # Zod schemas
├── context/
│   └── AppContext.tsx              # Global state
├── data/
│   └── demo-events.ts              # Seeded demo data
└── test/                           # Vitest test files
```

---

## Data Integrity Guarantees

| Rule | Enforcement |
|------|------------|
| Budget sum === total | `validateBudgetPlan()` called before every save |
| No negative allocations | Guard in `rebalanceBudget()` |
| Locked items unchanged during rebalance | `lockedItems` set passed to every rebalance call |
| AI outputs validated before apply | Zod parse on every `CopilotResponse` |
| Ripple preview before apply | `previewRippleChange()` shown in modal |
| Undo available | Last 5 states in `AppContext` undo stack |
| No guest PII in logs | Persistence layer strips names from error logs |

---

## Key Design Decisions

1. **Integer arithmetic throughout** — all budget values stored and computed as whole rupees (or minor units for other currencies). `formatCurrency()` handles display only.
2. **Local engine, not fake AI** — when `GEMINI_API_KEY` is missing, the local engine uses keyword parsing + the real calculation engines to produce non-trivial, valid output. It is labeled honestly.
3. **Ripple before apply** — no destructive change is applied without a preview step. Users see exactly what will change before confirming.
4. **Demo data uses real engines** — `demo-events.ts` calls `generateTimeline()` and `allocateBudget()` with relative dates, so demo data is always fresh and exercises the real logic.
5. **No religion inference** — cultural traditions are an explicitly optional, free-text field. No field is pre-populated based on city, name, or any other inferred attribute.
6. **Vendor data disclaimer** — every demo vendor entry has `isIllustrative: true` and the UI renders a "Demo entry — not a verified vendor" badge.
