"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DipWinRateSection } from "@/components/dip-win-rate-section";
import type { PostBigFallAggregateResult } from "@/lib/analyses/types";
import { POST_BIG_FALL_THRESHOLD } from "@/lib/analyses/types";
import {
  formatDate,
  formatPercent,
  formatPlace,
  formatPrice,
} from "@/lib/utils/format";

interface PostBigFallViewProps {
  analysis: PostBigFallAggregateResult;
}

export function PostBigFallView({ analysis }: PostBigFallViewProps) {
  const eligibleResults = analysis.betResults.filter(
    (result) =>
      result.hasEnoughHistory && result.leaderAtCheck && result.hasBigFall,
  );

  const placeChartData = Object.entries(analysis.placeDistribution)
    .map(([place, count]) => ({
      place: Number(place),
      placeLabel: formatPlace(Number(place)),
      count,
    }))
    .sort((a, b) => a.place - b.place);

  const bracketRows = analysis.priceAfterFallWinRates.filter(
    (row) => row.total > 0,
  );

  const fallTypeChartData = [
    { type: "1-day fall", count: analysis.oneDayFalls },
    { type: "2-day fall", count: analysis.twoDayFalls },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Eligible bets"
          value={String(analysis.eligibleBets)}
          hint={`leader had ≥${formatPercent(POST_BIG_FALL_THRESHOLD)} fall in 1–2 days`}
        />
        <StatCard
          label="Leader still won"
          value={formatPercent(analysis.winRate)}
          hint={`${analysis.leadersWhoWon} of ${analysis.eligibleBets} bets`}
        />
        <StatCard
          label="1-day falls"
          value={String(analysis.oneDayFalls)}
          hint="≥25% drop in a single day"
        />
        <StatCard
          label="2-day falls"
          value={String(analysis.twoDayFalls)}
          hint="≥25% drop over two days"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Where fallen leaders finished"
          description="Final place distribution for period-start leaders who suffered a big fall."
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

        <ChartCard
          title="Fall duration"
          description="How many big falls happened in one day vs two consecutive days."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fallTypeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-zinc-900">
          Price after fall vs win rate
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          The leader&apos;s closing price on the day the ≥25% fall completed, and
          how often they still won at close.
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Price after fall
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
                    No big falls in this window.
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
      </section>

      <DipWinRateSection
        dipSlabWinRates={analysis.dipSlabWinRates}
        startSlabSelectorLabel="Price after fall:"
        countLabel="Bets"
        description="From the post-fall closing price to market close, if the leader fell through lower price slabs (daily closes, on down days only), what is the chance they still won? Only slabs at or below the post-fall price count as dips."
      />

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-zinc-900">How to read this</h3>
        <ul className="mt-3 space-y-2 text-sm text-zinc-600">
          <li>
            On the check date ({analysis.periodDays} days before close), we find
            whoever had the highest market price — the period-start leader.
          </li>
          <li>
            We scan daily closes from that date to close for the first ≥25%
            decline in 1 day (day-over-day) or 2 days (vs two days prior).
          </li>
          <li>
            If a 1-day fall qualifies on the same day a 2-day fall would also
            qualify, the 1-day fall is counted.
          </li>
          <li>
            Dip win rates are measured from the leader&apos;s price on the fall
            completion day through close.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Bet-by-bet results
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Period-start leaders who suffered a big fall and whether they
            recovered to win.
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
                    Leader
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Fall date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Fall type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Before → After
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Fall %
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Dip slabs touched
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Min after fall
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Final place
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Won?
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Actual winner
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {eligibleResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-6 text-center text-zinc-500"
                    >
                      No period-start leaders had a ≥25% fall in 1–2 days in
                      this window.
                    </td>
                  </tr>
                ) : (
                  eligibleResults.map((result) => (
                    <tr key={result.betId} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {result.betName}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {result.leaderAtCheck}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {result.fallAt ? formatDate(result.fallAt) : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {result.fallDays === 1
                          ? "1-day"
                          : result.fallDays === 2
                            ? "2-day"
                            : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {result.priceBeforeFall != null &&
                        result.priceAfterFall != null
                          ? `${formatPrice(result.priceBeforeFall)} → ${formatPrice(result.priceAfterFall)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {result.fallPct != null
                          ? formatPercent(result.fallPct)
                          : "—"}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-xs text-zinc-700">
                        {result.dipSlabsTouched.join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {result.minPriceInWindow != null
                          ? formatPrice(result.minPriceInWindow)
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
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {result.actualWinner ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
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
