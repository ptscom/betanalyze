import { addDays, startOfDay } from "date-fns";
import type { BetMarket } from "@/lib/models/types";
import {
  buildDipSlabWinRates,
  buildPriceWinRates,
  computeDipMetrics,
  getCandidateDailySeries,
  getPriceBracketLabel,
} from "@/lib/analyses/shared";
import type {
  PeriodDays,
  PostBigFallAggregateResult,
  PostBigFallBetResult,
} from "@/lib/analyses/types";
import { POST_BIG_FALL_THRESHOLD } from "@/lib/analyses/types";
import { computeBetOutcomes, getCloseDate } from "@/lib/engine/outcomes";
import { buildAlignedTimeline } from "@/lib/engine/timeline";

export const POST_BIG_FALL_MIN_DAYS = 1;
export const POST_BIG_FALL_MAX_DAYS = 2;

interface DailyPricePoint {
  day: Date;
  price: number;
}

interface BigFallHit {
  fallDays: 1 | 2;
  fallAt: Date;
  priceBefore: number;
  priceAfter: number;
  fallPct: number;
}

function findSnapshotAtOrBefore(
  timeline: ReturnType<typeof buildAlignedTimeline>,
  target: Date,
) {
  const targetTime = target.getTime();
  let match: (typeof timeline)[number] | null = null;

  for (const snapshot of timeline) {
    if (snapshot.loggedAt.getTime() <= targetTime) {
      match = snapshot;
    } else {
      break;
    }
  }

  return match ?? timeline[0] ?? null;
}

function rankAtSnapshot(
  prices: Record<string, number>,
): { name: string; price: number; rank: number }[] {
  return Object.entries(prices)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, price], index) => ({ name, price, rank: index + 1 }));
}

function findFirstBigFall(
  dailySeries: DailyPricePoint[],
  threshold: number,
): BigFallHit | null {
  for (let index = 1; index < dailySeries.length; index++) {
    const previous = dailySeries[index - 1];
    const current = dailySeries[index];

    if (previous.price > 0) {
      const oneDayFall = (previous.price - current.price) / previous.price;
      if (oneDayFall >= threshold) {
        return {
          fallDays: 1,
          fallAt: current.day,
          priceBefore: previous.price,
          priceAfter: current.price,
          fallPct: oneDayFall,
        };
      }
    }

    if (index >= 2) {
      const twoDaysAgo = dailySeries[index - 2];
      if (twoDaysAgo.price > 0) {
        const twoDayFall =
          (twoDaysAgo.price - current.price) / twoDaysAgo.price;
        if (twoDayFall >= threshold) {
          return {
            fallDays: 2,
            fallAt: current.day,
            priceBefore: twoDaysAgo.price,
            priceAfter: current.price,
            fallPct: twoDayFall,
          };
        }
      }
    }
  }

  return null;
}

export function analyzeBetPostBigFall(
  bet: BetMarket,
  periodDays: PeriodDays,
): PostBigFallBetResult {
  const outcomes = computeBetOutcomes(bet);
  const closeDate = getCloseDate(bet);
  const checkDate = addDays(startOfDay(closeDate), -periodDays);
  const timeline = buildAlignedTimeline(bet);
  const hasEnoughHistory = bet.startDate.getTime() <= checkDate.getTime();

  const checkSnapshot = findSnapshotAtOrBefore(timeline, checkDate);
  const rankings = checkSnapshot ? rankAtSnapshot(checkSnapshot.prices) : [];
  const leader = rankings[0] ?? null;
  const leaderOutcome = leader
    ? outcomes.candidates.find((candidate) => candidate.name === leader.name)
    : null;

  const dailySeries =
    hasEnoughHistory && leader
      ? getCandidateDailySeries(
          bet,
          leader.name,
          leader.price,
          checkDate,
          closeDate,
        )
      : [];

  const bigFall = findFirstBigFall(dailySeries, POST_BIG_FALL_THRESHOLD);

  const dipMetrics =
    bigFall && leader
      ? computeDipMetrics(
          bet,
          leader.name,
          bigFall.priceAfter,
          bigFall.fallAt,
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
    checkDate,
    periodDays,
    hasEnoughHistory,
    leaderAtCheck: leader?.name ?? null,
    leaderPriceAtCheck: leader?.price ?? null,
    leaderStartSlab:
      leader?.price != null ? getPriceBracketLabel(leader.price) : null,
    hasBigFall: bigFall != null,
    fallDays: bigFall?.fallDays ?? null,
    fallAt: bigFall?.fallAt ?? null,
    priceBeforeFall: bigFall?.priceBefore ?? null,
    priceAfterFall: bigFall?.priceAfter ?? null,
    fallPct: bigFall?.fallPct ?? null,
    leaderFinalPlace: leaderOutcome?.place ?? null,
    leaderWon: leader?.name === outcomes.winner,
    actualWinner: outcomes.winner,
    pickStartSlab: dipMetrics.pickStartSlab,
    dipSlabsTouched: dipMetrics.dipSlabsTouched,
    minPriceInWindow: dipMetrics.minPriceInWindow,
  };
}

export function analyzePostBigFall(
  bets: BetMarket[],
  periodDays: PeriodDays,
): PostBigFallAggregateResult {
  const betResults = bets.map((bet) => analyzeBetPostBigFall(bet, periodDays));
  const eligible = betResults.filter(
    (result) =>
      result.hasEnoughHistory && result.leaderAtCheck && result.hasBigFall,
  );

  const leadersWhoWon = eligible.filter((result) => result.leaderWon).length;
  const finalPlaces = eligible
    .map((result) => result.leaderFinalPlace)
    .filter((place): place is number => place != null);

  const placeDistribution: Record<number, number> = {};
  for (const place of finalPlaces) {
    placeDistribution[place] = (placeDistribution[place] ?? 0) + 1;
  }

  const oneDayFalls = eligible.filter((result) => result.fallDays === 1).length;
  const twoDayFalls = eligible.filter((result) => result.fallDays === 2).length;

  return {
    periodDays,
    threshold: POST_BIG_FALL_THRESHOLD,
    totalBets: bets.length,
    eligibleBets: eligible.length,
    leadersWhoWon,
    winRate: eligible.length > 0 ? leadersWhoWon / eligible.length : 0,
    oneDayFalls,
    twoDayFalls,
    placeDistribution,
    priceAfterFallWinRates: buildPriceWinRates(
      eligible.map((result) => ({
        price: result.priceAfterFall,
        won: result.leaderWon,
      })),
    ),
    dipSlabWinRates: buildDipSlabWinRates(
      eligible.map((result) => ({
        startSlab: result.pickStartSlab,
        dipSlabsTouched: result.dipSlabsTouched,
        won: result.leaderWon,
      })),
    ),
    betResults,
  };
}
