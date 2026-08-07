import type { StrategySummary } from "@/lib/models/types";
import { formatPercent } from "@/lib/utils/format";

interface StrategySummaryCardProps {
  summary: StrategySummary;
  selected?: boolean;
}

export function StrategySummaryCard({
  summary,
  selected = false,
}: StrategySummaryCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        selected
          ? "border-blue-500 bg-blue-50/60"
          : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">
            {summary.strategyName}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {summary.betsWithSignal} of {summary.totalBets} bets triggered a signal
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-zinc-900">
            {formatPercent(summary.winRate)}
          </div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Win rate
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-zinc-500">Wins</dt>
          <dd className="font-medium text-zinc-900">{summary.wins}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Avg place</dt>
          <dd className="font-medium text-zinc-900">
            {summary.avgPlace != null ? summary.avgPlace.toFixed(2) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Signals</dt>
          <dd className="font-medium text-zinc-900">{summary.betsWithSignal}</dd>
        </div>
      </dl>
    </div>
  );
}
