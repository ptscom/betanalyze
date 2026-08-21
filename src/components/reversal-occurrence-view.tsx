"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReversalOccurrenceAggregateResult } from "@/lib/analyses/types";
import { REVERSAL_OCCURRENCE_MIN_PRICE } from "@/lib/analyses/types";
import { formatDate, formatPercent, formatPlace, formatPrice } from "@/lib/utils/format";

interface ReversalOccurrenceViewProps {
  analysis: ReversalOccurrenceAggregateResult;
}

export function ReversalOccurrenceView({
  analysis,
}: ReversalOccurrenceViewProps) {
  const eligibleResults = analysis.betResults.filter(
    (result) => result.hasEnoughHistory && result.hasHit,
  );

  const slabRows = analysis.slabWinRates;

  const reversalRateChartData = slabRows.map((row) => ({
    slab: row.label,
    reversalRate: row.reversalRate,
    holdRate: row.holdRate,
  }));

  const outcomeChartData = slabRows
    .filter((row) => row.total > 0)
    .map((row) => ({
      slab: row.label,
      Reversed: row.reversals,
      "Held on (won)": row.heldOnCount,
    }));

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Eligible bets"
          value={String(analysis.eligibleBets)}
          hint={`first hit ≥ $${REVERSAL_OCCURRENCE_MIN_PRICE.toFixed(2)}`}
        />
        <StatCard
          label="Overall reversal rate"
          value={formatPercent(analysis.reversalRate)}
          hint={`${analysis.reversals} ended as loser`}
        />
        <StatCard
          label="Overall held on (won)"
          value={formatPercent(analysis.holdRate)}
          hint={`${analysis.heldOnCount} became winner`}
        />
        <StatCard
          label="Lookback window"
          value={`${analysis.periodDays} days`}
          hint="one slab per bet"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Reversal rate by price slab"
          description="Each bet is assigned to exactly one slab based on the closing price on the day of first hit (≥ $0.50)."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reversalRateChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="slab"
                  tick={{ fontSize: 10 }}
                  angle={-25}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
                  domain={[0, 1]}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => formatPercent(Number(value))}
                />
                <Bar
                  dataKey="reversalRate"
                  name="Reversal rate"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Reversal vs held on by slab"
          description="Stacked counts per slab — where reversal rates differ most."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="slab"
                  tick={{ fontSize: 10 }}
                  angle={-25}
                  textAnchor="end"
                  height={70}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Reversed" stackId="a" fill="#ef4444" />
                <Bar
                  dataKey="Held on (won)"
                  stackId="a"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-zinc-900">
          Reversal rate by price slab at first hit
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          Half-open slabs: $0.50–$0.60 means ≥ $0.50 and &lt; $0.60. Exactly
          $0.60 falls in the next slab.
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Slab at first hit
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Bets
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Reversed
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Held on (won)
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Reversal rate
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Hold rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {slabRows.every((row) => row.total === 0) ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-zinc-500"
                  >
                    No candidates reached $0.50+ in this window.
                  </td>
                </tr>
              ) : (
                slabRows.map((row) => (
                  <tr key={row.label} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{row.total}</td>
                    <td className="px-4 py-3 text-red-700">{row.reversals}</td>
                    <td className="px-4 py-3 text-green-700">
                      {row.heldOnCount}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      {formatPercent(row.reversalRate)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {formatPercent(row.holdRate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-zinc-900">How to read this</h3>
        <ul className="mt-3 space-y-2 text-sm text-zinc-600">
          <li>
            In the last {analysis.periodDays} days, we find the first day any
            candidate&apos;s daily close is ≥ $0.50.
          </li>
          <li>
            That candidate and that day&apos;s close price assign the bet to one
            slab — even if price later moves to a higher slab.
          </li>
          <li>
            If multiple candidates qualify on the same earliest day, the earliest
            candidate name (alphabetically) wins for that bet.
          </li>
          <li>
            <strong>Reversed</strong> = hit the slab but did not win at close.
            <strong> Held on</strong> = hit the slab and still won.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Bet-by-bet results</h2>
          <p className="mt-1 text-sm text-zinc-600">
            First hit ≥ $0.50 in the window, assigned slab, and outcome.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="max-h-[32rem] overflow-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="sticky top-0 bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Bet
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Candidate
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Slab
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Price at hit
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Hit date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Final place
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Outcome
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Actual winner
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {eligibleResults.map((result) => (
                  <tr key={result.betId} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {result.betName}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.hitCandidate}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.hitSlab ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.hitPrice != null
                        ? formatPrice(result.hitPrice)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.hitAt ? formatDate(result.hitAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {formatPlace(result.pickFinalPlace)}
                    </td>
                    <td className="px-4 py-3">
                      {result.reversed ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Reversed
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Held on
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.actualWinner ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-zinc-900">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{hint}</div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-600">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
