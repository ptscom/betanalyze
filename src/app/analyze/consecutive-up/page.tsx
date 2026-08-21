import { Suspense } from "react";
import { ConsecutiveDaysView } from "@/components/consecutive-days-view";
import {
  AnalysisNav,
  PeriodSelector,
  StreakSelector,
} from "@/components/analysis-nav";
import { getConsecutiveUpDaysAnalysis } from "@/lib/analyses/get-consecutive-days";
import type { ConsecutiveStreakLength, PeriodDays } from "@/lib/analyses/types";
import { loadAllBets } from "@/lib/parser/load-bets";

export const dynamic = "force-dynamic";

interface ConsecutiveUpPageProps {
  searchParams: Promise<{ days?: string; streak?: string }>;
}

function parsePeriodDays(value?: string): PeriodDays {
  const parsed = Number.parseInt(value ?? "14", 10);
  if (parsed === 7 || parsed === 14 || parsed === 21) {
    return parsed;
  }
  return 14;
}

function parseStreakLength(value?: string): ConsecutiveStreakLength {
  const parsed = Number.parseInt(value ?? "3", 10);
  if (parsed === 3 || parsed === 5) {
    return parsed;
  }
  return 3;
}

export default async function ConsecutiveUpPage({
  searchParams,
}: ConsecutiveUpPageProps) {
  const params = await searchParams;
  const periodDays = parsePeriodDays(params.days);
  const streakLength = parseStreakLength(params.streak);
  const { failures } = loadAllBets();
  const analysis = getConsecutiveUpDaysAnalysis(periodDays, streakLength);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Analysis
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Consecutive Up Days
        </h1>
        <p className="max-w-3xl text-lg text-zinc-600">
          Find the first candidate whose daily close rises for 3 or 5
          consecutive days in the window. Track whether that pick wins at close.
        </p>
        <AnalysisNav active="consecutive-up" />
        <Suspense fallback={<div className="h-10" />}>
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector selected={periodDays} />
            <StreakSelector selected={streakLength} />
          </div>
        </Suspense>
      </section>

      {failures.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">
            {failures.length} file(s) could not be parsed and were skipped.
          </p>
        </section>
      )}

      <ConsecutiveDaysView analysis={analysis} />
    </main>
  );
}
