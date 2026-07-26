# Implementation Plan — SurveySwap

Derived from `PRD_SurveySwap_Gamified_App.md` and `UI_UX_Motion_Spec.md`. Execute phases **in order** — each depends on the ones before it. Don't start a phase until the previous one's acceptance criteria are met and committed.

**How to use this doc:**
1. Keep all three docs (`PRD...md`, `UI_UX_Motion_Spec.md`, `implementation-plan.md`) in `/docs` at your repo root.
2. Work through phases top to bottom. Check off tasks as Antigravity completes and you've verified them.
3. Use the suggested autonomy level per phase — logic-heavy/sensitive phases need review; boilerplate doesn't.
4. Commit after each phase closes (Antigravity's Git branching support is limited — don't rely on it to manage long-lived branches; commit to `main` frequently instead).
5. The "suggested prompt" per phase is a starting point, not a script — adjust as your codebase evolves.

---

## Phase 0 — Project scaffold

**Goal:** A running Next.js app with the full toolchain wired up, no features yet.
**Autonomy:** Full autonomy (low-risk boilerplate)
**PRD refs:** §13 (Technical Approach)

- [ ] Next.js 14+ App Router project, TypeScript
- [ ] Tailwind CSS configured
- [ ] Prisma installed, connected to a Postgres instance (Neon / Vercel Postgres)
- [ ] ESLint + Prettier baseline
- [ ] Repo structure includes `/docs` with the three planning docs committed

**Suggested prompt:** *"Set up a new Next.js 14 App Router project with TypeScript, Tailwind CSS, and Prisma connected to Postgres. Follow the technical approach in /docs/PRD_SurveySwap_Gamified_App.md section 13. Don't build any features yet — just the scaffold."*

**Acceptance check:** `npm run dev` boots cleanly, `npx prisma db push` succeeds against an empty schema.

---

## Phase 1 — Data model

**Goal:** All core tables exist and match the PRD's data model exactly.
**Autonomy:** Full autonomy
**PRD refs:** §7 (Data Model)

- [ ] `User` model (username, password_hash, recovery_code_hash, credit_balance, total_forms_filled)
- [ ] `Survey` model (owner_id, google_form_url, target_responses, current_responses, status enum)
- [ ] `FillEvent` model with unique constraint on (survey_id, filler_id)
- [ ] `CreditTransaction` ledger model
- [ ] Prisma migration generated and applied

**Suggested prompt:** *"Implement the Prisma schema exactly as specified in /docs/PRD_SurveySwap_Gamified_App.md section 7 — User, Survey, FillEvent, CreditTransaction. Generate and apply the migration."*

**Acceptance check:** Prisma Studio shows all four tables with correct fields, types, and the unique constraint on FillEvent.

---

## Phase 2 — Auth: signup, login, recovery

**Goal:** A user can create an account with just a username + password, receive and safely acknowledge a one-time recovery code, log in, and recover access via that code.
**Autonomy:** Reviewed / checkpoint mode (auth correctness matters)
**PRD refs:** FR-1 through FR-5 (§6.1)

- [ ] Signup: username uniqueness (case-insensitive), password hashing (argon2/bcrypt)
- [ ] Recovery code generated on signup, shown once, only the hash persisted
- [ ] Mandatory "I've saved my code" gate before signup completes (no skip path)
- [ ] 3 starter credits granted once, server-side enforced (not per-session)
- [ ] Login via NextAuth Credentials provider
- [ ] Recovery flow: username + recovery code → set new password

**Suggested prompt:** *"Implement auth per /docs/PRD_SurveySwap_Gamified_App.md FR-1 to FR-5: username/password signup with NextAuth Credentials provider, a one-time recovery code shown only once and hashed on the server, and a recovery flow to reset password using that code. No email or phone fields anywhere."*

**Acceptance check:** Create an account, confirm the recovery code is shown exactly once and never retrievable again from the UI, log out, and successfully recover using the code.

---

## Phase 3 — Credit engine (core business logic)

