


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

## FinTrak account and Gmail sync setup (Supabase + Vercel)

This app now supports:

- FinTrak username/email + password accounts
- one-time Gmail connection with a stored refresh token
- synced category overrides per FinTrak user

### 1. Create Supabase table

Run this SQL in Supabase SQL editor:

```sql
create table if not exists public.fintrak_users (
  id text primary key,
  username text not null unique,
  email text unique,
  password_hash text not null,
  passcode_hash text,
  gmail_refresh_token text,
  gmail_email text,
  gmail_subject text,
  category_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 2. Add environment variables

Set these in Vercel Project -> Settings -> Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_SESSION_SECRET` (recommended, but the app can fall back to the server secret in development)

Google OAuth scopes required by this app:

- `https://www.googleapis.com/auth/gmail.readonly`
- `openid`
- `email`
- `profile`

For local development, add the same keys to `.env.local`.

### 3. Google OAuth redirect URI

Add these Google OAuth redirect URIs in Google Cloud:

- `http://localhost:3000/api/auth/google/callback`
- `https://www.fintrak.online/api/auth/google/callback`

### 4. Flow

1. User signs up with FinTrak username/email + password
2. User signs in to FinTrak
3. User connects Gmail once from inside the authenticated app
4. FinTrak stores the Gmail refresh token securely on the server
5. Future sign-ins use only FinTrak credentials unless Gmail access is revoked

### 5. Redeploy

After adding environment variables, redeploy the app from Vercel.
