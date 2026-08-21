import {
  analyzeGapDecrease,
  analyzeGapIncrease,
} from "@/lib/analyses/gap-change";
import type { GapChangeAggregateResult, PeriodDays } from "@/lib/analyses/types";
import {
  getCachedGapDecrease,
  getCachedGapIncrease,
  loadAllBets,
} from "@/lib/parser/load-bets";

export function getGapDecreaseAnalysis(
  periodDays: PeriodDays,
): GapChangeAggregateResult {
  const cached = getCachedGapDecrease(periodDays);
  if (cached) {
    return cached;
  }

  const { bets } = loadAllBets();
  return analyzeGapDecrease(bets, periodDays);
}

export function getGapIncreaseAnalysis(
  periodDays: PeriodDays,
): GapChangeAggregateResult {
  const cached = getCachedGapIncrease(periodDays);
  if (cached) {
    return cached;
  }

  const { bets } = loadAllBets();
  return analyzeGapIncrease(bets, periodDays);
}