**Goal:** The atomic transaction that moves a credit from poster to filler, updates survey progress, and transitions survey state — with all race conditions and abuse paths closed.
**Autonomy:** Reviewed / checkpoint mode (this is the money logic — treat it like a payments feature)
**PRD refs:** FR-13, §8 (Edge Cases)

- [ ] Server action `confirmFill(surveyId, fillerId)` as a single DB transaction
- [ ] Reject: filler === owner
- [ ] Reject: duplicate (survey, filler) pair
- [ ] Reject: survey not `ACTIVE` (handles the race-condition edge case in §8)
- [ ] On success: increment `current_responses`, decrement owner credit, increment filler credit + `total_forms_filled`, write `FillEvent` + `CreditTransaction` rows
- [ ] State transition: `COMPLETED` if target reached, `PAUSED` if owner balance hits 0
- [ ] `PAUSED` → `ACTIVE` auto-transition whenever owner's balance rises above 0 (check this on every credit-earning event, not just cron)

**Suggested prompt:** *"Implement the confirmFill server action exactly per FR-13 in /docs/PRD_SurveySwap_Gamified_App.md — as a single atomic Prisma transaction with row-level locking to prevent race conditions when the last credit is contested. Include the self-fill and duplicate-fill guards, and the ACTIVE/PAUSED/COMPLETED transitions."*

**Acceptance check:** Write a test that fires two concurrent `confirmFill` calls against a survey where the owner has exactly 1 credit left — exactly one should succeed, the other should get a clean rejection, not a corrupted balance.

---

## Phase 4 — Post & manage a survey

**Goal:** A user can post one survey at a time and cancel it.
**Autonomy:** Checkpoint
**PRD refs:** FR-6 to FR-9

- [ ] Post form: Google Form URL (format-validated), target response count
- [ ] Enforce one active/paused survey per user (block second post attempt)
- [ ] Initial status: `ACTIVE` if balance > 0 else `PAUSED` immediately
- [ ] Cancel action (no refund logic needed — nothing is pre-reserved)

**Suggested prompt:** *"Build the post-survey flow per FR-6 to FR-9. Enforce that a user can only have one non-terminal (ACTIVE/PAUSED) survey at a time — block the form and show why if they try to post a second one."*

**Acceptance check:** Try posting a second survey while one is active — blocked with a clear message. Cancel it, then posting succeeds.

---

## Phase 5 — Fill-surveys feed

**Goal:** A correctly filtered feed of fillable surveys.
**Autonomy:** Full autonomy for the query logic, checkpoint for the UI shell
**PRD refs:** FR-10, FR-11

- [ ] Feed query: `status = ACTIVE`, excludes current user's own survey, excludes surveys already in their `FillEvent` history
- [ ] Feed removes a survey immediately on any state change (no stale listings)
- [ ] Basic (non-animated) card showing progress and a "Fill this form" button

**Suggested prompt:** *"Implement the fill-surveys feed query and a plain card UI per FR-10 and FR-11. Don't add animation yet — that's a later phase. Focus on correct filtering: only ACTIVE, never the user's own survey, never one they've already filled."*

**Acceptance check:** As a test user, confirm your own survey never appears in your own feed, and a filled survey disappears from your feed immediately.

---

## Phase 6 — The reward moment (confirm-fill UI + motion)

**Goal:** The core gamified interaction, fully animated per spec.
**Autonomy:** Checkpoint / reviewed (visual correctness needs your eyes, not just tests)
**Spec refs:** `UI_UX_Motion_Spec.md` §3 and §4

- [ ] Quest-card flip reveal (link hidden until flipped)
- [ ] Circular progress ring (not flat bar), animated on mount
- [ ] Urgency pulse for cards near their target
- [ ] Confirm button: press animation, coin-fly, confetti burst, credit counter roll-up, toast
- [ ] Streak banner after 3 confirms in a session
- [ ] Milestone-complete card state when a survey hits its target

