import { addDays, startOfDay } from "date-fns";
import type { BetMarket } from "@/lib/models/types";
import { buildPriceWinRates } from "@/lib/analyses/shared";
import type {
  ConsecutiveDayDirection,
  ConsecutiveDaysAggregateResult,
  ConsecutiveDaysBetResult,
  ConsecutiveStreakLength,
  PeriodDays,
} from "@/lib/analyses/types";
import { computeBetOutcomes, getCloseDate } from "@/lib/engine/outcomes";
import { findConsecutiveDayMoveSignal } from "@/lib/engine/consecutive-days";
import { getDailyClosingPrices } from "@/lib/engine/timeline";

interface CandidateConsecutiveSignal {
  candidate: string;
  signal: NonNullable<ReturnType<typeof findConsecutiveDayMoveSignal>>;
}

function findFirstConsecutiveDaySignalInBet(
  bet: BetMarket,
  windowStart: Date,
  closeDate: Date,
  direction: ConsecutiveDayDirection,
  streakLength: ConsecutiveStreakLength,
): CandidateConsecutiveSignal | null {
  const dailyByCandidate = getDailyClosingPrices(bet);
  let earliest: CandidateConsecutiveSignal | null = null;

  for (const [candidate, dailyPrices] of dailyByCandidate.entries()) {
    const signal = findConsecutiveDayMoveSignal(
      dailyPrices,
      direction,
      streakLength,
      windowStart,
      closeDate,
    );

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

function analyzeBetConsecutiveDays(
  bet: BetMarket,
  periodDays: PeriodDays,
  direction: ConsecutiveDayDirection,
  streakLength: ConsecutiveStreakLength,
): ConsecutiveDaysBetResult {
  const outcomes = computeBetOutcomes(bet);
  const closeDate = getCloseDate(bet);
  const windowStart = addDays(startOfDay(closeDate), -periodDays);
  const hasEnoughHistory = bet.startDate.getTime() <= windowStart.getTime();
  const firstSignal = hasEnoughHistory
    ? findFirstConsecutiveDaySignalInBet(
        bet,
        windowStart,
        closeDate,
        direction,
        streakLength,
      )
    : null;

  const pickOutcome = firstSignal
    ? outcomes.candidates.find(
        (candidate) => candidate.name === firstSignal.candidate,
      )
    : null;

  return {
    betId: bet.id,
    betName: bet.name,
    closeDate,
    windowStart,
    periodDays,
    direction,
    streakLength,
    hasEnoughHistory,
    hasSignal: firstSignal != null,
    signalCandidate: firstSignal?.candidate ?? null,
    signalPrice: firstSignal?.signal.price ?? null,
    signalAt: firstSignal?.signal.day ?? null,
    pickFinalPlace: pickOutcome?.place ?? null,
    pickWon: firstSignal?.candidate === outcomes.winner,
    actualWinner: outcomes.winner,
  };
}

export function analyzeConsecutiveDays(
  bets: BetMarket[],
  periodDays: PeriodDays,
  direction: ConsecutiveDayDirection,
  streakLength: ConsecutiveStreakLength,
): ConsecutiveDaysAggregateResult {
  const betResults = bets.map((bet) =>
    analyzeBetConsecutiveDays(bet, periodDays, direction, streakLength),
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
    streakLength,
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

export function analyzeConsecutiveUpDays(
  bets: BetMarket[],
  periodDays: PeriodDays,
  streakLength: ConsecutiveStreakLength,
): ConsecutiveDaysAggregateResult {
  return analyzeConsecutiveDays(bets, periodDays, "up", streakLength);
}

export function analyzeConsecutiveDownDays(
  bets: BetMarket[],
  periodDays: PeriodDays,
  streakLength: ConsecutiveStreakLength,
): ConsecutiveDaysAggregateResult {
  return analyzeConsecutiveDays(bets, periodDays, "down", streakLength);
}
