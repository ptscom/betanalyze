import { Suspense } from "react";
import { FirstCrossoverView } from "@/components/first-crossover-view";
import { AnalysisNav, PeriodSelector } from "@/components/analysis-nav";
import { getFirstCrossoverAnalysis } from "@/lib/analyses/get-first-crossover";
import type { PeriodDays } from "@/lib/analyses/types";
import { loadAllBets } from "@/lib/parser/load-bets";

export const dynamic = "force-dynamic";

interface FirstCrossoverPageProps {
  searchParams: Promise<{ days?: string }>;
}

function parsePeriodDays(value?: string): PeriodDays {
  const parsed = Number.parseInt(value ?? "14", 10);
  if (parsed === 7 || parsed === 14 || parsed === 21) {
    return parsed;
  }
  return 14;
}

export default async function FirstCrossoverPage({
  searchParams,
}: FirstCrossoverPageProps) {
  const params = await searchParams;
  const periodDays = parsePeriodDays(params.days);
  const { failures } = loadAllBets();
  const analysis = getFirstCrossoverAnalysis(periodDays);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Analysis
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          First Crossover
        </h1>
        <p className="max-w-3xl text-lg text-zinc-600">
          In the last 7, 14, or 21 days before close, find the first candidate
          who crosses above the leader. See how often that crossover pick becomes
          the final winner.
        </p>
        <AnalysisNav active="first-crossover" />
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

      <FirstCrossoverView analysis={analysis} />
    </main>
  );
}
