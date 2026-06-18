# U.S. Open Pool Leaderboard

Live Vercel-ready leaderboard for the "good golfer, bad golfer" U.S. Open pool.

## Configure Picks

Edit `src/config/picks.ts`.

Each entry needs:

- `participant`: pool player name
- `goodGolfer.id`: USGA player identifier
- `goodGolfer.name`: fallback display name
- `badGolfer.id`: USGA player identifier
- `badGolfer.name`: fallback display name

The live app uses the official USGA scoring feed, so ids must match the U.S. Open player ids from `https://www.usopen.com/content/api/players.view=players.championship=uso.json`.

## Scoring

- Round score is `bad golfer to-par - good golfer to-par`.
- Current rounds update live from each golfer's current round-to-par.
- The displayed current cut is calculated from the live leaderboard as the 60th player's current total to par.
- If either picked golfer misses the cut or withdraws before the weekend, rounds 3 and 4 are `-5`.
- If both picked golfers miss the cut, the weekend penalty is still only `-5` per day.
- Higher total wins.

## Local Development

```bash
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm test
npm run lint
npm run build
```

## Vercel

Deploy as a standard Next.js project. The app includes one dynamic page and one dynamic API route at `/api/leaderboard`.

Optional environment variable:

```bash
USGA_SUBSCRIPTION_KEY=...
```

If it is not set, the app uses the public key currently embedded in the official U.S. Open scoring page.
