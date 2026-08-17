# Bet Analyze

Backtesting dashboard for prediction market Excel exports. Deploy on Vercel, drop your bet files into `data/bets/`, and compare strategy performance across markets.

## Quick start

```bash
npm install
npm run build:data    # parse Excel files once into a fast JSON cache
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

After adding or changing Excel files in `data/bets/`, rerun `npm run build:data`.

## Multiple datasets (separate branches)

This repo uses **one dataset per git branch** so analyses never mix files from
different batches. See [`data/DATASETS.md`](data/DATASETS.md).

| Branch | Dataset |
|--------|---------|
| `main` | Primary elections (default) |
| `dataset/elections_2` | `elections_2` |

To work on the second batch: `git checkout dataset/elections_2`, add only those Excel
files to `data/bets/`, then `npm run build:data`. Deploy that branch as its own Vercel
production branch or project.

## Add your data

Drop your Excel exports into `data/bets/`. Each file is one bet (market/race).
**Each candidate has their own sheet tab** in the workbook — the parser reads every tab.

Expected columns per sheet:
- `Logged At`
- `Section` (optional when using one candidate per tab)
- `Displayed Market Price`

The winner is whoever has the **highest final price** at market close (usually above $0.90).

## Analyses

### Period wise Performance

Compare 7, 14, or 21-day windows before market close:

- Who was in the top position on the check date?
- Where did they finish at close?
- How did winner vs non-winner prices evolve during the window?
- Price bracket distribution at the check date

Open `/analyze/period-performance?days=14` (or `days=7`, `days=21`).

## Performance

Excel files are parsed once into `data/bets-cache.json` via `npm run build:data`. This
cache includes precomputed period-performance results for 7, 14, and 21-day windows.
At runtime the app loads a single JSON file (~5 MB for 150+ bets) instead of parsing
every Excel file on each request. Vercel builds run `build:data` automatically before
`next build`.

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
