import { Suspense } from "react";
import { ReversalView } from "@/components/reversal-view";
import { AnalysisNav, ReversalPeriodSelector } from "@/components/analysis-nav";
import { getReversalAnalysis } from "@/lib/analyses/get-reversal";
import type { ReversalPeriodDays } from "@/lib/analyses/types";
import { REVERSAL_PERIOD_OPTIONS } from "@/lib/analyses/types";
import { loadAllBets } from "@/lib/parser/load-bets";

export const dynamic = "force-dynamic";

interface ReversalPageProps {
  searchParams: Promise<{ days?: string }>;
}

function parsePeriodDays(value?: string): ReversalPeriodDays {
  const parsed = Number.parseInt(value ?? "14", 10);
  if (REVERSAL_PERIOD_OPTIONS.includes(parsed as ReversalPeriodDays)) {
    return parsed as ReversalPeriodDays;
  }
  return 14;
}

export default async function ReversalPage({ searchParams }: ReversalPageProps) {
  const params = await searchParams;
  const periodDays = parsePeriodDays(params.days);
  const { failures } = loadAllBets();
  const analysis = getReversalAnalysis(periodDays);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Analysis
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Reversal
        </h1>
        <p className="max-w-3xl text-lg text-zinc-600">
          Of all candidates who reach $0.90 or above in the lookback window, what
          percentage end up as losers at close? Every qualifying candidate in
          each bet is counted separately.
        </p>
        <AnalysisNav active="reversal" />
        <Suspense fallback={<div className="h-10" />}>
          <ReversalPeriodSelector selected={periodDays} />
        </Suspense>
      </section>

      {failures.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">
            {failures.length} file(s) could not be parsed and were skipped.
          </p>
        </section>
      )}

      <ReversalView analysis={analysis} />
    </main>
  );
}
