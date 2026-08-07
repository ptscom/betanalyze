import { addDays, startOfDay } from "date-fns";
import type { BetMarket } from "@/lib/models/types";
import { buildPriceWinRates } from "@/lib/analyses/shared";
import type {
  JumpThreshold,
  PeriodDays,
  SingleDayJumpAggregateResult,
  SingleDayJumpBetResult,
} from "@/lib/analyses/types";
import { computeBetOutcomes, getCloseDate } from "@/lib/engine/outcomes";
import { getDailyClosingPrices } from "@/lib/engine/timeline";

interface JumpHit {
  candidate: string;
  day: Date;
  priceBefore: number;
  priceAfter: number;
  jumpPct: number;
}

function findFirstJumpForCandidate(
  dailyPrices: Map<string, number>,
  windowStart: Date,
  closeDate: Date,
  threshold: number,
): JumpHit | null {
  const windowStartTime = startOfDay(windowStart).getTime();
  const closeTime = closeDate.getTime();

  const sortedDays = [...dailyPrices.entries()].sort(
    (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime(),
  );

  for (let index = 1; index < sortedDays.length; index++) {
    const [dayKey, priceAfter] = sortedDays[index];
    const dayTime = new Date(dayKey).getTime();

    if (dayTime < windowStartTime || dayTime > closeTime) {
      continue;
    }

    const [, priceBefore] = sortedDays[index - 1];
    if (priceBefore <= 0) {
      continue;
    }

    const jumpPct = (priceAfter - priceBefore) / priceBefore;
    if (jumpPct >= threshold) {
      return {
        candidate: "",
        day: new Date(dayKey),
        priceBefore,
        priceAfter,
        jumpPct,
      };
    }
  }

  return null;
}

function findFirstJumpInBet(
  bet: BetMarket,
  windowStart: Date,
  closeDate: Date,
  threshold: number,
): JumpHit | null {
  const dailyByCandidate = getDailyClosingPrices(bet);
  let earliest: JumpHit | null = null;

  for (const [candidate, dailyPrices] of dailyByCandidate.entries()) {
    const hit = findFirstJumpForCandidate(
      dailyPrices,
      windowStart,
      closeDate,
      threshold,
    );

    if (!hit) continue;

    const candidateHit = { ...hit, candidate };

    if (
      !earliest ||
      candidateHit.day.getTime() < earliest.day.getTime() ||
      (candidateHit.day.getTime() === earliest.day.getTime() &&
        candidate.localeCompare(earliest.candidate) < 0)
    ) {
      earliest = candidateHit;
    }
  }

  return earliest;
}

export function analyzeBetSingleDayJump(
  bet: BetMarket,
  periodDays: PeriodDays,
  threshold: JumpThreshold,
): SingleDayJumpBetResult {
  const outcomes = computeBetOutcomes(bet);
  const closeDate = getCloseDate(bet);
  const windowStart = addDays(startOfDay(closeDate), -periodDays);
  const hasEnoughHistory = bet.startDate.getTime() <= windowStart.getTime();
  const firstJump = hasEnoughHistory
    ? findFirstJumpInBet(bet, windowStart, closeDate, threshold)
    : null;

  const pickOutcome = firstJump
    ? outcomes.candidates.find(
        (candidate) => candidate.name === firstJump.candidate,
      )
    : null;

  return {
    betId: bet.id,
    betName: bet.name,
    closeDate,
    windowStart,
    periodDays,
    threshold,
    hasEnoughHistory,
    hasJump: firstJump != null,
    jumpCandidate: firstJump?.candidate ?? null,
    jumpAt: firstJump?.day ?? null,
    priceBefore: firstJump?.priceBefore ?? null,
    priceAfter: firstJump?.priceAfter ?? null,
    jumpPct: firstJump?.jumpPct ?? null,
    pickFinalPlace: pickOutcome?.place ?? null,
    pickWon: firstJump?.candidate === outcomes.winner,
    actualWinner: outcomes.winner,
  };
}

export function analyzeSingleDayJump(
  bets: BetMarket[],
  periodDays: PeriodDays,
  threshold: JumpThreshold,
): SingleDayJumpAggregateResult {
  const betResults = bets.map((bet) =>
    analyzeBetSingleDayJump(bet, periodDays, threshold),
  );
  const eligible = betResults.filter(
    (result) => result.hasEnoughHistory && result.hasJump,
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
    threshold,
    totalBets: bets.length,
    eligibleBets: eligible.length,
    picksWhoWon,
    winRate: eligible.length > 0 ? picksWhoWon / eligible.length : 0,
    placeDistribution,
    pickPriceWinRates: buildPriceWinRates(
      eligible.map((result) => ({
        price: result.priceAfter,
        won: result.pickWon,
      })),
    ),
    betResults,
  };
}
