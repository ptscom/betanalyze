import { addDays, startOfDay } from "date-fns";
import type { BetMarket } from "@/lib/models/types";
import { buildPriceWinRates } from "@/lib/analyses/shared";
import type {
  PeriodDays,
  ReversalOccurrenceAggregateResult,
  ReversalOccurrenceBetResult,
  ReversalThreshold,
} from "@/lib/analyses/types";
import { computeBetOutcomes, getCloseDate } from "@/lib/engine/outcomes";
import { getDailyClosingPrices } from "@/lib/engine/timeline";

interface ThresholdHit {
  candidate: string;
  day: Date;
  price: number;
}

function findFirstThresholdHitForCandidate(
  dailyPrices: Map<string, number>,
  windowStart: Date,
  closeDate: Date,
  threshold: number,
): { day: Date; price: number } | null {
  const windowStartTime = startOfDay(windowStart).getTime();
  const closeTime = closeDate.getTime();

  const sortedDays = [...dailyPrices.entries()]
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .filter(([dayKey]) => {
      const time = new Date(dayKey).getTime();
      return time >= windowStartTime && time <= closeTime;
    });

  for (const [dayKey, price] of sortedDays) {
    if (price > threshold) {
      return { day: new Date(dayKey), price };
    }
  }

  return null;
}

function findFirstThresholdHitInBet(
  bet: BetMarket,
  windowStart: Date,
  closeDate: Date,
  threshold: number,
): ThresholdHit | null {
  const dailyByCandidate = getDailyClosingPrices(bet);
  let earliest: ThresholdHit | null = null;

  for (const [candidate, dailyPrices] of dailyByCandidate.entries()) {
    const hit = findFirstThresholdHitForCandidate(
      dailyPrices,
      windowStart,
      closeDate,
      threshold,
    );

    if (!hit) continue;

    if (
      !earliest ||
      hit.day.getTime() < earliest.day.getTime() ||
      (hit.day.getTime() === earliest.day.getTime() &&
        candidate.localeCompare(earliest.candidate) < 0)
    ) {
      earliest = { candidate, day: hit.day, price: hit.price };
    }
  }

  return earliest;
}

export function analyzeBetReversalOccurrence(
  bet: BetMarket,
  periodDays: PeriodDays,
  threshold: ReversalThreshold,
): ReversalOccurrenceBetResult {
  const outcomes = computeBetOutcomes(bet);
  const closeDate = getCloseDate(bet);
  const windowStart = addDays(startOfDay(closeDate), -periodDays);
  const hasEnoughHistory = bet.startDate.getTime() <= windowStart.getTime();
  const firstHit = hasEnoughHistory
    ? findFirstThresholdHitInBet(bet, windowStart, closeDate, threshold)
    : null;

  const pickOutcome = firstHit
    ? outcomes.candidates.find(
        (candidate) => candidate.name === firstHit.candidate,
      )
    : null;

  const heldOn = firstHit?.candidate === outcomes.winner;

  return {
    betId: bet.id,
    betName: bet.name,
    closeDate,
    windowStart,
    periodDays,
    threshold,
    hasEnoughHistory,
    hasHit: firstHit != null,
    hitCandidate: firstHit?.candidate ?? null,
    hitPrice: firstHit?.price ?? null,
    hitAt: firstHit?.day ?? null,
    reversed: firstHit != null && !heldOn,
    pickFinalPlace: pickOutcome?.place ?? null,
    heldOn,
    actualWinner: outcomes.winner,
  };
}

export function analyzeReversalOccurrence(
  bets: BetMarket[],
  periodDays: PeriodDays,
  threshold: ReversalThreshold,
): ReversalOccurrenceAggregateResult {
  const betResults = bets.map((bet) =>
    analyzeBetReversalOccurrence(bet, periodDays, threshold),
  );
  const eligible = betResults.filter(
    (result) => result.hasEnoughHistory && result.hasHit,
  );

  const reversals = eligible.filter((result) => result.reversed).length;
  const heldOnCount = eligible.filter((result) => result.heldOn).length;
  const finalPlaces = eligible
    .map((result) => result.pickFinalPlace)
    .filter((place): place is number => place != null);

  const placeDistribution: Record<number, number> = {};
  for (const place of finalPlaces) {
    placeDistribution[place] = (placeDistribution[place] ?? 0) + 1;
  }

  return {
    periodDays,
    threshold,
    totalBets: bets.length,
    eligibleBets: eligible.length,
    reversals,
    reversalRate: eligible.length > 0 ? reversals / eligible.length : 0,
    heldOnCount,
    holdRate: eligible.length > 0 ? heldOnCount / eligible.length : 0,
    placeDistribution,
    hitPriceOutcomes: buildPriceWinRates(
      eligible.map((result) => ({
        price: result.hitPrice,
        won: result.heldOn,
      })),
    ),
    betResults,
  };
}
