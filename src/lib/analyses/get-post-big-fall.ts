import { analyzePostBigFall } from "@/lib/analyses/post-big-fall";
import type {
  PeriodDays,
  PostBigFallAggregateResult,
} from "@/lib/analyses/types";
import { getCachedPostBigFall, loadAllBets } from "@/lib/parser/load-bets";

export function getPostBigFallAnalysis(
  periodDays: PeriodDays,
): PostBigFallAggregateResult {
  const cached = getCachedPostBigFall(periodDays);
  if (cached) {
    return cached;
  }

  const { bets } = loadAllBets();
  return analyzePostBigFall(bets, periodDays);
}
