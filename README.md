# 🚀 ReachPilot

AI-powered cold outreach automation platform — competing with Instantly, Lemlist, and Mailshake.

## Features

- **Gmail API integration** via OAuth2 (no SMTP)
- **AI email generation** with GPT-4o (subject + body)
- **Smart queue** with 8–10 minute random delays between sends
- **Reply detection** via Gmail polling
- **AI reply classification** (YES / NO / NEUTRAL)
- **AI follow-up generation** for interested leads
- **Full campaign management** with live logs
- **Vercel-ready** with cron jobs

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/youruser/reachpilot
cd reachpilot
npm install
```

### 2. Set up Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local` (see below).

### 3. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon key** from Settings → API
4. Copy your **service role key** from Settings → API (secret)

### 4. Set up Google OAuth (Gmail API)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable the **Gmail API**: APIs & Services → Enable APIs → search "Gmail API"
4. Create OAuth credentials:
   - Go to APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs
   - Application type: **Web application**
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (local)
     - `https://your-vercel-domain.vercel.app/api/auth/callback/google` (production)
5. Copy the **Client ID** and **Client Secret**

### 5. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Make sure you have GPT-4o access (or change model to `gpt-4o-mini` in `lib/ai.ts` for lower cost)

### 6. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Paste the output as `NEXTAUTH_SECRET`.

### 7. Generate Cron Secret

```bash
openssl rand -hex 20
```

Paste as `CRON_SECRET`.

### 8. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in with Google.

---

## Environment Variables

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<from openssl above>

GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

OPENAI_API_KEY=sk-...

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

CRON_SECRET=<random hex>
```

---

## How It Works

### Uploading Leads

1. Go to **Upload** page
2. Upload CSV / TXT / JSON file
3. Only `email` column is required
4. Preview parsed leads — missing subject/body marked for AI generation
5. Enter campaign name → Create Campaign

### Starting a Campaign

1. Go to **Campaigns** → click your campaign
2. Click **Start Campaign**
3. AI generates emails for any leads missing subject/body
4. Queue schedules all emails with 8–10 min random delays
5. Vercel Cron runs every minute to process the queue

### Reply Detection

- Vercel Cron runs every 5 minutes to poll Gmail for replies
- New replies are stored and auto-classified by GPT-4o mini
- Go to **Replies** to see all classified replies

### AI Follow-ups

1. In Replies, click **AI Follow-up** on a YES reply
2. Preview the GPT-4o generated follow-up
3. Click **Send** to send it directly via Gmail

---

## File Format Reference

### CSV

```csv
email,subject,body
john@company.com,Your Google presence,Hello John...
jane@business.io,,
```

### TXT (one email per line, or comma-separated)

```
john@company.com
jane@business.io,Optional Subject
```

### JSON

```json
[
  { "email": "john@company.com", "subject": "Hello", "body": "..." },
  { "email": "jane@business.io" }
]
```

---

## Deploy to Vercel

1. Push your code to GitHub
2. Create new project on [vercel.com](https://vercel.com)
3. Import your repo
4. Add all environment variables in Vercel dashboard
5. For production, update `NEXTAUTH_URL` to your Vercel domain
6. Add production redirect URI to Google Cloud Console
7. Deploy!

The `vercel.json` file already configures:
- `/api/queue/process` — runs every minute (processes email queue)
- `/api/replies/poll` — runs every 5 minutes (checks for replies)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | TailwindCSS |
| Auth | NextAuth.js v4 + Google OAuth2 |
| Database | Supabase (PostgreSQL) |
| Email | Gmail API v1 |
| AI | OpenAI GPT-4o + GPT-4o mini |
| Deployment | Vercel |

---

## Security

- All API routes protected with NextAuth session validation
- Cron endpoints protected with `CRON_SECRET` bearer token
- Gmail tokens stored server-side only (never exposed to client)
- Service role key never exposed to client bundles
- Input validation with Zod on all API endpoints
- Email format validation before any database writes
