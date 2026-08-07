import Link from "next/link";
import { StrategyResultsTable } from "@/components/strategy-results-table";
import { StrategySummaryCard } from "@/components/strategy-summary-card";
import { runFullBacktest } from "@/lib/backtest/run-backtest";
import { loadAllBets } from "@/lib/parser/load-bets";
import { allStrategies } from "@/lib/strategies";

export const dynamic = "force-dynamic";

export default function StrategiesPage() {
  const { bets } = loadAllBets();
  const { summaries, resultsByStrategy } = runFullBacktest(bets);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Strategies
        </h1>
        <p className="max-w-3xl text-lg text-zinc-600">
          Each strategy emits a pick per bet. Add new strategies by implementing the
          shared strategy interface in <code>src/lib/strategies/</code>.
        </p>
      </section>

      <section className="grid gap-4">
        {summaries.map((summary) => (
          <StrategySummaryCard key={summary.strategyId} summary={summary} />
        ))}
      </section>

      {allStrategies.map((strategy) => (
        <section key={strategy.id} className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900">
              {strategy.name}
            </h2>
            <p className="mt-1 text-zinc-600">{strategy.description}</p>
          </div>
          <StrategyResultsTable
            results={resultsByStrategy[strategy.id] ?? []}
          />
        </section>
      ))}
    </main>
  );
}
