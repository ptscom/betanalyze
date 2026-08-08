import Link from "next/link";
import { BetList } from "@/components/bet-list";
import { loadAllBets } from "@/lib/parser/load-bets";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const { bets, failures } = loadAllBets();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Bet Analyze
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Prediction market analysis
        </h1>
        <p className="max-w-3xl text-lg text-zinc-600">
          Drop Excel exports into <code>data/bets/</code> and run analyses to find
          patterns in how market prices evolve before close. A candidate wins when
          their latest displayed market price is above $0.90.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="text-3xl font-semibold text-zinc-900">{bets.length}</div>
          <div className="text-sm text-zinc-500">Bets loaded</div>
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
        <h2 className="text-2xl font-semibold text-zinc-900">Analyses</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/analyze/period-performance?days=14"
            className="group rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
          >
            <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600">
              Period wise Performance
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Check who led 7, 14, or 21 days before close and where they finished.
              Includes price evolution and win-rate by starting price.
            </p>
          </Link>
          <Link
            href="/analyze/first-crossover?days=14"
            className="group rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
          >
            <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600">
              First Crossover
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Find the first candidate to overtake the leader in the last 7, 14,
              or 21 days and track their win rate by crossover price.
            </p>
          </Link>
          <Link
            href="/analyze/rise-in-ma?days=14"
            className="group rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
          >
            <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600">
              Rise in MA
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              First candidate with 2 consecutive days of rising 5-day moving
              average in the window — track win rate by signal price.
            </p>
          </Link>
          <Link
            href="/analyze/reversal?days=14"
            className="group rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
          >
            <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-blue-600">
              Reversal
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Of all candidates who reach $0.90+ in the 7/14/21/28-day window,
              what percentage end up as losers at close?
            </p>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Loaded bets</h2>
        <BetList bets={bets} />
      </section>
    </main>
  );
}
