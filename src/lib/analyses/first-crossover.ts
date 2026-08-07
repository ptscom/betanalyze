import { addDays, startOfDay } from "date-fns";
import type { BetMarket } from "@/lib/models/types";
import { buildPriceWinRates } from "@/lib/analyses/shared";
import type {
  FirstCrossoverAggregateResult,
  FirstCrossoverBetResult,
  PeriodDays,
} from "@/lib/analyses/types";
import { computeBetOutcomes, getCloseDate } from "@/lib/engine/outcomes";
import { findFirstCrossoverInWindow } from "@/lib/engine/crossover";
import { buildAlignedTimeline } from "@/lib/engine/timeline";

export function analyzeBetFirstCrossover(
  bet: BetMarket,
  periodDays: PeriodDays,
): FirstCrossoverBetResult {
  const outcomes = computeBetOutcomes(bet);
  const closeDate = getCloseDate(bet);
  const windowStart = addDays(startOfDay(closeDate), -periodDays);
  const timeline = buildAlignedTimeline(bet);
  const hasEnoughHistory = bet.startDate.getTime() <= windowStart.getTime();
  const crossover = hasEnoughHistory
    ? findFirstCrossoverInWindow(timeline, windowStart, closeDate)
    : null;

  const pickOutcome = crossover
    ? outcomes.candidates.find(
        (candidate) => candidate.name === crossover.newTopper,
      )
    : null;

  return {
    betId: bet.id,
    betName: bet.name,
    closeDate,
    windowStart,
    periodDays,
    hasEnoughHistory,
    hasCrossover: crossover != null,
    crossoverCandidate: crossover?.newTopper ?? null,
    crossoverPrice: crossover?.newTopperPrice ?? null,
    crossoverAt: crossover?.loggedAt ?? null,
    previousLeader: crossover?.previousTopper ?? null,
    previousLeaderPrice: crossover?.previousTopperPrice ?? null,
    pickFinalPlace: pickOutcome?.place ?? null,
    pickWon: crossover?.newTopper === outcomes.winner,
    actualWinner: outcomes.winner,
  };
}

export function analyzeFirstCrossover(
  bets: BetMarket[],
  periodDays: PeriodDays,
): FirstCrossoverAggregateResult {
  const betResults = bets.map((bet) => analyzeBetFirstCrossover(bet, periodDays));
  const eligible = betResults.filter(
    (result) => result.hasEnoughHistory && result.hasCrossover,
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
    periodDays,
    totalBets: bets.length,
    eligibleBets: eligible.length,
    picksWhoWon,
    winRate: eligible.length > 0 ? picksWhoWon / eligible.length : 0,
    placeDistribution,
    pickPriceWinRates: buildPriceWinRates(
      eligible.map((result) => ({
        price: result.crossoverPrice,
        won: result.pickWon,
      })),
    ),
    betResults,
  };
}
