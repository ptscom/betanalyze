# Datasets

Bet Analyze keeps **one dataset per git branch**. Each branch has its own Excel files in
`data/bets/` and its own built cache (`data/bets-cache.json`, generated locally / at
deploy — not committed).

Do not mix datasets on the same branch.

## Branches

| Branch | Dataset | Notes |
|--------|---------|--------|
| `main` | default (primary elections) | Production default on Vercel |
| `cursor/reversal-occurrence-analysis-d286` | primary elections + latest analyses | Feature branch with full analysis set |
| `dataset/elections_2` | `elections_2` | Second election batch — same app code, separate data |

## Working on `elections_2`

```bash
git checkout dataset/elections_2
# Copy or export Excel files into data/bets/ (only elections_2 files)
npm run build:data
npm run dev
```

After adding or changing files, always rerun `npm run build:data` before relying on
analysis results.

## Deploy `elections_2` separately (Vercel)

**Option A — second Vercel project** (recommended)

1. Import the same GitHub repo again (or duplicate the project).
2. Set **Production Branch** to `dataset/elections_2`.
3. Deploy — the build runs `build:data` on only the Excel files on that branch.

**Option B — preview URL**

1. Push to `dataset/elections_2`.
2. Open the Vercel preview deployment for that branch.

Each deployment only sees the bets committed on its branch, so stats never mix.

## Syncing app code across datasets

Dataset branches should stay aligned with the latest working feature branch for app
fixes and new analyses:

```bash
git checkout dataset/elections_2
git merge cursor/reversal-occurrence-analysis-d286
# Resolve conflicts only in src/ — never copy data/bets/ from other branches
npm run build:data
```

If `data/bets/` conflicts during merge, keep this branch's files and discard imports
from other branches.

## Adding another dataset later

```bash
git checkout cursor/reversal-occurrence-analysis-d286
git checkout -b dataset/<name>
git rm data/bets/*.xlsx   # keep .gitkeep
# add new Excel files, commit, push
```

Use a clear branch name (e.g. `dataset/elections_3`, `dataset/sports_2026`).
