# Social Media App

A LinkedIn/Twitter-style social platform built as a placement portfolio project,
using the **Next.js 14 App Router** for both the frontend and the backend
(no separate Express server).

## Why I Built This

I built this project as placement portfolio to learn modern full-stack web development 
with Next.js 14, TypeScript, Prisma, PostgreSQL, and NextAuth. The goal is to build a 
production-style social media application step by step while gaining practical 
experience with authentication, databases, API development, and scalable application 
architecture.

## Project Status

✅ Phase 0 – Project Setup (Completed)

🚧 Currently Working On:
- Phase 1 – Authentication + Databasegi

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Prisma** + **PostgreSQL** for the database
- **NextAuth.js** for authentication (credentials provider, extendable to OAuth)
- **Zod** for request validation

## Folder Structure

```
/app            → pages (Server/Client Components) and API routes
  /api          → backend route handlers (replaces an Express server)
/components     → shared UI components (ui/, layout/, post/, profile/)
/lib            → db client, auth config, utility functions
/hooks          → custom React hooks (client-side data fetching, etc.)
/types          → shared TypeScript interfaces used by both UI and API
/prisma         → schema.prisma and migrations
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up PostgreSQL

Create a local Postgres database (or use a hosted one like Neon, Supabase, or Railway).

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `DATABASE_URL` and generate a secret for `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Run Prisma migrations

```bash
npx prisma migrate dev --name init
```

This creates the tables in your database and generates the Prisma Client.

### 5. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Useful Scripts

| Command                    | Description                              |
|-----------------------------|-------------------------------------------|
| `npm run dev`               | Start the dev server                      |
| `npm run build`              | Production build                          |
| `npm run start`              | Start the production server               |
| `npm run lint`               | Run ESLint                                |
| `npm run format`             | Format code with Prettier                 |
| `npm run prisma:studio`      | Open Prisma Studio (visual DB browser)    |
| `npm run prisma:migrate`     | Create/apply a new migration              |

## Why there's no `server.js` / Express app

This project uses the **Next.js App Router**, which allows frontend pages and backend 
API routes to live in the same application. Files inside `/app/api/**/route.ts` act as 
API Route Handlers that Next.js compiles into backend endpoints.

Because of this, a separate Express server isn't required for this project. The App 
Router provides routing, API handling, server-side rendering, and backend logic within 
a single codebase.

## Data Model

`User`, `Post`, `Comment`, `Like`, `Follow`, plus the `Account` / `Session` /
`VerificationToken` tables NextAuth needs. See `prisma/schema.prisma` for the
full schema.
