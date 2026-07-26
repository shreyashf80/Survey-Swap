# Product Requirements Document
## SurveySwap — A Gamified Google Form Response Exchange

**Version:** 1.0 (Draft)
**Owner:** [Your Name]
**Status:** Draft for review
**Built with:** Next.js (full-stack), developed using Google Antigravity

---

## 1. Problem Statement

Students and independent researchers routinely need real human responses to Google Forms (surveys, thesis research, class projects, market validation) but have no easy way to reach strangers willing to fill them out. Posting in random Discord/WhatsApp groups is unreliable and one-directional (you ask, you rarely give back).

**SurveySwap** solves this with a closed-loop economy: you earn the right to get responses by giving responses to others. It's fair by construction — nobody can extract value from the system without contributing to it first (beyond a small free starter allowance).

---

## 2. Goals & Success Metrics

| Goal | Metric | MVP Target |
|---|---|---|
| Drive reciprocal engagement | Avg. forms filled per active user / week | ≥ 5 |
| Keep the credit economy balanced | % of posted surveys that reach their target | ≥ 40% within 14 days |
| Retention | D7 retention | ≥ 25% |
| Trust in the core loop | % of fill-confirmations disputed/reported | < 5% |
| Leaderboard drives competition | % of WAU who view leaderboard | ≥ 30% |

---

## 3. Target Users

- College/university students needing survey responses for research, theses, class assignments.
- Indie hackers / small business owners doing early market research.
- Anyone running a Google Form who needs quick, real responses from a motivated pool (because fillers are there specifically *to* fill forms).

---

## 4. Core Concept — The Loop

```
Sign up → Get 3 free credits
        ↓
Spend credits (passively) → Post your Google Form + target response count
        ↓
Others fill it → each fill: -1 credit from you, +1 credit to them, survey progress +1
        ↓
Your credit balance hits 0 → your link auto-disables (paused)
        ↓
To re-enable it, YOU must go fill other people's forms to earn credits back
        ↓
Earned credits also = climbing the leaderboard
```

This is intentionally a **zero-sum-per-transaction, positive-sum-overall** credit system: total credits in the system only increase via the 3-credit signup bonus, everything else is a transfer.

---

## 5. Definitions & States

**Survey states:**
| State | Meaning | Visible in "Fill Surveys" feed? |
|---|---|---|
| `ACTIVE` | Owner has ≥1 credit; accepting fills | Yes |
| `PAUSED` | Owner's credit balance hit 0 before target was reached | No (auto-hidden) |
| `COMPLETED` | `current_responses` reached `target_responses` | No |
| `CANCELLED` | Owner manually cancelled | No |

A `PAUSED` survey **automatically flips back to `ACTIVE`** the moment its owner's credit balance goes above 0 again (e.g., they go fill someone else's form). No manual re-activation needed — this keeps the "earn to unlock" loop tight and immediate.

**Product decision — one active survey per user at a time.** To avoid ambiguity about which survey a credit "belongs to" when a user has multiple posted, MVP allows only one non-terminal (`ACTIVE`/`PAUSED`) survey per user. They must let it complete or cancel it before posting another. *(Flag: relax this in Phase 2 if users want to run multiple campaigns.)*

---

## 6. Functional Requirements

### 6.1 Authentication & Account
- **FR-1:** User creates an account with a **unique username** and a **password**. No email or phone number collected or required, anywhere.
- **FR-2:** Username uniqueness check is case-insensitive; enforce basic constraints (3–20 chars, alphanumeric + underscore).
- **FR-3:** On successful signup, generate a **one-time recovery code** (e.g., 16-char alphanumeric, high entropy). Displayed exactly once, with a mandatory "I have saved this code" checkbox before the user can proceed. Store only a hash of it (never plaintext), same as the password.
- **FR-4:** Account recovery flow: username + recovery code → set new password. If the recovery code is lost **and** the password is forgotten, the account is permanently inaccessible — this must be communicated clearly and repeatedly in the UI (this is a deliberate, user-approved tradeoff for a no-PII auth system).
- **FR-5:** New accounts are granted **3 free credits** on creation, once, non-repeatable (enforced server-side, not per-session).

