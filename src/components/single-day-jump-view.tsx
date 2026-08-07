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
import type { SingleDayJumpAggregateResult } from "@/lib/analyses/types";
import { formatDate, formatPercent, formatPlace, formatPrice } from "@/lib/utils/format";

interface SingleDayJumpViewProps {
  analysis: SingleDayJumpAggregateResult;
}

export function SingleDayJumpView({ analysis }: SingleDayJumpViewProps) {
  const eligibleResults = analysis.betResults.filter(
    (result) => result.hasEnoughHistory && result.hasJump,
  );

  const placeChartData = Object.entries(analysis.placeDistribution)
    .map(([place, count]) => ({
      place: Number(place),
      placeLabel: formatPlace(Number(place)),
      count,
    }))
    .sort((a, b) => a.place - b.place);

  const bracketRows = analysis.pickPriceWinRates.filter((row) => row.total > 0);

  const outcomeChartData = bracketRows.map((row) => ({
    bracket: row.label,
    Lost: row.total - row.becameWinner,
    Won: row.becameWinner,
  }));

  const thresholdLabel = formatPercent(analysis.threshold);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Single-day jump detected"
          value={String(analysis.eligibleBets)}
          hint={`bets with ≥${thresholdLabel} day-over-day rise`}
        />
        <StatCard
          label="Jump pick won"
          value={formatPercent(analysis.winRate)}
          hint={`${analysis.picksWhoWon} of ${analysis.eligibleBets} bets`}
        />
        <StatCard
          label="Jump pick lost"
          value={formatPercent(1 - analysis.winRate)}
          hint={`${analysis.eligibleBets - analysis.picksWhoWon} did not win`}
        />
        <StatCard
          label="Lookback window"
          value={`${analysis.periodDays} days`}
          hint={`jump threshold ≥ ${thresholdLabel}`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Won vs lost by price after jump"
          description={`When a candidate first jumped ≥${thresholdLabel} in the window, outcome by price on jump day.`}
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
                <Bar dataKey="Lost" stackId="a" fill="#ef4444" />
                <Bar
                  dataKey="Won"
                  stackId="a"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Final place after jump"
          description="Where jump candidates finished at close."
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
          Price after jump vs win rate
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          Candidate&apos;s closing price on the jump day, grouped by bracket.
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Price after jump
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Bets
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Won
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Lost
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Win rate
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
                    No jumps in this window.
                  </td>
                </tr>
              ) : (
                bracketRows.map((row) => (
                  <tr key={row.label} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{row.total}</td>
                    <td className="px-4 py-3 text-green-700">
                      {row.becameWinner}
                    </td>
                    <td className="px-4 py-3 text-red-700">
                      {row.total - row.becameWinner}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      {formatPercent(row.winRate)}
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
            candidate&apos;s closing price rises by at least {thresholdLabel} vs
            the previous day.
          </li>
          <li>
            If multiple candidates jump on the same day, the earliest
            chronologically is used (alphabetical tie-break).
          </li>
          <li>
            <strong>Won</strong> means the jump candidate ended as the final
            winner at close.
          </li>
          <li>
            <strong>Lost</strong> means they jumped but did not win at close.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Bet-by-bet results</h2>
          <p className="mt-1 text-sm text-zinc-600">
            First single-day jump in the window and final outcome.
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
                    Jump %
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Before → After
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Jump date
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
                      {result.jumpCandidate}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {result.jumpPct != null
                        ? formatPercent(result.jumpPct)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.priceBefore != null && result.priceAfter != null
                        ? `${formatPrice(result.priceBefore)} → ${formatPrice(result.priceAfter)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.jumpAt ? formatDate(result.jumpAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {formatPlace(result.pickFinalPlace)}
                    </td>
                    <td className="px-4 py-3">
                      {result.pickWon ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Won
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Lost
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
