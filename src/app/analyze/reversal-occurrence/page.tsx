import { Suspense } from "react";
import { ReversalOccurrenceView } from "@/components/reversal-occurrence-view";
import { AnalysisNav, PeriodSelector } from "@/components/analysis-nav";
import { getReversalOccurrenceAnalysis } from "@/lib/analyses/get-reversal-occurrence";
import type { PeriodDays } from "@/lib/analyses/types";
import { loadAllBets } from "@/lib/parser/load-bets";

export const dynamic = "force-dynamic";

interface ReversalOccurrencePageProps {
  searchParams: Promise<{ days?: string }>;
}

function parsePeriodDays(value?: string): PeriodDays {
  const parsed = Number.parseInt(value ?? "14", 10);
  if (parsed === 7 || parsed === 14 || parsed === 21) {
    return parsed;
  }
  return 14;
}

export default async function ReversalOccurrencePage({
  searchParams,
}: ReversalOccurrencePageProps) {
  const params = await searchParams;
  const periodDays = parsePeriodDays(params.days);
  const { failures } = loadAllBets();
  const analysis = getReversalOccurrenceAnalysis(periodDays);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Analysis
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Reversal Occurrence
        </h1>
        <p className="max-w-3xl text-lg text-zinc-600">
          In the last 7, 14, or 21 days, find the first time any candidate
          reaches $0.50 or above. Compare reversal vs held-on rates by the price
          slab at that first hit ($0.50–$0.60 through $0.90–$1.00).
        </p>
        <AnalysisNav active="reversal-occurrence" />
        <Suspense fallback={<div className="h-10" />}>
          <PeriodSelector selected={periodDays} />
        </Suspense>
      </section>

      {failures.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">
            {failures.length} file(s) could not be parsed and were skipped.
          </p>
        </section>
      )}

      <ReversalOccurrenceView analysis={analysis} />
    </main>
  );
}
