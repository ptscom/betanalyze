import { analyzePeriodPerformance } from "@/lib/analyses/period-performance";
import type { PeriodAggregateResult, PeriodDays } from "@/lib/analyses/types";
import {
  getCachedPeriodPerformance,
  loadAllBets,
} from "@/lib/parser/load-bets";

export function getPeriodPerformanceAnalysis(
  periodDays: PeriodDays,
): PeriodAggregateResult {
  const cached = getCachedPeriodPerformance(periodDays);
  if (cached) {
    return cached;
  }

  const { bets } = loadAllBets();
  return analyzePeriodPerformance(bets, periodDays);
}
