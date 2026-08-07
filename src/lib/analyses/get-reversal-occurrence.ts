import { analyzeReversalOccurrence } from "@/lib/analyses/reversal-occurrence";
import type {
  PeriodDays,
  ReversalOccurrenceAggregateResult,
  ReversalThreshold,
} from "@/lib/analyses/types";
import { reversalCacheKey } from "@/lib/analyses/types";
import { getCachedReversalOccurrence, loadAllBets } from "@/lib/parser/load-bets";

export function getReversalOccurrenceAnalysis(
  periodDays: PeriodDays,
  threshold: ReversalThreshold,
): ReversalOccurrenceAggregateResult {
  const cached = getCachedReversalOccurrence(periodDays, threshold);
  if (cached) {
    return cached;
  }

  const { bets } = loadAllBets();
  return analyzeReversalOccurrence(bets, periodDays, threshold);
}

export { reversalCacheKey };
