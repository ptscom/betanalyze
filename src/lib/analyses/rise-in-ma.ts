import { addDays, startOfDay } from "date-fns";
import type { BetMarket } from "@/lib/models/types";
import { buildDipSlabWinRates, buildPriceWinRates, computeDipMetrics } from "@/lib/analyses/shared";
import type {
  PeriodDays,
  RiseInMaAggregateResult,
  RiseInMaBetResult,
} from "@/lib/analyses/types";
import { computeBetOutcomes, getCloseDate } from "@/lib/engine/outcomes";
import { findMaRiseSignal } from "@/lib/engine/moving-average";
import { getDailyClosingPrices } from "@/lib/engine/timeline";

const MA_WINDOW_DAYS = 5;
const CONSECUTIVE_MA_INCREASES = 2;

interface CandidateMaSignal {
  candidate: string;
  signal: NonNullable<ReturnType<typeof findMaRiseSignal>>;
}

function findFirstMaRiseInBet(
  bet: BetMarket,
  windowStart: Date,
  closeDate: Date,
): CandidateMaSignal | null {
  const dailyByCandidate = getDailyClosingPrices(bet);
  let earliest: CandidateMaSignal | null = null;

  for (const [candidate, dailyPrices] of dailyByCandidate.entries()) {
    const signal = findMaRiseSignal(dailyPrices, {
      windowSize: MA_WINDOW_DAYS,
      consecutiveIncreases: CONSECUTIVE_MA_INCREASES,
      windowStart,
      closeDate,
    });

    if (!signal) continue;

    if (
      !earliest ||
      signal.day.getTime() < earliest.signal.day.getTime() ||
      (signal.day.getTime() === earliest.signal.day.getTime() &&
        candidate.localeCompare(earliest.candidate) < 0)
    ) {
      earliest = { candidate, signal };
    }
  }

  return earliest;
}

export function analyzeBetRiseInMa(
  bet: BetMarket,
  periodDays: PeriodDays,
): RiseInMaBetResult {
  const outcomes = computeBetOutcomes(bet);
  const closeDate = getCloseDate(bet);
  const windowStart = addDays(startOfDay(closeDate), -periodDays);
  const hasEnoughHistory = bet.startDate.getTime() <= windowStart.getTime();
  const firstSignal = hasEnoughHistory
    ? findFirstMaRiseInBet(bet, windowStart, closeDate)
    : null;

  const pickOutcome = firstSignal
    ? outcomes.candidates.find(
        (candidate) => candidate.name === firstSignal.candidate,
      )
    : null;

  const dipMetrics =
    firstSignal?.signal.price != null && firstSignal.signal.day
      ? computeDipMetrics(
          bet,
          firstSignal.candidate,
          firstSignal.signal.price,
          firstSignal.signal.day,
          closeDate,
        )
      : {
          pickStartSlab: null,
          dipSlabsTouched: [] as string[],
          minPriceInWindow: null,
        };

  return {
    betId: bet.id,
    betName: bet.name,
    closeDate,
    windowStart,
    periodDays,
    hasEnoughHistory,
    hasSignal: firstSignal != null,
    signalCandidate: firstSignal?.candidate ?? null,
    signalPrice: firstSignal?.signal.price ?? null,
    signalMa: firstSignal?.signal.movingAverage ?? null,
    signalAt: firstSignal?.signal.day ?? null,
    pickFinalPlace: pickOutcome?.place ?? null,
    pickWon: firstSignal?.candidate === outcomes.winner,
    actualWinner: outcomes.winner,
    pickStartSlab: dipMetrics.pickStartSlab,
    dipSlabsTouched: dipMetrics.dipSlabsTouched,
    minPriceInWindow: dipMetrics.minPriceInWindow,
  };
}

export function analyzeRiseInMa(
  bets: BetMarket[],
  periodDays: PeriodDays,
): RiseInMaAggregateResult {
  const betResults = bets.map((bet) => analyzeBetRiseInMa(bet, periodDays));
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
    dipSlabWinRates: buildDipSlabWinRates(
      eligible.map((result) => ({
        startSlab: result.pickStartSlab,
        dipSlabsTouched: result.dipSlabsTouched,
        won: result.pickWon,
      })),
    ),
    betResults,
  };
}

export const RISE_IN_MA_CONFIG = {
  maWindowDays: MA_WINDOW_DAYS,
  consecutiveIncreases: CONSECUTIVE_MA_INCREASES,
};
