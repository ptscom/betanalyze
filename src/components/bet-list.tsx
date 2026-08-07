import Link from "next/link";
import type { BetMarket } from "@/lib/models/types";
import { computeBetOutcomes } from "@/lib/engine/outcomes";
import { formatDate, formatPrice } from "@/lib/utils/format";

interface BetListProps {
  bets: BetMarket[];
}

export function BetList({ bets }: BetListProps) {
  if (bets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-600">
        No bet files found. Add Excel files to <code>data/bets/</code>.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Bet</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">
              Candidates
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">
              Date range
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">
              Winner
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {bets.map((bet) => {
            const outcomes = computeBetOutcomes(bet);
            const winner = outcomes.candidates.find(
              (candidate) => candidate.isWinner,
            );

            return (
              <tr key={bet.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/bets/${bet.id}`}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {bet.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {bet.candidates.length}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {formatDate(bet.startDate)} – {formatDate(bet.endDate)}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {winner ? (
                    <span>
                      {winner.name}{" "}
                      <span className="text-zinc-500">
                        ({formatPrice(winner.finalPrice)})
                      </span>
                    </span>
                  ) : (
                    <span className="text-zinc-500">No winner (&gt; $0.90)</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
