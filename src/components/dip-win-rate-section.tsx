"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PRICE_BRACKETS } from "@/lib/analyses/shared";
import type { DipSlabWinRate } from "@/lib/analyses/types";
import { formatPercent } from "@/lib/utils/format";

interface DipWinRateSectionProps {
  dipSlabWinRates: DipSlabWinRate[];
  title?: string;
  description?: string;
  startSlabSelectorLabel?: string;
  countLabel?: string;
}

export function DipWinRateSection({
  dipSlabWinRates,
  title = "Dip win rate by start slab",
  description = "If the pick started in a price slab and fell through lower slabs (daily closes, on down days only), what is the chance they still won at close? Only slabs at or below the entry price count as dips.",
  startSlabSelectorLabel = "Pick started at:",
  countLabel = "Count",
}: DipWinRateSectionProps) {
  const startSlabsWithData = useMemo(
    () => [...new Set(dipSlabWinRates.map((row) => row.startSlab))],
    [dipSlabWinRates],
  );

  const [selectedStartSlab, setSelectedStartSlab] = useState<string>(
    () => startSlabsWithData[0] ?? "",
  );

  const activeStartSlab = startSlabsWithData.includes(selectedStartSlab)
    ? selectedStartSlab
    : (startSlabsWithData[0] ?? "");

  const dipRowsForStart = dipSlabWinRates.filter(
    (row) => row.startSlab === activeStartSlab,
  );

  const dipChartData = dipRowsForStart.map((row) => ({
    dipSlab: row.dipSlab,
    winRate: Number((row.winRate * 100).toFixed(1)),
    total: row.total,
    becameWinner: row.becameWinner,
  }));

  const dipCellMap = useMemo(() => {
    const map = new Map<string, DipSlabWinRate>();
    for (const row of dipSlabWinRates) {
      map.set(`${row.startSlab}|${row.dipSlab}`, row);
    }
    return map;
  }, [dipSlabWinRates]);

  const heatmapStartSlabs = useMemo(
    () =>
      PRICE_BRACKETS.map((bracket) => bracket.label).filter((label) =>
        startSlabsWithData.includes(label),
      ),
    [startSlabsWithData],
  );

  const heatmapDipSlabs = useMemo(() => {
    const dipSlabs = new Set(dipSlabWinRates.map((row) => row.dipSlab));
    return PRICE_BRACKETS.map((bracket) => bracket.label).filter((label) =>
      dipSlabs.has(label),
    );
  }, [dipSlabWinRates]);

  return (
    <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-5">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
        <p className="mt-2 max-w-4xl text-sm text-zinc-600">{description}</p>
      </div>

      {startSlabsWithData.length === 0 ? (
        <p className="text-sm text-zinc-500">No dip data for this window.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-zinc-700">
              {startSlabSelectorLabel}
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
                        {countLabel}
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

            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-zinc-900">
                Win rate by dip slab
              </h3>
              <p className="mt-1 text-sm text-zinc-600">
                Picks that started at {activeStartSlab}.
              </p>
              <div className="mt-4 h-72">
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
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-zinc-900">
              Full matrix (start slab × dip slab)
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              Cell shows win rate and count. Rows = price at entry, columns =
              slab touched while falling.
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
  );
}

function winRateColor(winRate: number): string {
  const red = Math.round(220 - winRate * 198);
  const green = Math.round(60 + winRate * 103);
  const blue = Math.round(60 + winRate * 14);
  return `rgb(${red}, ${green}, ${blue})`;
}
