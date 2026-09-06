# SETN Sports Live — Phase 1

This starter proves the core SETN Live system:

- Public live gamecast
- Real-time Supabase updates
- Score / period / game clock
- Possession
- Down and distance
- Field position
- Last play
- Private scorekeeper page protected by a server-side PIN
- Architecture ready for OBS overlays and video streams later

## 1. What you need

- A computer with Node.js installed
- A free Supabase account
- A Vercel account for deployment later

## 2. Create Supabase

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Paste everything from `supabase/schema.sql`.
4. Run it.
5. Open the project **Connect / API** information and copy:
   - Project URL
   - Publishable key
6. In Supabase project settings, copy the **secret** key.
   - NEVER put this key in browser code.
   - NEVER share it publicly.

The schema allows the public to read game data but not edit it.

## 3. Configure this project

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SETN_ADMIN_PIN=use-a-long-private-pin-here
```

The secret key and admin PIN are server-only.

## 4. Install and run

From the project folder:

```bash
npm install
npm run dev
```

Open:

- Public gamecast: `http://localhost:3000/live/whitwell-south-pittsburg-demo`
- Scorekeeper: `http://localhost:3000/admin/whitwell-south-pittsburg-demo`

Enter the PIN from `.env.local` on the Scorekeeper page.

## 5. Test real-time updates

Open the public gamecast on one browser/device.
Open the scorekeeper on another.

Try:

- WHI +6
- Start/stop clock
- Change possession
- Change down/distance
- Move the ball
- Save a last play

The public page should change automatically without refreshing.

## 6. How the clock works

The database does NOT write every second.

When the clock starts, SETN saves:

- remaining seconds
- `clock_running = true`
- a start timestamp

Each viewer's browser calculates the countdown locally.
When the scorekeeper presses STOP, the current remaining time is saved.

This is far more efficient than updating the database every second.

## 7. Deploy to Vercel

After the local version works:

1. Put this project in a GitHub repository.
2. Import that repository into Vercel.
3. Add all four environment variables in Vercel.
4. Deploy.

Then you will have a real public SETN Live URL that Webador can link to.

## Security note

This Phase 1 controller uses a server-side admin PIN. It is suitable for learning/prototyping, but before multiple student operators use SETN Live we should replace it with:

- Supabase Auth
- named operator accounts
- per-school/game permissions
- audit logs
- rate limiting

Do not expose `SUPABASE_SECRET_KEY` anywhere in client-side code.

## Phase 2

Once this works, build:

1. OBS scorebug browser source
2. Play-by-play table
3. Player roster database
4. Automatic stats from entered plays
5. Box score
6. Team stats
7. YouTube stream embed
8. Game highlights
9. Multi-game SETN scoreboard ticker
