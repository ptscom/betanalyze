import { analyzeSingleDayJump } from "@/lib/analyses/single-day-jump";
import type {
  JumpThreshold,
  PeriodDays,
  SingleDayJumpAggregateResult,
} from "@/lib/analyses/types";
import { jumpCacheKey } from "@/lib/analyses/types";
import { getCachedSingleDayJump, loadAllBets } from "@/lib/parser/load-bets";

export function getSingleDayJumpAnalysis(
  periodDays: PeriodDays,
  threshold: JumpThreshold,
): SingleDayJumpAggregateResult {
  const cached = getCachedSingleDayJump(periodDays, threshold);
  if (cached) {
    return cached;
  }

  const { bets } = loadAllBets();
  return analyzeSingleDayJump(bets, periodDays, threshold);
}

export { jumpCacheKey };
