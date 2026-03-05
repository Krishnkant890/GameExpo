# Prompt Arena

This is a full-stack corporate activation project.

## Structure
- `api/`: Fastify backend + Prisma ORM
- `web/`: Next.js frontend + Tailwind CSS

## Getting Started

### Backend (API)
1. Go to `api/`
2. Update `.env` with your actual Supabase password.
3. Run migrations: `npx prisma migrate dev --name init`
4. Start dev server: `npm run dev` (runs on port 4000)

### Frontend (Web)
1. Go to `web/`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev` (runs on port 3000)

## Endpoints / Pages
- **API Health:** `GET http://localhost:4000/health`
- **Frontend Screen:** `http://localhost:3000/screen`
- **Frontend Play:** `http://localhost:3000/play/[eventId]`
- **Frontend Admin:** `http://localhost:3000/admin`