### 6.2 Posting a Survey
- **FR-6:** A logged-in user with no other non-terminal survey can post: a Google Form URL (validated as a plausible `docs.google.com/forms/...` link, format-check only — not a live fetch/verify) and a target response count (integer, e.g. 1–500).
- **FR-7:** On posting, survey is created with `status = ACTIVE` if the owner's credit balance > 0, else `PAUSED` immediately (edge case: someone posts with 0 balance).
- **FR-8:** Owner can **cancel** their own active/paused survey at any time (no refund logic needed — nothing was pre-reserved).
- **FR-9:** Owner cannot edit the form URL or target after posting in MVP (must cancel + repost). *(Phase 2: allow edits.)*

### 6.3 Discovering & Filling Surveys ("Fill Surveys" feed)
- **FR-10:** Feed shows **only `ACTIVE` surveys** — `PAUSED`, `COMPLETED`, and `CANCELLED` surveys are immediately removed from the feed the moment their state changes (no delay, no stale listings). This also excludes the current user's own survey and any survey this user has already filled.
- **FR-11:** Each feed card shows: progress (`current_responses / target_responses`), a "Fill this form" button.
- **FR-12:** Clicking "Fill this form" opens the Google Form link in a new tab **and** reveals a "✅ I filled this form" confirm button in the original tab (link is only revealed after the click — not shown plainly in the feed, to add minimal friction/intentionality).
- **FR-13:** Clicking confirm triggers an atomic server transaction:
  1. Reject if filler == owner (defense in depth even though hidden from feed).
  2. Reject if a `FillEvent` already exists for (survey, filler) — one fill per user per survey, enforced by a DB unique constraint, not just UI hiding.
  3. Reject if survey is no longer `ACTIVE` (race condition: e.g., last credit just got consumed by someone else) — show "This survey just got paused, try another one!"
  4. Otherwise: `current_responses += 1`; owner `credit_balance -= 1`; filler `credit_balance += 1`; filler `total_forms_filled += 1`; write `FillEvent` row.
  5. If `current_responses >= target_responses` → `status = COMPLETED`.
  6. Else if owner `credit_balance == 0` → `status = PAUSED`.
- **FR-14 (Verification — MVP is honor system):** No proof of actual completion is required beyond the self-confirm click. This is an accepted MVP tradeoff. *(Phase 2 mitigations discussed in §10.)*

### 6.4 Dashboard
- **FR-15:** Every user has a dashboard showing: current credit balance, their survey (if any) with live progress, and a simple history list of surveys they've filled.
- **FR-15a:** The owner's dashboard must clearly display their survey's **status**, using simple owner-facing labels rather than raw internal states:

  | Internal state | Owner-facing dashboard label | Meaning shown to owner |
  |---|---|---|
  | `ACTIVE` | 🟢 **Active** — visible to fillers | Has credits, currently getting responses |
  | `PAUSED` | 🔴 **Inactive** — out of credits | Removed from feed; earn a credit by filling someone else's form to reactivate |
  | `COMPLETED` | ✅ **Completed** | Target reached, no longer listed |
  | `CANCELLED` | ⚪ **Cancelled** | Manually stopped by owner |

- **FR-15b:** This status must update in real time (or on next page load at minimum) whenever the underlying state changes — e.g., the moment their last credit is spent, the dashboard should reflect "Inactive" without requiring a manual refresh trigger from the owner.

### 6.5 Leaderboard
- **FR-16:** Public leaderboard shows **Top 5 users by all-time total forms filled** (`total_forms_filled`, which only ever increases — distinct from spendable `credit_balance`, which goes up and down).
- **FR-17:** Show the logged-in user's own rank even if outside top 5 (e.g., "You're #37").

### 6.6 Admin Dashboard
A single admin (you) needs full visibility into everything happening in the app. This is **deliberately a separate system from the anonymous username auth** — that auth was designed to be low-friction and PII-free for end users; the admin surface has the opposite requirements (high security, single privileged identity).

