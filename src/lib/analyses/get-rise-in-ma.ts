import { analyzeRiseInMa } from "@/lib/analyses/rise-in-ma";
import type { PeriodDays, RiseInMaAggregateResult } from "@/lib/analyses/types";
import { getCachedRiseInMa, loadAllBets } from "@/lib/parser/load-bets";

export function getRiseInMaAnalysis(
  periodDays: PeriodDays,
): RiseInMaAggregateResult {
  const cached = getCachedRiseInMa(periodDays);
  if (cached) {
    return cached;
  }

  const { bets } = loadAllBets();
  return analyzeRiseInMa(bets, periodDays);
}
