# UI/UX & Motion Design Spec — SurveySwap

Companion to `PRD_SurveySwap_Gamified_App.md` (see §12). This doc is written to be handed directly to an implementation agent (e.g. Google Antigravity) alongside the PRD — each section below is scoped as one implementable unit of work.

---

## 0. Global motion rules

- **Libraries:** `framer-motion` for React state-driven transitions (progress bars, badges, list reordering), `canvas-confetti` for particle bursts, plain CSS `@keyframes` for simple one-shot effects (button press, pulses).
- **Durations:** micro-interactions (button press, icon pulse) 150–250ms; state transitions (progress bar fill, badge swap) 400–600ms; celebratory bursts (confetti, coin fly) 600–900ms.
- **Easing:** use `ease-out` for anything entering/growing, `ease-in-out` for looping/idle animations (breathing dot, sleeping zzz).
- **Accessibility:** wrap all non-essential animation in a `prefers-reduced-motion` check; when reduced motion is on, replace motion with an instant state change plus a static icon/color cue — never remove the *information*, only the *motion*.
- **Data-first:** underlying state (credit balance, survey progress) updates immediately on the successful server response. Animations are purely presentational and must never gate or delay when the real number becomes correct (e.g. don't wait for a 900ms coin-fly animation to finish before showing the true credit count).

---

## 1. Onboarding — "Claim your callsign"

- **Username field:** debounced availability check (~400ms after typing stops). Show an inline spinner → then a checkmark (green) or an "x" (red) with a short scale-in pop (150ms), not just a color swap.
- **Signup success — coin drop:** on account creation, animate 3 coin icons dropping one at a time (staggered 150ms apart) into a coin-purse icon near the credit balance, each with a small bounce-settle (CSS keyframe, ease-out then slight overshoot).
- **Recovery code reveal ("seal the vault"):**
  1. Code appears character-by-character (typewriter effect, ~30ms/char) inside a card styled like a sealed scroll/vault door.
  2. A "Copy code" button sits beside it.
  3. The primary CTA ("Continue") is disabled until the user drags the code card into a vault icon (or, simpler build: checks an "I've saved my code" checkbox) — on drop/check, the vault door animates shut (300ms) before CTA enables.
  4. This is a deliberate friction point — do not let users skip it via a skip link.

---

## 2. Posting a survey — "Launch a campaign"

- **Target-count input:** as the user types a target response number, a small rocket-fuel-gauge bar fills proportionally next to the field (purely decorative, capped visually at a fixed max like 100 for gauge purposes).
- **Post button → launch:** on successful submission, a small rocket icon animates from the button upward off-screen with a fading trail (CSS keyframe translateY + opacity, ~700ms), then transitions into the dashboard view showing the new survey card.

---

## 3. Fill-surveys feed — "Quest cards"

- **Card layout:** each survey is a card with a circular progress ring (SVG `stroke-dashoffset` animated on mount) rather than a flat bar — reads more like a game HUD stat.
- **Reveal interaction:** the Google Form link is not shown directly. Clicking "Fill this form" flips the card (CSS 3D transform, `rotateY`, 400ms) to reveal the link plus a "✅ I filled this form" confirm button on the back face.
- **Urgency state:** cards within 3 responses of their target get a slow pulsing accent border (2s ease-in-out loop, opacity 0.6↔1) to visually nudge fillers toward finishing surveys that are close to done.
- **Empty state:** if the feed is empty, show a friendly illustration + copy ("No quests right now — check back soon") rather than a blank screen.

---

## 4. Confirm-fill — the core reward moment

This is the highest-leverage animation in the product; it fires every time credits change hands.

1. **Button press:** scale down to 0.95 on `:active` (150ms).
2. **Coin fly:** a coin icon spawns at the button's position and animates (translate + fade) toward the credit-balance element in the header, arriving as the counter updates (600ms, `ease-out`).
3. **Counter roll-up:** the credit number animates as a rolling count-up (not an instant swap) from old value to new value over ~400ms, with a brief scale-pulse (1 → 1.25 → 1) on arrival.
4. **Confetti burst:** 6–10 small particles burst outward from the button and fall/fade (600ms), using `canvas-confetti` or a lightweight custom particle set — no need for a full-screen effect, keep it localized to the interaction point.
5. **Progress update:** the target survey's progress ring/bar animates to its new value (500ms `ease-out`) simultaneously.
6. **Toast:** a small "+1 credit earned" toast fades in above the button and fades out after ~1.2s.
7. **Streak banner (session-level):** after 3 confirms in one session, show a temporary "🔥 On a roll" banner at the top of the feed for a few seconds.
8. **Milestone complete:** when a survey's progress reaches its target, replace its card with a "Survey complete" state (checkmark, color shift to success) instead of removing it silently — the filler who completed it should feel like they finished something.

---

## 5. Dashboard — status as a living thing

- **Status badge:**
  - `Active`: green dot with a slow "heartbeat" pulse (scale 1 → 1.15 → 1, 1.5s loop).
  - `Inactive` (paused, out of credits): gray/muted dot, with a small "sleeping" cue (e.g. a faint z-z-z icon fade in/out) rather than just a flat gray label — reinforces that it's dormant, not broken, and will "wake up" once credits are earned.
  - `Completed`: static green checkmark, no loop animation (it's a resolved state, not an ongoing one).
- **Credit fuel gauge:** an optional circular gauge (like a car dashboard needle) as an alternate/secondary display of credit balance — needle rotates smoothly (`transform: rotate()`, 400ms) whenever balance changes.
- **Status transition:** when a survey flips from `Active` to `Inactive` in real time (last credit spent), briefly flash the badge (opacity dip) before settling into the new state, so the change is noticeable rather than silent.

---

## 6. Leaderboard — "Podium, not a list"

- **Top 3 podium:** rendered as actual podium steps (1st tallest/center, 2nd/3rd shorter on sides), with a small avatar/initials circle on each that has a subtle idle bounce (translateY loop, 2s, very small amplitude ~2px).
- **Ranks 4–5:** simple list rows below the podium.
- **Rank-up animation:** when the current user's rank improves (detected client-side by comparing previous vs new position), their row/podium slot animates a slide-past-the-person-they-overtook motion (translateY transition, 500ms `ease-out`) plus a brief highlight flash.
- **Your rank pin:** if the user is outside the top 5, pin a "You're #N" row at the bottom of the leaderboard card, visually distinct (different background) from the ranked list above it.

---

## 7. Suggested component breakdown (for Next.js implementation)

```
components/
  auth/
    UsernameField.tsx        // debounced availability check + pop animation
    RecoveryCodeVault.tsx     // typewriter reveal + drag/check-to-seal
  credits/
    CreditBalance.tsx         // roll-up counter + pulse
    CreditFuelGauge.tsx       // optional needle gauge
  surveys/
    PostSurveyForm.tsx        // fuel-gauge input + launch animation
    QuestCard.tsx             // flip reveal + progress ring + urgency pulse
    ConfirmFillButton.tsx     // coin fly + confetti + toast (core reward moment)
    StatusBadge.tsx           // active heartbeat / inactive sleep cue
  leaderboard/
    Podium.tsx
    LeaderboardRow.tsx        // rank-up slide animation
```

Each of these is a good unit to hand to an implementation agent as a single scoped task (see the companion implementation guide for how to sequence them).
