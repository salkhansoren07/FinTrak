


working properly












This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Fintrack

## Cloud data sync setup (Supabase + Vercel)

This app now syncs user category overrides to cloud storage.

### 1. Create Supabase table

Run this SQL in Supabase SQL editor:

```sql
create table if not exists public.user_profiles (
  user_sub text primary key,
  email text,
  category_overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
```

### 2. Add environment variables

Set these in Vercel Project -> Settings -> Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Google OAuth scopes required by this app:

- `https://www.googleapis.com/auth/gmail.readonly`
- `openid`
- `email`
- `profile`

For local development, add the same keys to `.env.local`.

### 3. Redeploy

After adding environment variables, redeploy the app from Vercel.
