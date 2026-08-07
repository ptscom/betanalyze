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

  const placeChartData = Object.entries(analysis.placeDistribution)
    .map(([place, count]) => ({
      place: Number(place),
      placeLabel: formatPlace(Number(place)),
      count,
    }))
    .sort((a, b) => a.place - b.place);

  const bracketRows = analysis.hitPriceOutcomes.filter((row) => row.total > 0);

  const outcomeChartData = bracketRows.map((row) => ({
    bracket: row.label,
    Reversed: row.total - row.becameWinner,
    "Held on (won)": row.becameWinner,
  }));

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Hit above threshold"
          value={String(analysis.eligibleBets)}
          hint={`bets with first hit > $${analysis.threshold.toFixed(1)}`}
        />
        <StatCard
          label="Reversal rate"
          value={formatPercent(analysis.reversalRate)}
          hint={`${analysis.reversals} ended as loser`}
        />
        <StatCard
          label="Held on (won)"
          value={formatPercent(analysis.holdRate)}
          hint={`${analysis.heldOnCount} became winner`}
        />
        <StatCard
          label="Lookback window"
          value={`${analysis.periodDays} days`}
          hint={`threshold > $${analysis.threshold.toFixed(1)}`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Reversal vs held on by price at hit"
          description={`When a candidate first crossed $${analysis.threshold.toFixed(1)} in the window, how many reversed vs held on to win.`}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="bracket"
                  tick={{ fontSize: 10 }}
                  angle={-25}
                  textAnchor="end"
                  height={70}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="Reversed"
                  stackId="a"
                  fill="#ef4444"
                  radius={[0, 0, 0, 0]}
                />
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

        <ChartCard
          title="Final place after hitting threshold"
          description="Where candidates finished at close after first crossing the threshold."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={placeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="placeLabel" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-zinc-900">
          Price at first hit vs outcome
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          Price when the candidate first exceeded ${analysis.threshold.toFixed(1)}{" "}
          in the window, and whether they reversed or held on to win.
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Price at first hit
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
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {bracketRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-zinc-500"
                  >
                    No threshold hits in this window.
                  </td>
                </tr>
              ) : (
                bracketRows.map((row) => (
                  <tr key={row.label} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{row.total}</td>
                    <td className="px-4 py-3 text-red-700">
                      {row.total - row.becameWinner}
                    </td>
                    <td className="px-4 py-3 text-green-700">
                      {row.becameWinner}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      {formatPercent(1 - row.winRate)}
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
            In the last {analysis.periodDays} days, we find the first time any
            candidate&apos;s price goes above ${analysis.threshold.toFixed(1)}.
          </li>
          <li>
            If multiple candidates hit the threshold, the earliest occurrence
            in the window is used for that bet.
          </li>
          <li>
            <strong>Reversed</strong> means they hit the threshold but did not
            end as the final winner at close.
          </li>
          <li>
            <strong>Held on</strong> means they hit the threshold and still won
            at close.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Bet-by-bet results</h2>
          <p className="mt-1 text-sm text-zinc-600">
            First threshold hit in the window and whether that candidate reversed.
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
