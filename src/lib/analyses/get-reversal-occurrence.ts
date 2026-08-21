import { analyzeReversalOccurrence } from "@/lib/analyses/reversal-occurrence";
import type {
  PeriodDays,
  ReversalOccurrenceAggregateResult,
} from "@/lib/analyses/types";
import { reversalOccurrenceCacheKey } from "@/lib/analyses/types";
import { getCachedReversalOccurrence, loadAllBets } from "@/lib/parser/load-bets";

export function getReversalOccurrenceAnalysis(
  periodDays: PeriodDays,
): ReversalOccurrenceAggregateResult {
  const cached = getCachedReversalOccurrence(periodDays);
  if (cached) {
    return cached;
  }

  const { bets } = loadAllBets();
  return analyzeReversalOccurrence(bets, periodDays);
}

export { reversalOccurrenceCacheKey };
