# JHMarketplace

Keyboard-focused second-hand marketplace for a Discord community.

## Stack

- Next.js App Router
- TypeScript
- Supabase Auth, Database, and Storage
- Vercel deployment

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy env vars:

   ```bash
   cp .env.example .env.local
   ```

3. Create a Supabase project and paste these values into `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   NEXT_PUBLIC_LISTING_INVITE_CODE=
   ```

4. In Supabase SQL Editor, run:

   ```sql
   -- see supabase/schema.sql
   ```

5. Start dev server:

   ```bash
   npm run dev
   ```

## Supabase

Run `supabase/schema.sql` in the Supabase SQL Editor. It creates:

- `public.listings`
- Row Level Security policies
- `listing-photos` storage bucket
- public read access for marketplace listings
- owner-only insert/update/delete

## Deploy

Deploy on Vercel and add the same environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_LISTING_INVITE_CODE`
