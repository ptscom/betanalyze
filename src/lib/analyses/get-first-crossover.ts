import { analyzeFirstCrossover } from "@/lib/analyses/first-crossover";
import type {
  FirstCrossoverAggregateResult,
  PeriodDays,
} from "@/lib/analyses/types";
import {
  getCachedFirstCrossover,
  loadAllBets,
} from "@/lib/parser/load-bets";

export function getFirstCrossoverAnalysis(
  periodDays: PeriodDays,
): FirstCrossoverAggregateResult {
  const cached = getCachedFirstCrossover(periodDays);
  if (cached) {
    return cached;
  }

  const { bets } = loadAllBets();
  return analyzeFirstCrossover(bets, periodDays);
}