**Suggested prompt:** *"Implement ConfirmFillButton.tsx and QuestCard.tsx per sections 3 and 4 of /docs/UI_UX_Motion_Spec.md — flip reveal, progress ring, coin-fly + confetti + counter roll-up on confirm, using framer-motion and canvas-confetti. Take a screenshot when done so I can review the feel of it."*

**Acceptance check:** Review the Antigravity screenshot/walkthrough Artifact yourself — does the reward moment feel satisfying, not just functionally correct? Comment directly on the Artifact for any timing/feel adjustments.

---

## Phase 7 — Dashboard

**Goal:** Owner-facing visibility into their survey's status and their credit balance.
**Autonomy:** Checkpoint
**PRD refs:** FR-15, FR-15a, FR-15b | Spec refs: §5

- [ ] Credit balance display with roll-up animation
- [ ] Status badge: Active (heartbeat pulse) / Inactive (sleep cue) / Completed / Cancelled
- [ ] Status updates without requiring manual refresh
- [ ] Fill history list (surveys this user has filled)

**Suggested prompt:** *"Build the dashboard per FR-15a/15b and section 5 of the motion spec — the owner-facing Active/Inactive/Completed status badge with the heartbeat and sleep-cue animations, plus credit balance and fill history."*

**Acceptance check:** Drain a test account's credits to 0 via Phase 3's logic and confirm the dashboard flips to "Inactive" without a manual page reload.

---

## Phase 8 — Leaderboard

**Goal:** Top-5 podium plus personal rank.
**Autonomy:** Checkpoint
**PRD refs:** FR-16, FR-17 | Spec refs: §6

- [ ] Query: top 5 by `total_forms_filled`, all-time
- [ ] Podium UI for ranks 1–3, simple rows for 4–5
- [ ] "You're #N" pinned row if outside top 5
- [ ] Rank-up animation when the current user's position improves

**Suggested prompt:** *"Implement the leaderboard per FR-16/17 and section 6 of the motion spec — podium layout for top 3, and a rank-up slide animation when the logged-in user's position improves."*

**Acceptance check:** Simulate enough fills to move a test user up a rank and confirm the animation fires correctly, not just the number.

---

## Phase 9 — Admin dashboard

**Goal:** A completely separate, credential-isolated surface where you can see every user, survey, fill event, and credit transaction happening in the app.
**Autonomy:** Reviewed / checkpoint mode (this is a privileged-access surface — treat it like the auth phase, not a normal feature)
**PRD refs:** FR-18 to FR-23 (§6.6)

- [ ] `/admin/login` route checking credentials against `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` env vars — no connection to the `User` table or regular signup/login
- [ ] Middleware protecting all `/admin/*` routes, redirecting to `/admin/login` without a valid admin session
- [ ] No link to `/admin` anywhere in the public UI
- [ ] Rate-limited admin login attempts, separate from regular user login limits
- [ ] Overview page: total users, surveys by status, total fills all-time, credits in circulation, signups over last 7/30 days
- [ ] Users table (searchable/sortable): username, credit balance, total forms filled, joined date
- [ ] Surveys table (filterable by status): owner, form URL, target/current, status, timestamps
- [ ] FillEvent audit log: full filler/survey/timestamp history
- [ ] CreditTransaction ledger view

**Important:** this UI should **not** reuse anything from `UI_UX_Motion_Spec.md` — no confetti, coin-fly, or podiums here. Keep it a plain, dense, table-and-filter ops dashboard.

**Suggested prompt:** *"Build the admin dashboard per FR-18 to FR-23 in /docs/PRD_SurveySwap_Gamified_App.md section 6.6. Admin credentials come from ADMIN_USERNAME/ADMIN_PASSWORD_HASH environment variables, completely separate from the User table and regular auth. Protect all /admin/* routes with middleware. This should be a plain data-dense dashboard — explicitly do not apply any of the gamified motion language from UI_UX_Motion_Spec.md here."*

**Acceptance check:** Confirm a regular user session (even a valid logged-in one) cannot reach any `/admin/*` route, and that `/admin` is not linked from anywhere in the public UI. Confirm every user, survey, and fill event created in earlier phases shows up correctly here — this is a good moment to double-check Phases 1–8 actually did what you think they did.

