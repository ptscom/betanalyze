import Link from "next/link";
import { BetList } from "@/components/bet-list";
import { StrategyResultsTable } from "@/components/strategy-results-table";
import { StrategySummaryCard } from "@/components/strategy-summary-card";
import { runFullBacktest } from "@/lib/backtest/run-backtest";
import { loadAllBets } from "@/lib/parser/load-bets";
import { allStrategies } from "@/lib/strategies";
import { sortSummariesByWinRate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const { bets, failures } = loadAllBets();
  const { summaries, resultsByStrategy } = runFullBacktest(bets);
  const rankedSummaries = sortSummariesByWinRate(summaries);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Bet Analyze
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Prediction market backtesting
        </h1>
        <p className="max-w-3xl text-lg text-zinc-600">
          Drop Excel exports into <code>data/bets/</code>, then compare strategy
          signals against final outcomes. A candidate wins when their latest
          displayed market price is above $0.90.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="text-3xl font-semibold text-zinc-900">{bets.length}</div>
          <div className="text-sm text-zinc-500">Bets loaded</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="text-3xl font-semibold text-zinc-900">
            {allStrategies.length}
          </div>
          <div className="text-sm text-zinc-500">Strategies available</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="text-3xl font-semibold text-zinc-900">
            {failures.length}
          </div>
          <div className="text-sm text-zinc-500">Parse failures</div>
        </div>
      </section>

      {failures.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Some files could not be parsed:</p>
          <ul className="mt-2 list-disc pl-5">
            {failures.map((failure) => (
              <li key={failure.filename}>
                {failure.filename}: {failure.error}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-zinc-900">
            Strategy performance
          </h2>
          <Link
            href="/strategies"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all strategies
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {rankedSummaries.map((summary) => (
            <StrategySummaryCard key={summary.strategyId} summary={summary} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Loaded bets</h2>
        <BetList bets={bets} />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">
          Latest strategy picks
        </h2>
        <StrategyResultsTable
          results={rankedSummaries.flatMap(
            (summary) => resultsByStrategy[summary.strategyId] ?? [],
          )}
        />
      </section>
    </main>
  );
}
