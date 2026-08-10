"use client";

import { useMemo, useState } from "react";
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
import { PRICE_BRACKETS } from "@/lib/analyses/shared";
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

  const startSlabsWithData = useMemo(
    () => [...new Set(analysis.dipSlabWinRates.map((row) => row.startSlab))],
    [analysis.dipSlabWinRates],
  );

  const [selectedStartSlab, setSelectedStartSlab] = useState<string>(
    () => startSlabsWithData[0] ?? "",
  );

  const activeStartSlab = startSlabsWithData.includes(selectedStartSlab)
    ? selectedStartSlab
    : (startSlabsWithData[0] ?? "");

  const dipRowsForStart = analysis.dipSlabWinRates.filter(
    (row) => row.startSlab === activeStartSlab,
  );

  const dipChartData = dipRowsForStart.map((row) => ({
    dipSlab: row.dipSlab,
    winRate: Number((row.winRate * 100).toFixed(1)),
    total: row.total,
    becameWinner: row.becameWinner,
  }));

  const dipCellMap = useMemo(() => {
    const map = new Map<string, (typeof analysis.dipSlabWinRates)[number]>();
    for (const row of analysis.dipSlabWinRates) {
      map.set(`${row.startSlab}|${row.dipSlab}`, row);
    }
    return map;
  }, [analysis.dipSlabWinRates]);

  const heatmapStartSlabs = useMemo(
    () =>
      PRICE_BRACKETS.map((bracket) => bracket.label).filter((label) =>
        startSlabsWithData.includes(label),
      ),
    [startSlabsWithData],
  );

  const heatmapDipSlabs = useMemo(() => {
    const dipSlabs = new Set(analysis.dipSlabWinRates.map((row) => row.dipSlab));
    return PRICE_BRACKETS.map((bracket) => bracket.label).filter((label) =>
      dipSlabs.has(label),
    );
  }, [analysis.dipSlabWinRates]);

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

      <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Dip win rate by start slab
          </h2>
          <p className="mt-2 max-w-4xl text-sm text-zinc-600">
            If the period leader started in a price slab and their price fell
            through lower slabs (daily closes, on down days only), what is the
            chance they still won at close? Only slabs at or below the
            period-start price count as dips — a rally above start then
            pulling back to $0.75 is not a dip if they started at $0.65.
          </p>
        </div>

        {startSlabsWithData.length === 0 ? (
          <p className="text-sm text-zinc-500">No dip data for this window.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-zinc-700">
                Leader started at:
              </span>
              <div className="flex flex-wrap gap-2">
                {startSlabsWithData.map((slab) => (
                  <button
                    key={slab}
                    type="button"
                    onClick={() => setSelectedStartSlab(slab)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeStartSlab === slab
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    {slab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">
                  Win rate if price touched dip slab
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Started {activeStartSlab} — win rate by slab reached while
                  falling.
                </p>
                <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
                  <table className="min-w-full divide-y divide-zinc-200 text-sm">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-zinc-600">
                          Dip slab touched
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-zinc-600">
                          Bets
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-zinc-600">
                          Won
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-zinc-600">
                          Win rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {dipRowsForStart.map((row) => (
                        <tr key={row.dipSlab} className="hover:bg-zinc-50">
                          <td className="px-4 py-3 font-medium text-zinc-900">
                            {row.dipSlab}
                          </td>
                          <td className="px-4 py-3 text-zinc-700">{row.total}</td>
                          <td className="px-4 py-3 text-zinc-700">
                            {row.becameWinner}
                          </td>
                          <td className="px-4 py-3 font-semibold text-zinc-900">
                            {formatPercent(row.winRate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <ChartCard
                title="Win rate by dip slab"
                description={`Leaders who started at ${activeStartSlab}.`}
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dipChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="dipSlab"
                        tick={{ fontSize: 9 }}
                        angle={-30}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "winRate") {
                            return [`${value}%`, "Win rate"];
                          }
                          return [value, name];
                        }}
                      />
                      <Bar
                        dataKey="winRate"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-zinc-900">
                Full matrix (start slab × dip slab)
              </h3>
              <p className="mt-1 text-sm text-zinc-600">
                Cell shows win rate and count. Rows = price at period start,
                columns = slab touched while falling.
              </p>
              <div className="mt-4 max-w-full overflow-auto rounded-lg border border-zinc-200">
                <table className="min-w-max text-xs">
                  <thead>
                    <tr className="bg-zinc-50">
                      <th className="sticky left-0 z-10 bg-zinc-50 px-3 py-2 text-left font-medium text-zinc-600">
                        Start ↓ / Dip →
                      </th>
                      {heatmapDipSlabs.map((dipSlab) => (
                        <th
                          key={dipSlab}
                          className="px-2 py-2 text-center font-medium text-zinc-600"
                        >
                          {dipSlab}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapStartSlabs.map((startSlab) => (
                      <tr key={startSlab} className="border-t border-zinc-100">
                        <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium text-zinc-800">
                          {startSlab}
                        </th>
                        {heatmapDipSlabs.map((dipSlab) => {
                          const cell = dipCellMap.get(`${startSlab}|${dipSlab}`);
                          if (!cell) {
                            return (
                              <td
                                key={dipSlab}
                                className="px-2 py-2 text-center text-zinc-300"
                              >
                                —
                              </td>
                            );
                          }

                          return (
                            <td
                              key={dipSlab}
                              className="px-2 py-2 text-center font-medium text-white"
                              style={{
                                backgroundColor: winRateColor(cell.winRate),
                              }}
                              title={`${cell.becameWinner}/${cell.total} won`}
                            >
                              <div>{formatPercent(cell.winRate)}</div>
                              <div className="text-[10px] font-normal opacity-90">
                                {cell.becameWinner}/{cell.total}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

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

function winRateColor(winRate: number): string {
  const red = Math.round(220 - winRate * 198);
  const green = Math.round(60 + winRate * 103);
  const blue = Math.round(60 + winRate * 14);
  return `rgb(${red}, ${green}, ${blue})`;
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