---

## Phase 10 — Onboarding polish

**Goal:** The higher-effort onboarding animations that aren't core to function but matter for first impression.
**Autonomy:** Checkpoint
**Spec refs:** §1

- [ ] Username availability check animation (debounced, pop-in check/x)
- [ ] Coin-drop animation on signup for the 3 starter credits
- [ ] Recovery-code vault reveal + drag/check-to-seal gating

**Suggested prompt:** *"Add the onboarding polish from section 1 of the motion spec — the debounced username check animation, the coin-drop for starter credits, and the vault-seal interaction gating the recovery code step. This layers on top of the Phase 2 auth logic, which should not change."*

**Acceptance check:** Confirm the vault-seal gate still can't be skipped after adding the animation layer.

---

## Phase 11 — Accessibility & responsiveness pass

**Goal:** Every animated component degrades gracefully and works on mobile.
**Autonomy:** Full autonomy for the sweep, checkpoint to review results
**Spec refs:** §0 (Global motion rules)

- [ ] `prefers-reduced-motion` fallback on every animation added in Phases 6 and 10
- [ ] Mobile responsive pass across all screens, including the admin dashboard's tables
- [ ] Keyboard navigation check on forms and buttons

**Suggested prompt:** *"Sweep the whole app and add prefers-reduced-motion fallbacks per section 0 of the motion spec, and verify/fix mobile responsiveness across all screens built so far."*

**Acceptance check:** Toggle reduced-motion in OS settings and confirm all state changes are still visible, just without the motion.

---

## Phase 12 — QA against edge cases

**Goal:** Explicit verification of every edge case in the PRD, not just happy paths.
**Autonomy:** Reviewed
**PRD refs:** §8 (Edge Cases table)

- [ ] Self-fill blocked
- [ ] Concurrent last-credit race handled correctly
- [ ] Paused survey auto-reactivates on new credit
- [ ] Lost password + lost recovery code = confirmed permanent lockout (by design)
- [ ] Cancelling a survey mid-way doesn't affect already-earned filler credits
- [ ] Empty feed state renders sensibly
- [ ] A regular user session cannot access any `/admin/*` route under any circumstance

**Suggested prompt:** *"Write and run tests covering every row of the edge-case table in section 8 of /docs/PRD_SurveySwap_Gamified_App.md. Report which pass and which need fixes."*

**Acceptance check:** All edge cases pass or have a documented, deliberate exception.

---

## Phase 13 — Deploy

**Goal:** Live on the public internet.
**Autonomy:** Checkpoint (production changes always get a review)

- [ ] Vercel project connected, environment variables set (DB connection string, auth secret, `ADMIN_USERNAME`/`ADMIN_PASSWORD_HASH`)
- [ ] Production Postgres instance (separate from local dev)
- [ ] Smoke test the full loop end-to-end in production: signup → post → fill → credit transfer → leaderboard
- [ ] Confirm `/admin/login` works in production and is not indexed/linked anywhere public

**Suggested prompt:** *"Prepare this app for deployment to Vercel — set up environment variables, confirm the production database connection, and do a final build check."*

**Acceptance check:** A fresh signup, on the live URL, can complete the entire loop without errors.

---

## Phase order at a glance

```
0 Scaffold → 1 Data model → 2 Auth → 3 Credit engine → 4 Post survey
   → 5 Fill feed → 6 Reward moment UI → 7 Dashboard → 8 Leaderboard
   → 9 Admin dashboard → 10 Onboarding polish → 11 Accessibility pass
   → 12 QA → 13 Deploy
```

Phases 0–5 are function-first (get the logic right, minimal styling). Phases 6, 9, and 10 are UI-heavy — note that Phase 9 (admin) deliberately uses a *different* visual language than Phase 6/10 (end-user gamification). Everything is sequenced after the underlying logic is solid, so you're never animating (or auditing) on top of broken state.
