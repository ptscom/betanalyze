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
import { RISE_IN_MA_CONFIG } from "@/lib/analyses/rise-in-ma";
import type { RiseInMaAggregateResult } from "@/lib/analyses/types";
import { formatDate, formatPercent, formatPlace, formatPrice } from "@/lib/utils/format";

interface RiseInMaViewProps {
  analysis: RiseInMaAggregateResult;
}

export function RiseInMaView({ analysis }: RiseInMaViewProps) {
  const eligibleResults = analysis.betResults.filter(
    (result) => result.hasEnoughHistory && result.hasSignal,
  );

  const placeChartData = Object.entries(analysis.placeDistribution)
    .map(([place, count]) => ({
      place: Number(place),
      placeLabel: formatPlace(Number(place)),
      count,
    }))
    .sort((a, b) => a.place - b.place);

  const bracketRows = analysis.pickPriceWinRates.filter((row) => row.total > 0);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Eligible bets"
          value={String(analysis.eligibleBets)}
          hint={`${analysis.totalBets - analysis.eligibleBets} had no MA rise signal`}
        />
        <StatCard
          label="Signal pick won"
          value={formatPercent(analysis.winRate)}
          hint={`${analysis.picksWhoWon} of ${analysis.eligibleBets} bets`}
        />
        <StatCard
          label="Lookback window"
          value={`${analysis.periodDays} days`}
          hint={`${RISE_IN_MA_CONFIG.maWindowDays}d MA, ${RISE_IN_MA_CONFIG.consecutiveIncreases}d rise`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Where signal picks finished"
          description="Final place for the first candidate with consecutive MA increases in the window."
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
              Each candidate gets a {RISE_IN_MA_CONFIG.maWindowDays}-day moving
              average of their daily closing price.
            </li>
            <li>
              A signal fires when the MA rises for{" "}
              {RISE_IN_MA_CONFIG.consecutiveIncreases} consecutive days within
              the last {analysis.periodDays} days before close.
            </li>
            <li>
              If multiple candidates signal, only the <strong>first</strong> one
              chronologically is counted for that bet.
            </li>
            <li>
              We then check whether that pick ended with the highest final price
              at close.
            </li>
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-zinc-900">
          Signal price vs win rate
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          The pick&apos;s market price on the day the MA rise pattern triggered,
          grouped by bracket.
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Price at signal
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
                    No MA rise signals in this window.
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
        startSlabSelectorLabel="Signal price slab:"
        countLabel="Bets"
        description="From the MA rise signal to close, if the signal pick fell through lower price slabs (daily closes, on down days only), what is the chance they still won? Entry price is their price on the signal day."
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Bet-by-bet results</h2>
          <p className="mt-1 text-sm text-zinc-600">
            First MA rise signal in the window, price and MA on that day, and
            final outcome.
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
                    Signal pick
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Price at signal
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    5d MA
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Signal date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Dip slabs touched
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">
                    Min after signal
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
                {eligibleResults.map((result) => (
                  <tr key={result.betId} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {result.betName}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.signalCandidate}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.signalPrice != null
                        ? formatPrice(result.signalPrice)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.signalMa != null
                        ? formatPrice(result.signalMa)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {result.signalAt ? formatDate(result.signalAt) : "—"}
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
                      {formatPlace(result.pickFinalPlace)}
                    </td>
                    <td className="px-4 py-3">
                      {result.pickWon ? (
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
