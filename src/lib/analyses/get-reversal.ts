import { analyzeReversal } from "@/lib/analyses/reversal";
import type {
  ReversalAggregateResult,
  ReversalPeriodDays,
} from "@/lib/analyses/types";
import { getCachedReversal, loadAllBets } from "@/lib/parser/load-bets";

export function getReversalAnalysis(
  periodDays: ReversalPeriodDays,
): ReversalAggregateResult {
  const cached = getCachedReversal(periodDays);
  if (cached) {
    return cached;
  }

  const { bets } = loadAllBets();
  return analyzeReversal(bets, periodDays);
}
