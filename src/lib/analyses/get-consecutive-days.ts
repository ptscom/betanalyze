import {
  analyzeConsecutiveDownDays,
  analyzeConsecutiveUpDays,
} from "@/lib/analyses/consecutive-days";
import type {
  ConsecutiveDaysAggregateResult,
  ConsecutiveStreakLength,
  PeriodDays,
} from "@/lib/analyses/types";
import {
  getCachedConsecutiveDownDays,
  getCachedConsecutiveUpDays,
  loadAllBets,
} from "@/lib/parser/load-bets";

export function getConsecutiveUpDaysAnalysis(
  periodDays: PeriodDays,
  streakLength: ConsecutiveStreakLength,
): ConsecutiveDaysAggregateResult {
  const cached = getCachedConsecutiveUpDays(periodDays, streakLength);
  if (cached) {
    return cached;
  }

  const { bets } = loadAllBets();
  return analyzeConsecutiveUpDays(bets, periodDays, streakLength);
}

export function getConsecutiveDownDaysAnalysis(
  periodDays: PeriodDays,
  streakLength: ConsecutiveStreakLength,
): ConsecutiveDaysAggregateResult {
  const cached = getCachedConsecutiveDownDays(periodDays, streakLength);
  if (cached) {
    return cached;
  }

  const { bets } = loadAllBets();
  return analyzeConsecutiveDownDays(bets, periodDays, streakLength);
}
