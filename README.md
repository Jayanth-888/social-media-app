# Social App

A LinkedIn/Twitter-style social platform built as a placement portfolio project,
using the **Next.js 14 App Router** for both the frontend and the backend
(no separate Express server).

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

See the explanation in the project write-up — in short, `/app/api/**/route.ts`
files are serverless-style route handlers that Next.js compiles and deploys
as backend endpoints, so App Router *is* the backend here.

## Data Model

`User`, `Post`, `Comment`, `Like`, `Follow`, plus the `Account` / `Session` /
`VerificationToken` tables NextAuth needs. See `prisma/schema.prisma` for the
full schema.
