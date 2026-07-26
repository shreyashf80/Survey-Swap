# SurveySwap 🔄

**A Gamified Google Form Response Exchange Platform**

SurveySwap is an open-source web application designed to solve the classic "cold start" problem of gathering survey responses for academic research, product validation, and class projects.

## 🔴 The Problem

Students and independent researchers routinely need real human responses to Google Forms (surveys, thesis research, class projects, market validation) but have no easy way to reach strangers willing to fill them out. Posting in random Discord/WhatsApp/Facebook groups is unreliable and one-directional (you ask, but rarely give back). 

Because there is no incentive for people to spend their time filling out your survey, most surveys struggle to reach a statistically significant sample size.

## 🟢 The Solution

SurveySwap solves this with a **closed-loop credit economy**: you earn the right to get responses by giving responses to others. It's fair by construction — nobody can extract value from the system without contributing to it first.

### How the loop works:
1. **Join:** Sign up and get a free starter credit.
2. **Spend:** Post your Google Form link and set a target response count. Each response you request costs 1 credit.
3. **Earn:** Your credit balance hits 0? Your survey is automatically paused. To get more responses, you must go to the "Feed" and fill out other users' surveys. Every survey you fill instantly earns you 1 credit.
4. **Repeat:** As soon as you earn a credit, your paused survey is instantly reactivated and pushed back to the public feed for others to fill.

It’s a zero-sum, gamified system that guarantees reciprocal engagement.

## ✨ Key Features

- **Credit-Based Economy:** Fully automated transaction system.
- **Auto-Pausing & Resuming:** Surveys dynamically appear and disappear from the public feed based on the owner's real-time credit balance.
- **Concurrency Safe:** Database-level transaction locking prevents race conditions (e.g., two users trying to claim the last remaining credit on a survey).
- **Gamified UI:** Micro-animations (coin flies, rolling counters, satisfying clicks) make the act of earning credits feel like a game.
- **Global Leaderboard:** Ranks top users by total forms filled to drive competition.
- **Admin Dashboard:** A highly secure, isolated operational dashboard for the platform owner to view all users, surveys, fill events, and credit transactions.

## 🛠 Tech Stack

SurveySwap is a modern full-stack web application built with:
- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Backend:** Next.js Server Actions
- **Database:** PostgreSQL (hosted on [Neon](https://neon.tech/))
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Custom Credentials Provider with zero-PII design and recovery codes)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animation:** CSS Keyframes & Framer Motion
- **Validation:** Zod

## 🚀 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com).
The database relies on Postgres, and Prisma handles all schema migrations automatically. 

Make sure to set the following Environment Variables in your Vercel project:
- `DATABASE_URL` (Postgres connection string, must include `?sslmode=verify-full`)
- `NEXTAUTH_SECRET` (Generated via `openssl rand -base64 32`)
- `NEXTAUTH_URL` (The deployed domain, e.g., `https://surveyswap.vercel.app`)
- `ADMIN_USERNAME` (The login ID for the admin panel)
- `ADMIN_PASSWORD_HASH` (A valid bcrypt hash for the admin password)

## 📄 License

MIT License. Feel free to fork, build upon, and use this for your own university communities!
