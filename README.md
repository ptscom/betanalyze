# Bet Analyze

Backtesting dashboard for prediction market Excel exports. Deploy on Vercel, drop your bet files into `data/bets/`, and compare strategy performance across markets.

## Quick start

```bash
npm install
npm run generate:sample-data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Add your data

1. Export or copy your bet Excel files into `data/bets/`
2. Keep the expected columns:
   - `Logged At`
   - `Section` (candidate name)
   - `Displayed Market Price`
3. Rebuild or restart the dev server to reload files

A candidate is treated as the winner when their **latest** displayed market price is **above $0.90**.

## Built-in strategies

| Strategy | Rule |
| --- | --- |
| Early Mover | Pick the candidate with the highest opening price |
| First Crossover | Pick the first candidate to overtake the market leader |
| Latest Crossover (2 weeks) | Pick the most recent leader change in the final 14 days |
| 5-Day MA Momentum | Pick the first candidate above $0.20 with 3 consecutive daily increases in a 5-day moving average |

## Add a new strategy

Create a new strategy in `src/lib/strategies/` using the `Strategy` interface:

```ts
export const myStrategy: Strategy = {
  id: "my-strategy",
  name: "My Strategy",
  description: "What this strategy does",
  run(bet, outcomes) {
    // return StrategyResult
  },
};
```

Register it in `src/lib/strategies/index.ts`.

## Deploy to Vercel

1. Import the repo in Vercel (default Next.js settings)
2. Set **Production Branch** to `main`
3. Add your Excel files under `data/bets/` before deploying
4. Under **Settings → Deployment Protection**, either sign in to view previews or disable protection for Production if you want a public URL
5. Under **Settings → Domains**, confirm `betanalyze.vercel.app` (or your project name) is assigned to Production

The app reads bet files at runtime on the server, so no database is required.

### Troubleshooting 404 on Vercel

If you see `404: NOT_FOUND` with `x-vercel-error: NOT_FOUND`:

- The domain has no production deployment yet. Open the Vercel project → **Deployments** → promote the latest successful `main` deploy to **Production**
- Or you may be using the wrong URL. Check the deployment URL in the Vercel dashboard
- Preview URLs on team accounts may require Vercel login (Deployment Protection)

Test the deployment with `/api/health` — it should return `{"status":"ok"}`.

## Project structure

```text
data/bets/                 Excel bet exports
scripts/                   Sample data generator
src/lib/parser/            Excel ingestion
src/lib/engine/            Timeline, crossover, moving averages
src/lib/strategies/        Pluggable strategy definitions
src/lib/backtest/          Backtest runner and summaries
src/app/                   Dashboard UI
```

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run generate:sample-data` — create demo Excel files in `data/bets/`
