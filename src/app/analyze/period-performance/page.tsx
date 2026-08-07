import { Suspense } from "react";
import { PeriodPerformanceView } from "@/components/period-performance-view";
import { AnalysisNav, PeriodSelector } from "@/components/analysis-nav";
import { analyzePeriodPerformance } from "@/lib/analyses/period-performance";
import type { PeriodDays } from "@/lib/analyses/types";
import { loadAllBets } from "@/lib/parser/load-bets";

export const dynamic = "force-dynamic";

interface PeriodPerformancePageProps {
  searchParams: Promise<{ days?: string }>;
}

function parsePeriodDays(value?: string): PeriodDays {
  const parsed = Number.parseInt(value ?? "14", 10);
  if (parsed === 7 || parsed === 14 || parsed === 21) {
    return parsed;
  }
  return 14;
}

export default async function PeriodPerformancePage({
  searchParams,
}: PeriodPerformancePageProps) {
  const params = await searchParams;
  const periodDays = parsePeriodDays(params.days);
  const { bets, failures } = loadAllBets();
  const analysis = analyzePeriodPerformance(bets, periodDays);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Analysis
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Period wise Performance
        </h1>
        <p className="max-w-3xl text-lg text-zinc-600">
          For each bet, find who was in the top position N days before close,
          then see where they finished. Charts show how winner and non-winner
          prices moved during that window.
        </p>
        <AnalysisNav active="period-performance" />
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

      <PeriodPerformanceView analysis={analysis} />
    </main>
  );
}
