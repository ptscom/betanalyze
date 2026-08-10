import { addDays, startOfDay } from "date-fns";
import type { BetMarket } from "@/lib/models/types";
import { buildDipSlabWinRates, buildPriceWinRates, computeDipMetrics } from "@/lib/analyses/shared";
import type {
  ReversalAggregateResult,
  ReversalCandidateResult,
  ReversalPeriodDays,
} from "@/lib/analyses/types";
import { REVERSAL_THRESHOLD } from "@/lib/analyses/types";
import { computeBetOutcomes, getCloseDate } from "@/lib/engine/outcomes";
import { getDailyClosingPrices } from "@/lib/engine/timeline";

interface CandidateThresholdHit {
  firstHitAt: Date;
  priceAtFirstHit: number;
  peakPriceInWindow: number;
}

function findCandidateThresholdHit(
  dailyPrices: Map<string, number>,
  windowStart: Date,
  closeDate: Date,
  threshold: number,
): CandidateThresholdHit | null {
  const windowStartTime = startOfDay(windowStart).getTime();
  const closeTime = closeDate.getTime();

  let firstHitAt: Date | null = null;
  let priceAtFirstHit: number | null = null;
  let peakPriceInWindow = 0;

  for (const [dayKey, price] of dailyPrices.entries()) {
    const dayTime = new Date(dayKey).getTime();
    if (dayTime < windowStartTime || dayTime > closeTime) {
      continue;
    }

    if (price > peakPriceInWindow) {
      peakPriceInWindow = price;
    }

    if (price >= threshold && !firstHitAt) {
      firstHitAt = new Date(dayKey);
      priceAtFirstHit = price;
    }
  }

  if (!firstHitAt || priceAtFirstHit == null) {
    return null;
  }

  return { firstHitAt, priceAtFirstHit, peakPriceInWindow };
}

export function analyzeBetReversal(
  bet: BetMarket,
  periodDays: ReversalPeriodDays,
): ReversalCandidateResult[] {
  const outcomes = computeBetOutcomes(bet);
  const closeDate = getCloseDate(bet);
  const windowStart = addDays(startOfDay(closeDate), -periodDays);
  const hasEnoughHistory = bet.startDate.getTime() <= windowStart.getTime();
  const dailyByCandidate = getDailyClosingPrices(bet);
  const results: ReversalCandidateResult[] = [];

  if (!hasEnoughHistory) {
    return results;
  }

  for (const [candidate, dailyPrices] of dailyByCandidate.entries()) {
    const hit = findCandidateThresholdHit(
      dailyPrices,
      windowStart,
      closeDate,
      REVERSAL_THRESHOLD,
    );

    if (!hit) {
      continue;
    }

    const pickOutcome = outcomes.candidates.find(
      (outcome) => outcome.name === candidate,
    );
    const heldOn = candidate === outcomes.winner;
    const dipMetrics = computeDipMetrics(
      bet,
      candidate,
      hit.priceAtFirstHit,
      hit.firstHitAt,
      closeDate,
    );

    results.push({
      betId: bet.id,
      betName: bet.name,
      closeDate,
      windowStart,
      periodDays,
      candidate,
      firstHitAt: hit.firstHitAt,
      peakPriceInWindow: hit.peakPriceInWindow,
      finalPlace: pickOutcome?.place ?? null,
      reversed: !heldOn,
      heldOn,
      actualWinner: outcomes.winner,
      priceAtFirstHit: hit.priceAtFirstHit,
      pickStartSlab: dipMetrics.pickStartSlab,
      dipSlabsTouched: dipMetrics.dipSlabsTouched,
      minPriceInWindow: dipMetrics.minPriceInWindow,
    });
  }

  return results;
}

export function analyzeReversal(
  bets: BetMarket[],
  periodDays: ReversalPeriodDays,
): ReversalAggregateResult {
  const candidateResults = bets.flatMap((bet) =>
    analyzeBetReversal(bet, periodDays),
  );

  const reversals = candidateResults.filter((result) => result.reversed).length;
  const heldOnCount = candidateResults.filter((result) => result.heldOn).length;
  const betsWithHits = new Set(candidateResults.map((result) => result.betId))
    .size;

  const reversedPlaces = candidateResults
    .filter((result) => result.reversed)
    .map((result) => result.finalPlace)
    .filter((place): place is number => place != null);

  const placeDistribution: Record<number, number> = {};
  for (const place of reversedPlaces) {
    placeDistribution[place] = (placeDistribution[place] ?? 0) + 1;
  }

  return {
    periodDays,
    threshold: REVERSAL_THRESHOLD,
    totalBets: bets.length,
    betsWithHits,
    eligibleCandidates: candidateResults.length,
    reversals,
    reversalRate:
      candidateResults.length > 0 ? reversals / candidateResults.length : 0,
    heldOnCount,
    holdRate:
      candidateResults.length > 0 ? heldOnCount / candidateResults.length : 0,
    placeDistribution,
    peakPriceOutcomes: buildPriceWinRates(
      candidateResults.map((result) => ({
        price: result.peakPriceInWindow,
        won: result.heldOn,
      })),
    ),
    dipSlabWinRates: buildDipSlabWinRates(
      candidateResults.map((result) => ({
        startSlab: result.pickStartSlab,
        dipSlabsTouched: result.dipSlabsTouched,
        won: result.heldOn,
      })),
    ),
    candidateResults,
  };
}
