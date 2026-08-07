import type { StrategyResult } from "@/lib/models/types";
import { formatDate, formatPlace, getResultStatus } from "@/lib/utils/format";

interface StrategyResultsTableProps {
  results: StrategyResult[];
}

export function StrategyResultsTable({ results }: StrategyResultsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Bet</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">
              Picked
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">
              Signal date
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
          {results.map((result) => {
            const status = getResultStatus(result);
            const signal = result.signals.find(
              (entry) => entry.candidate === result.pickedCandidate,
            );

            return (
              <tr key={`${result.strategyId}-${result.betId}`}>
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {result.betName}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {result.pickedCandidate ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {signal ? formatDate(signal.triggeredAt) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      status.tone === "win"
                        ? "text-green-700"
                        : status.tone === "loss"
                          ? "text-amber-700"
                          : "text-zinc-500"
                    }
                  >
                    {status.label}
                    {result.pickedPlace != null && !result.pickedWon
                      ? ` (${formatPlace(result.pickedPlace)})`
                      : ""}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {result.winner ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
