# Workout Tracker — Setup

## 1. Create a Supabase project

1. Go to supabase.com and create a free account
2. Click "New Project", give it a name like "workout-tracker"
3. Once provisioned, go to **SQL Editor** and paste the contents of `supabase-schema.sql`, then click **Run**

## 2. Get your API keys

In your Supabase project, go to **Settings → API**:
- Copy the **Project URL** 
- Copy the **anon public** key

## 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your values:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000 — it works on desktop or mobile browser (on same WiFi).

## 5. Deploy to Vercel (for iPhone access from anywhere)

```bash
npm install -g vercel
vercel
```

Or push to GitHub and connect the repo at vercel.com/new.

In Vercel's project settings → **Environment Variables**, add the same two variables from step 3.

Once deployed, open the Vercel URL on your iPhone in Safari → tap the share icon → **Add to Home Screen** for an app-like experience.

## Usage

- **Home**: Start a new workout
- **Workout session**: Add exercises, log sets/reps/weight. Weight autofills from your last session for that exercise. Sets save automatically on blur.
- **History**: Browse all past workouts, tap to edit
- **Progress**: Select any exercise to see a chart of max weight or total volume over time