- **FR-18:** Admin authenticates via a **dedicated, unlinked route** (e.g. `/admin/login`) using credentials stored as environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`) — **not** a row in the `User` table, and not reachable via the regular signup/login flow.
- **FR-19:** All `/admin/*` routes are protected by middleware requiring a valid admin session; any request without one redirects to `/admin/login`. Admin login attempts are rate-limited separately from regular user login.
- **FR-20:** No link to `/admin` appears anywhere in the public-facing UI.
- **FR-21:** Admin dashboard provides **read visibility** into:
  - All users: username, credit balance, total forms filled, join date
  - All surveys: owner, form URL, target/current progress, status, timestamps
  - Full `FillEvent` history (who filled what, when) — the complete audit trail
  - Full `CreditTransaction` ledger — every credit movement in the system, traceable
  - A summary overview: total users, surveys by status, total fills all-time, credits currently in circulation, new signups over the last 7/30 days
- **FR-22 (optional — see §14 open question):** Admin can cancel any survey, suspend a user, or manually adjust a credit balance (with a mandatory reason field). If implemented, every such action is written to an `AdminAction` audit log — even for a single-admin app, this prevents untraceable balance changes later.
- **FR-23:** The admin dashboard is a plain, data-dense operational UI — it deliberately does **not** use the gamified motion language from `UI_UX_Motion_Spec.md` (no confetti, no coin-fly, no podiums). It should look and feel like an ops/analytics tool, not a player-facing screen.

---

## 7. Data Model

```
User
  id                  PK
  username             unique, case-insensitive
  password_hash
  recovery_code_hash
  credit_balance       int, default 3
  total_forms_filled   int, default 0   (leaderboard metric, monotonically increasing)
  created_at

Survey
  id                  PK
  owner_id            FK -> User
  google_form_url
  target_responses    int
  current_responses   int, default 0
  status              enum(ACTIVE, PAUSED, COMPLETED, CANCELLED)
  created_at
  updated_at

FillEvent
  id                  PK
  survey_id           FK -> Survey
  filler_id           FK -> User
  created_at
  UNIQUE (survey_id, filler_id)

CreditTransaction   (audit ledger, optional but recommended)
  id                  PK
  user_id             FK -> User
  delta               int  (+1 / -1 / +3 signup bonus)
  reason              enum(SIGNUP_BONUS, EARNED_FILL, SPENT_ON_FILL)
  related_survey_id   FK -> Survey, nullable
  created_at

AdminAction   (only needed if FR-22 moderation actions are implemented)
  id                  PK
  action_type         enum(CANCEL_SURVEY, SUSPEND_USER, ADJUST_CREDITS)
  target_user_id      FK -> User, nullable
  target_survey_id    FK -> Survey, nullable
  reason              text
  created_at
```

---

## 8. Key Edge Cases & Business Rules

| Scenario | Rule |
|---|---|
| User tries to fill their own survey | Blocked server-side, even if UI somehow shows it |
| Two users click confirm on the last available credit simultaneously | DB transaction with row locking ensures only one succeeds; the other gets a friendly "just missed it" message |
| User's survey is `PAUSED`, they earn a credit elsewhere | Auto-flips to `ACTIVE` immediately, no action needed |
| User forgets both password and recovery code | Account permanently locked out — no support-based recovery in MVP |
| User cancels a survey mid-way | No credit refund needed (nothing was reserved); already-earned credits by fillers are untouched |
| New user, empty "Fill Surveys" feed (cold start) | Known Day-1 risk — consider seeding a few sample/dummy surveys at launch |

---

## 9. Non-Functional Requirements

- **Security:** Passwords and recovery codes hashed with a strong algorithm (argon2 or bcrypt). Rate-limit login/recovery attempts. CSRF protection on all mutating routes.
- **Admin isolation:** The admin auth system must be fully separate from the regular user auth — different credential store (env vars, not the `User` table), different session mechanism, no shared code path that could let a regular user session escalate to admin.
- **Data integrity:** All credit-affecting operations must be atomic DB transactions (no read-then-write race conditions).
- **Performance:** Feed and leaderboard queries indexed on `status` and `total_forms_filled` respectively; target <2s page loads.
- **Responsiveness:** Fully usable on mobile web (many students will use this from their phones).
- **Accessibility:** WCAG AA basics — keyboard navigable, sufficient contrast, alt text.

---

## 10. Known Risks & Mitigations

| Risk | Mitigation (MVP-compatible) | Future Mitigation (Phase 2) |
|---|---|---|
| Honor-system confirm = fake fills | Clear community norms messaging, visible reporting link (logs only, no action in MVP) | Random spot-check flow where owners can flag suspicious fills; soft server-side heuristics (e.g., confirm clicked <5 seconds after opening link) |
| Alt accounts to farm credits for one's own surveys | None in MVP beyond username uniqueness | Basic device/IP fingerprinting, rate-limiting signups per IP |
| Permanent lockout on lost credentials | Forced "I saved my code" checkbox + strong repeated warnings | Optional opt-in email as recovery-only channel |
| Cold-start empty feed | Seed a handful of sample surveys pre-launch | Referral incentives, notifications when new surveys appear |

---

## 11. MVP Scope Summary

**In scope (v1):**
- Username + password auth, one-time recovery code
- 3 free signup credits
- One active/paused survey per user
- Fill feed with self/duplicate-fill protection
- Real-time credit transfer on confirm, atomic transactions
- Auto pause/resume based on live credit balance
- Auto-complete at target
- Top-5 all-time leaderboard + personal rank
- Basic dashboard
- Admin dashboard (read-only visibility into all users, surveys, fills, and credit transactions)

**Explicitly out of scope for v1 (Phase 2 candidates):**
- Multiple concurrent surveys per user
- Editing a posted survey
- Stronger fraud detection (screenshots, timers, poster approval)
- Weekly/monthly leaderboard resets, badges/streaks
- Survey categories/search/filtering
- Optional email-for-recovery
- Credit purchases / monetization
- Admin moderation actions (cancel any survey, suspend a user, manually adjust credits) — see open question in §14
- Native mobile app

---

## 12. UI/UX & Motion Design Philosophy

Beyond the functional requirements above, the product's differentiation is largely experiential — the credit-earning loop should *feel* rewarding, not just function correctly. Full screen-by-screen animation specs (triggers, durations, easing, library choices) live in the companion document `UI_UX_Motion_Spec.md`, so this PRD stays focused on requirements while that doc stays implementation-ready for whoever (or whatever agent) builds it.

**Guiding principles:**
- Every credit-earning moment (confirm-fill) gets a distinct, satisfying visual payoff — this is the core retention hook and should not be treated as a minor UI detail.
- Status should be legible at a glance without reading text — color, motion, and iconography (e.g., a survey's active/paused state) should communicate state before the label does.
- Animation must degrade gracefully — respect `prefers-reduced-motion`, and no animation should block or delay the underlying action (e.g., credit balance updates in the data layer immediately; the animation is decorative, not load-bearing).
- See `UI_UX_Motion_Spec.md` for the full breakdown of onboarding, posting, fill-feed, confirm-fill, dashboard, and leaderboard interactions.

---

## 13. Proposed Technical Approach (Next.js, full-stack)

Since Next.js itself has no built-in database, the app is still "solely Next.js" from a framework/codebase standpoint by using:
- **App Router** with **Server Actions / Route Handlers** as the entire backend (no separate service).
- **Auth:** NextAuth.js (Auth.js) with a **Credentials provider** for username/password; custom logic for the recovery-code flow.
- **Database:** Postgres (e.g., Neon or Vercel Postgres) via **Prisma ORM** — needed regardless of framework choice, since credits/leaderboards require persistent, transactional storage.
- **Styling:** Tailwind CSS.
- **Deployment:** Vercel (pairs naturally with Next.js).
- **Built using Google Antigravity** as the agentic dev environment to scaffold and iterate on the codebase.

---

## 14. Open Questions for You

1. Should there be **any cap** on target response count per survey (e.g., max 100), to prevent one survey hogging the whole feed indefinitely?
2. Do you want a lightweight **report/flag** button on surveys in MVP (logged for your review, no auto-action), or skip entirely for v1?
3. Any minimum credit balance requirement to post at all, or is 0-balance-but-paused-immediately (FR-7) fine?
4. Should admin moderation actions (cancel a survey, suspend a user, manually adjust credits — FR-22) be pulled into v1, or is read-only visibility enough for launch? Given this is a small/solo project, manually running a Prisma Studio query for the rare edge case might be enough early on, saving build time.

