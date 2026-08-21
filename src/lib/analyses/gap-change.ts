import { addDays, startOfDay } from "date-fns";
import type { BetMarket } from "@/lib/models/types";
import { buildPriceWinRates } from "@/lib/analyses/shared";
import type {
  GapChangeAggregateResult,
  GapChangeBetResult,
  GapChangeDirection,
  PeriodDays,
} from "@/lib/analyses/types";
import { computeBetOutcomes, getCloseDate } from "@/lib/engine/outcomes";
import {
  buildDailyLeaderGaps,
  findGapChangeSignal,
} from "@/lib/engine/gap";
import type { GapChangeSignal } from "@/lib/engine/gap";

const CONSECUTIVE_GAP_CHANGES = 2;

function analyzeBetGapChange(
  bet: BetMarket,
  periodDays: PeriodDays,
  direction: GapChangeDirection,
): GapChangeBetResult {
  const outcomes = computeBetOutcomes(bet);
  const closeDate = getCloseDate(bet);
  const windowStart = addDays(startOfDay(closeDate), -periodDays);
  const hasEnoughHistory = bet.startDate.getTime() <= windowStart.getTime();

  const dailyGaps = hasEnoughHistory
    ? buildDailyLeaderGaps(bet, windowStart, closeDate)
    : [];

  const signal: GapChangeSignal | null = hasEnoughHistory
    ? findGapChangeSignal(
        dailyGaps,
        direction,
        CONSECUTIVE_GAP_CHANGES,
        windowStart,
        closeDate,
      )
    : null;

  const pickOutcome = signal
    ? outcomes.candidates.find(
        (candidate) => candidate.name === signal.pickCandidate,
      )
    : null;

  return {
    betId: bet.id,
    betName: bet.name,
    closeDate,
    windowStart,
    periodDays,
    direction,
    hasEnoughHistory,
    hasSignal: signal != null,
    signalCandidate: signal?.pickCandidate ?? null,
    signalPrice: signal?.pickPrice ?? null,
    signalGap: signal?.gap ?? null,
    leaderAtSignal: signal?.leader ?? null,
    leaderPriceAtSignal: signal?.leaderPrice ?? null,
    secondAtSignal: signal?.second ?? null,
    secondPriceAtSignal: signal?.secondPrice ?? null,
    signalAt: signal?.day ?? null,
    pickFinalPlace: pickOutcome?.place ?? null,
    pickWon: signal?.pickCandidate === outcomes.winner,
    actualWinner: outcomes.winner,
  };
}

export function analyzeGapChange(
  bets: BetMarket[],
  periodDays: PeriodDays,
  direction: GapChangeDirection,
): GapChangeAggregateResult {
  const betResults = bets.map((bet) =>
    analyzeBetGapChange(bet, periodDays, direction),
  );
  const eligible = betResults.filter(
    (result) => result.hasEnoughHistory && result.hasSignal,
  );

  const picksWhoWon = eligible.filter((result) => result.pickWon).length;
  const finalPlaces = eligible
    .map((result) => result.pickFinalPlace)
    .filter((place): place is number => place != null);

  const placeDistribution: Record<number, number> = {};
  for (const place of finalPlaces) {
    placeDistribution[place] = (placeDistribution[place] ?? 0) + 1;
  }

  return {
    direction,
    periodDays,
    totalBets: bets.length,
    eligibleBets: eligible.length,
    picksWhoWon,
    winRate: eligible.length > 0 ? picksWhoWon / eligible.length : 0,
    placeDistribution,
    pickPriceWinRates: buildPriceWinRates(
      eligible.map((result) => ({
        price: result.signalPrice,
        won: result.pickWon,
      })),
    ),
    betResults,
  };
}

export function analyzeGapDecrease(
  bets: BetMarket[],
  periodDays: PeriodDays,
): GapChangeAggregateResult {
  return analyzeGapChange(bets, periodDays, "decrease");
}

export function analyzeGapIncrease(
  bets: BetMarket[],
  periodDays: PeriodDays,
): GapChangeAggregateResult {
  return analyzeGapChange(bets, periodDays, "increase");
}

export const GAP_CHANGE_CONFIG = {
  consecutiveChanges: CONSECUTIVE_GAP_CHANGES,
};
