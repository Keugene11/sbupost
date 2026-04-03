# SBUpost

A social network built for Stony Brook University students. Share posts, follow classmates, and discover people by major, clubs, or courses.

**Live:** [sbupost.vercel.app](https://sbupost.vercel.app)

## Features

- **Feed** — Share posts with text and up to 4 media attachments (images + video)
- **Social** — Follow/unfollow users, likes, comments, and impression tracking
- **Discovery** — Search by name, major, clubs, or courses
- **Direct Messaging** — Private conversations with message moderation
- **Notifications** — Alerts for likes, follows, and comments
- **Profiles** — Customizable with major, clubs, courses, residence hall, bio, and avatar
- **Moderation** — Admin approval system for posts and messages with email notifications

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Auth:** Supabase Auth with Google, Apple, and email sign-in
- **Database:** Supabase (Postgres)
- **Email:** Nodemailer (Gmail SMTP)
- **Native Apps:** Capacitor (iOS + Android)
- **Deployment:** Vercel

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view locally.
