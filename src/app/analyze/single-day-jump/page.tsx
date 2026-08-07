import { Suspense } from "react";
import { SingleDayJumpView } from "@/components/single-day-jump-view";
import {
  AnalysisNav,
  JumpThresholdSelector,
  PeriodSelector,
} from "@/components/analysis-nav";
import { getSingleDayJumpAnalysis } from "@/lib/analyses/get-single-day-jump";
import type { JumpThreshold, PeriodDays } from "@/lib/analyses/types";
import { JUMP_THRESHOLD_OPTIONS } from "@/lib/analyses/types";
import { loadAllBets } from "@/lib/parser/load-bets";

export const dynamic = "force-dynamic";

interface SingleDayJumpPageProps {
  searchParams: Promise<{ days?: string; jump?: string }>;
}

function parsePeriodDays(value?: string): PeriodDays {
  const parsed = Number.parseInt(value ?? "14", 10);
  if (parsed === 7 || parsed === 14 || parsed === 21) {
    return parsed;
  }
  return 14;
}

function parseJumpThreshold(value?: string): JumpThreshold {
  const parsed = Number.parseFloat(value ?? "0.1");
  if (JUMP_THRESHOLD_OPTIONS.includes(parsed as JumpThreshold)) {
    return parsed as JumpThreshold;
  }
  return 0.1;
}

export default async function SingleDayJumpPage({
  searchParams,
}: SingleDayJumpPageProps) {
  const params = await searchParams;
  const periodDays = parsePeriodDays(params.days);
  const threshold = parseJumpThreshold(params.jump);
  const { failures } = loadAllBets();
  const analysis = getSingleDayJumpAnalysis(periodDays, threshold);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
          Analysis
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Single Day Jump
        </h1>
        <p className="max-w-3xl text-lg text-zinc-600">
          In the last 7, 14, or 21 days, find the first candidate whose closing
          price jumps by 10%, 25%, or 50% in a single day. Track how often that
          pick went on to win at close.
        </p>
        <AnalysisNav active="single-day-jump" />
        <Suspense fallback={<div className="h-10" />}>
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector selected={periodDays} />
            <JumpThresholdSelector selected={threshold} />
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

      <SingleDayJumpView analysis={analysis} />
    </main>
  );
}
