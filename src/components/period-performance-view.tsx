"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DipWinRateSection } from "@/components/dip-win-rate-section";
import type { PeriodAggregateResult } from "@/lib/analyses/types";
import { formatPercent, formatPlace, formatPrice } from "@/lib/utils/format";

interface PeriodPerformanceViewProps {
  analysis: PeriodAggregateResult;
}

export function PeriodPerformanceView({ analysis }: PeriodPerformanceViewProps) {
  const eligibleResults = analysis.betResults.filter(
    (result) => result.hasEnoughHistory && result.leaderAtCheck,
  );

  const placeChartData = Object.entries(analysis.placeDistribution)
    .map(([place, count]) => ({
      place: Number(place),
      placeLabel: formatPlace(Number(place)),
      count,
    }))
    .sort((a, b) => a.place - b.place);

  const bracketRows = analysis.leaderPriceWinRates.filter(
    (row) => row.total > 0,
  );

  const evolutionData = analysis.aggregateEvolution.map((point) => ({
    day: `Day ${point.dayOffset}`,
    dayOffset: point.dayOffset,
    Winners: Number(point.winnerAvg.toFixed(3)),
    Others: Number(point.otherAvg.toFixed(3)),
  }));

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Eligible bets"
          value={String(analysis.eligibleBets)}
          hint={`of ${analysis.totalBets} total`}
        />
        <StatCard
          label="Leader became winner"
          value={formatPercent(analysis.winRate)}
          hint={`${analysis.leadersWhoWon} of ${analysis.eligibleBets} bets`}
        />
        <StatCard
          label="Check window"
          value={`${analysis.periodDays} days`}
          hint="before market close"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Price evolution in window"
          description="Average price path for eventual winners vs all other candidates during the period."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, ""]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Winners"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Others"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-zinc-900">
            Leader price at period start vs win rate
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            The period leader&apos;s price at day 0 ({analysis.periodDays} days
            before close) and how often they went on to win at close.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Price at period start
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Bets
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Became winner
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
                      colSpan={4}
                      className="px-4 py-6 text-center text-zinc-500"
                    >
                      No data for this period window.
                    </td>
                  </tr>
                ) : (
                  bracketRows.map((row) => (
                    <tr key={row.label} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {row.label}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{row.total}</td>
                      <td className="px-4 py-3 text-zinc-700">
                        {row.becameWinner}
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
        </div>
      </section>

      <DipWinRateSection
        dipSlabWinRates={analysis.dipSlabWinRates}
        startSlabSelectorLabel="Leader started at:"
        countLabel="Bets"
        description="If the period leader started in a price slab and their price fell through lower slabs (daily closes, on down days only), what is the chance they still won at close? Only slabs at or below the period-start price count as dips."
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Where period leaders finished"
          description="Final place distribution for whoever was #1 on the check date."
        >
          <div className="h-64">
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

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-zinc-900">How to read this</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li>
              Each Excel file is one bet. Every sheet tab is a candidate&apos;s
              price history.
            </li>
            <li>
              On the check date ({analysis.periodDays} days before close), we
              find whoever had the highest market price.
            </li>
            <li>
              The winner at close is whoever has the highest final price (usually
              above $0.90).
            </li>
            <li>
              The win-rate table shows: if the leader was priced $0.80–$0.90 at
              the start of the window, how often did they still win at close?
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Bet-by-bet results</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Leader at check date, their price then, and where they finished at close.
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
                    Leader at check
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Price at check
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Dip slabs touched
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Min in window
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Final place
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Became winner?
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
                      {result.leaderAtCheck}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.leaderPriceAtCheck != null
                        ? formatPrice(result.leaderPriceAtCheck)
                        : "—"}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-zinc-700">
                      {result.dipSlabsTouched.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.leaderMinPriceInWindow != null
                        ? formatPrice(result.leaderMinPriceInWindow)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {formatPlace(result.leaderFinalPlace)}
                    </td>
                    <td className="px-4 py-3">
                      {result.leaderWon ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Yes
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                          No
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
