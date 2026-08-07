import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceChart } from "@/components/price-chart";
import { computeBetOutcomes } from "@/lib/engine/outcomes";
import { loadBetById } from "@/lib/parser/load-bets";
import { formatDate, formatPlace, formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

interface BetPageProps {
  params: Promise<{ id: string }>;
}

export default async function BetPage({ params }: BetPageProps) {
  const { id } = await params;
  const bet = loadBetById(id);

  if (!bet) {
    notFound();
  }

  const outcomes = computeBetOutcomes(bet);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to dashboard
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          {bet.name}
        </h1>
        <p className="text-zinc-600">
          {formatDate(bet.startDate)} – {formatDate(bet.endDate)} ·{" "}
          {bet.candidates.length} candidates
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Price history</h2>
        <PriceChart bet={bet} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">Final standings</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Place
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Candidate
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Final price
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {outcomes.candidates.map((candidate) => (
                <tr key={candidate.name}>
                  <td className="px-4 py-3 text-zinc-700">
                    {formatPlace(candidate.place)}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {candidate.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {formatPrice(candidate.finalPrice)}
                  </td>
                  <td className="px-4 py-3">
                    {candidate.isWinner ? (
                      <span className="text-green-700">Winner</span>
                    ) : (
                      <span className="text-zinc-500">Lost</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
