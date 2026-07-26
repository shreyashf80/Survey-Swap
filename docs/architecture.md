# Architecture Document — SurveySwap

## 1. Overview
SurveySwap is a closed-loop, gamified platform where users exchange responses for Google Forms. The system relies on a tightly controlled credit economy to ensure fairness, where users earn credits by filling out others' surveys and spend those credits to receive responses on their own.

This application is designed as a monolithic full-stack application using **Next.js 14+ (App Router)**.

## 2. Technology Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Backend/API:** Next.js Server Actions and Route Handlers (no separate backend service)
- **Database:** PostgreSQL (Neon / Vercel Postgres)
- **ORM:** Prisma ORM
- **Authentication:** NextAuth.js (Auth.js) using the Credentials provider for users and completely isolated logic for Admin access.
- **Styling:** Tailwind CSS
- **Motion & UI Libraries:** `framer-motion` for complex transitions, `canvas-confetti` for particle effects.
- **Hosting:** Vercel

## 3. System Architecture & Boundaries

### 3.1. Public Application
The main application surface where students/researchers interact. It revolves around a core "loop" of posting surveys, earning credits, and managing one's own campaigns.

### 3.2. Admin Dashboard
A completely isolated surface for operational oversight.
- **Isolation:** Operates on a distinct authentication path (`/admin/login`) with credentials loaded from environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`). It shares no auth state or tables with public users.
- **Protection:** All `/admin/*` routes are protected by robust middleware.
- **Design:** Purely data-dense tables and graphs without the gamified motion specs applied to the public app.

## 4. Data Model

The application relies on PostgreSQL to maintain transactional integrity, particularly around credit balances.

- **`User`**: Core user table holding `username`, `password_hash`, `recovery_code_hash`, `credit_balance`, and `total_forms_filled`. No PII (email/phone) is stored.
- **`Survey`**: Tracks campaigns, linking to the `owner_id`. Holds `google_form_url`, `target_responses`, `current_responses`, and `status`.
- **`FillEvent`**: Enforces the one-fill-per-user-per-survey rule via a unique DB constraint on `(survey_id, filler_id)`. 
- **`CreditTransaction`**: An audit ledger tracking every credit movement (Signup bonuses, earned fills, spent fills).
- **`AdminAction` (Optional/Future)**: Audit log for moderator actions.

## 5. Core Engine & State Machine

### 5.1 Survey State Transitions
Surveys operate on a strict state machine driven by real-time credit balances:
- `ACTIVE`: The owner has ≥ 1 credit and the survey is accepting fills.
- `PAUSED`: The owner's credit balance reached 0. Auto-flips back to `ACTIVE` immediately when the owner earns a new credit.
- `COMPLETED`: `current_responses` meets `target_responses`.
- `CANCELLED`: Manually stopped by the owner.

### 5.2 The Credit Transaction (Atomic Operation)
The `confirmFill` action is the heart of the platform. It must be implemented as a **single atomic database transaction with row-level locking** to prevent race conditions (e.g., two users confirming a fill on an owner's final available credit). 

When triggered:
1. Validations: Reject self-fills, duplicate fills, or if the survey is no longer `ACTIVE`.
2. Updates: Increment survey `current_responses`, decrement owner's `credit_balance`, increment filler's `credit_balance` and `total_forms_filled`.
3. State resolution: Switch to `COMPLETED` if the target is hit, or `PAUSED` if the owner's balance hits 0.

## 6. Frontend Component Architecture

The frontend is highly modularized around the gamified motion specification, separating core data components from interactive flair.

### Proposed Directory Structure
```
components/
  auth/
    UsernameField.tsx        // debounced availability check
    RecoveryCodeVault.tsx    // typewriter reveal + drag/check-to-seal
  credits/
    CreditBalance.tsx        // roll-up counter + pulse
    CreditFuelGauge.tsx      // Optional needle gauge
  surveys/
    PostSurveyForm.tsx       // fuel-gauge input + launch animation
    QuestCard.tsx            // flip reveal + progress ring + urgency pulse
    ConfirmFillButton.tsx    // coin fly + confetti + toast (core reward moment)
    StatusBadge.tsx          // active heartbeat / inactive sleep cue
  leaderboard/
    Podium.tsx               // Top 3 display
    LeaderboardRow.tsx       // list items with rank-up slide animation
```

## 7. Non-Functional Constraints
- **Security:** CSRF protection on mutating routes. Password hashes using argon2/bcrypt. 
- **Graceful Degradation:** All motion components must respect `prefers-reduced-motion`, falling back to instant state changes and color/iconography cues.
- **Data-First Rendering:** Animations (like coin flies or roll-up counters) are purely presentational and must never delay the immediate rendering or update of underlying data state.
