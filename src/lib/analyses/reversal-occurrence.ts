import { addDays, startOfDay } from "date-fns";
import type { BetMarket } from "@/lib/models/types";
import type {
  PeriodDays,
  ReversalOccurrenceAggregateResult,
  ReversalOccurrenceBetResult,
  ReversalSlabWinRate,
} from "@/lib/analyses/types";
import {
  getReversalOccurrenceSlabLabel,
  REVERSAL_OCCURRENCE_MIN_PRICE,
  REVERSAL_OCCURRENCE_SLABS,
} from "@/lib/analyses/types";
import { computeBetOutcomes, getCloseDate } from "@/lib/engine/outcomes";
import { getDailyClosingPrices } from "@/lib/engine/timeline";

interface MinPriceHit {
  candidate: string;
  day: Date;
  price: number;
}

function findFirstMinPriceHitForCandidate(
  dailyPrices: Map<string, number>,
  windowStart: Date,
  closeDate: Date,
  minPrice: number,
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
    if (price >= minPrice) {
      return { day: new Date(dayKey), price };
    }
  }

  return null;
}

function findFirstMinPriceHitInBet(
  bet: BetMarket,
  windowStart: Date,
  closeDate: Date,
  minPrice: number,
): MinPriceHit | null {
  const dailyByCandidate = getDailyClosingPrices(bet);
  let earliest: MinPriceHit | null = null;

  for (const [candidate, dailyPrices] of dailyByCandidate.entries()) {
    const hit = findFirstMinPriceHitForCandidate(
      dailyPrices,
      windowStart,
      closeDate,
      minPrice,
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

function buildReversalSlabRates(
  eligible: ReversalOccurrenceBetResult[],
): ReversalSlabWinRate[] {
  return REVERSAL_OCCURRENCE_SLABS.map((slab) => {
    const inSlab = eligible.filter((result) => result.hitSlab === slab.label);
    const heldOnCount = inSlab.filter((result) => result.heldOn).length;
    const reversals = inSlab.filter((result) => result.reversed).length;

    return {
      label: slab.label,
      min: slab.min,
      max: slab.max,
      total: inSlab.length,
      reversals,
      reversalRate: inSlab.length > 0 ? reversals / inSlab.length : 0,
      heldOnCount,
      holdRate: inSlab.length > 0 ? heldOnCount / inSlab.length : 0,
    };
  });
}

export function analyzeBetReversalOccurrence(
  bet: BetMarket,
  periodDays: PeriodDays,
): ReversalOccurrenceBetResult {
  const outcomes = computeBetOutcomes(bet);
  const closeDate = getCloseDate(bet);
  const windowStart = addDays(startOfDay(closeDate), -periodDays);
  const hasEnoughHistory = bet.startDate.getTime() <= windowStart.getTime();
  const firstHit = hasEnoughHistory
    ? findFirstMinPriceHitInBet(
        bet,
        windowStart,
        closeDate,
        REVERSAL_OCCURRENCE_MIN_PRICE,
      )
    : null;

  const pickOutcome = firstHit
    ? outcomes.candidates.find(
        (candidate) => candidate.name === firstHit.candidate,
      )
    : null;

  const heldOn = firstHit?.candidate === outcomes.winner;
  const hitPrice = firstHit?.price ?? null;

  return {
    betId: bet.id,
    betName: bet.name,
    closeDate,
    windowStart,
    periodDays,
    hasEnoughHistory,
    hasHit: firstHit != null,
    hitCandidate: firstHit?.candidate ?? null,
    hitPrice,
    hitSlab: hitPrice != null ? getReversalOccurrenceSlabLabel(hitPrice) : null,
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
): ReversalOccurrenceAggregateResult {
  const betResults = bets.map((bet) =>
    analyzeBetReversalOccurrence(bet, periodDays),
  );
  const eligible = betResults.filter(
    (result) => result.hasEnoughHistory && result.hasHit,
  );

  const reversals = eligible.filter((result) => result.reversed).length;
  const heldOnCount = eligible.filter((result) => result.heldOn).length;

  return {
    periodDays,
    minEntryPrice: REVERSAL_OCCURRENCE_MIN_PRICE,
    totalBets: bets.length,
    eligibleBets: eligible.length,
    reversals,
    reversalRate: eligible.length > 0 ? reversals / eligible.length : 0,
    heldOnCount,
    holdRate: eligible.length > 0 ? heldOnCount / eligible.length : 0,
    slabWinRates: buildReversalSlabRates(eligible),
    betResults,
  };
}
