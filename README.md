# Harada Journal

Harada Journal is a private, small-group journal for working through one Open Window 64 goal chart and the daily work connected to it.

## Setup

Complete these steps once before testing the app against Supabase:

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard). Wait until the project is provisioned.
2. In the Supabase dashboard, open **Authentication > Providers > Email** and make sure Email is enabled.
3. In **Authentication > Settings**, disable **Allow new users to sign up**. Invite each friend from the dashboard instead. This keeps the project invite-only.
4. In **Project Settings > API**, copy the **Project URL** and the public **anon** key. Do not use or add the `service_role` key anywhere in this app.
5. Create the local environment file and add those two values:

   ```bash
   cp .env.example .env.local
   ```

   Set `NEXT_PUBLIC_SUPABASE_URL` to the Project URL and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the anon key.

6. Install and authenticate the Supabase CLI, then link this checkout to the project. Replace `<project-ref>` with the project reference from the Supabase dashboard URL:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

   `db push` applies the migration in `supabase/migrations/`, including the `profiles` table, RLS policies, and profile-creation trigger.

7. In **Authentication > URL Configuration**, set the Site URL to your deployed app URL and add both callback URLs to **Redirect URLs**:

   ```text
   http://localhost:3000/auth/callback
   https://<your-vercel-domain>/auth/callback
   ```

   Replace `<your-vercel-domain>` with the actual Vercel domain, or add the equivalent callback URL for a custom domain. Add the localhost URL even when using a custom production domain.

8. Invite your own email and your friends from **Authentication > Users > Invite user**. With open signups disabled, only invited email addresses can complete the magic-link login.

9. Connect this repository to Vercel. In the Vercel project settings, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for every environment that will run the app: Preview and Production at minimum. Redeploy after adding them.

## Run Locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Visit `/` while signed out to verify it redirects to `/login`, request a magic link, and follow the link from the invited email.

The database verification test can be run against a local Supabase stack after installing Docker:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

## Verification Commands

```bash
npm run build
npm run lint
npx tsc --noEmit
```
