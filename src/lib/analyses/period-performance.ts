import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import type { BetMarket } from "@/lib/models/types";
import { buildDipSlabWinRates, buildPriceWinRates, computeDipMetrics, getPriceBracketLabel } from "@/lib/analyses/shared";
import type {
  PeriodAggregateResult,
  PeriodBetResult,
  PeriodChartPoint,
  PeriodDays,
} from "@/lib/analyses/types";
import { computeBetOutcomes, getCloseDate } from "@/lib/engine/outcomes";
import { buildAlignedTimeline } from "@/lib/engine/timeline";

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
  const sorted = Object.entries(prices)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, price], index) => ({ name, price, rank: index + 1 }));

  return sorted;
}

function buildPeriodChartData(
  timeline: ReturnType<typeof buildAlignedTimeline>,
  checkDate: Date,
  closeDate: Date,
  winnerNames: Set<string>,
): PeriodChartPoint[] {
  const checkTime = startOfDay(checkDate).getTime();
  const windowSnapshots = timeline.filter(
    (snapshot) =>
      snapshot.loggedAt.getTime() >= checkTime &&
      snapshot.loggedAt.getTime() <= closeDate.getTime(),
  );

  return windowSnapshots.map((snapshot) => {
    const dayOffset = differenceInCalendarDays(
      startOfDay(snapshot.loggedAt),
      startOfDay(checkDate),
    );

    const winnerPrices: number[] = [];
    const otherPrices: number[] = [];

    for (const [name, price] of Object.entries(snapshot.prices)) {
      if (winnerNames.has(name)) {
        winnerPrices.push(price);
      } else {
        otherPrices.push(price);
      }
    }

    const point: PeriodChartPoint = {
      date: snapshot.loggedAt.toISOString(),
      dayOffset,
      winnerAvgPrice:
        winnerPrices.length > 0
          ? winnerPrices.reduce((sum, value) => sum + value, 0) /
            winnerPrices.length
          : null,
      otherAvgPrice:
        otherPrices.length > 0
          ? otherPrices.reduce((sum, value) => sum + value, 0) /
            otherPrices.length
          : null,
    };

    for (const [name, price] of Object.entries(snapshot.prices)) {
      point[name] = price;
    }

    return point;
  });
}

export function analyzeBetPeriod(
  bet: BetMarket,
  periodDays: PeriodDays,
): PeriodBetResult {
  const outcomes = computeBetOutcomes(bet);
  const closeDate = getCloseDate(bet);
  const checkDate = addDays(startOfDay(closeDate), -periodDays);
  const timeline = buildAlignedTimeline(bet);
  const hasEnoughHistory = bet.startDate.getTime() <= checkDate.getTime();
  const winnerNames = outcomes.winner ? [outcomes.winner] : [];

  const checkSnapshot = findSnapshotAtOrBefore(timeline, checkDate);
  const rankings = checkSnapshot ? rankAtSnapshot(checkSnapshot.prices) : [];
  const leader = rankings[0] ?? null;
  const leaderOutcome = leader
    ? outcomes.candidates.find((candidate) => candidate.name === leader.name)
    : null;

  const leaderStartSlab =
    leader?.price != null ? getPriceBracketLabel(leader.price) : null;
  const dipMetrics =
    hasEnoughHistory && leader
      ? computeDipMetrics(
          bet,
          leader.name,
          leader.price,
          checkDate,
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
    leaderRankAtCheck: leader?.rank ?? null,
    leaderFinalPlace: leaderOutcome?.place ?? null,
    leaderWon: leader?.name === outcomes.winner,
    actualWinner: outcomes.winner,
    winnerNames,
    periodChartData: hasEnoughHistory
      ? buildPeriodChartData(
          timeline,
          checkDate,
          closeDate,
          new Set(winnerNames),
        )
      : [],
    leaderStartSlab: dipMetrics.pickStartSlab ?? leaderStartSlab,
    dipSlabsTouched: dipMetrics.dipSlabsTouched,
    leaderMinPriceInWindow: dipMetrics.minPriceInWindow,
  };
}

function buildAggregateEvolution(
  betResults: PeriodBetResult[],
  periodDays: PeriodDays,
): { dayOffset: number; winnerAvg: number; otherAvg: number }[] {
  const byDay = new Map<number, { winners: number[]; others: number[] }>();

  for (const result of betResults) {
    if (!result.hasEnoughHistory) continue;

    for (const point of result.periodChartData) {
      const bucket = byDay.get(point.dayOffset) ?? { winners: [], others: [] };
      if (point.winnerAvgPrice != null) {
        bucket.winners.push(point.winnerAvgPrice);
      }
      if (point.otherAvgPrice != null) {
        bucket.others.push(point.otherAvgPrice);
      }
      byDay.set(point.dayOffset, bucket);
    }
  }

  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .filter(([dayOffset]) => dayOffset >= 0 && dayOffset <= periodDays)
    .map(([dayOffset, values]) => ({
      dayOffset,
      winnerAvg:
        values.winners.length > 0
          ? values.winners.reduce((sum, value) => sum + value, 0) /
            values.winners.length
          : 0,
      otherAvg:
        values.others.length > 0
          ? values.others.reduce((sum, value) => sum + value, 0) /
            values.others.length
          : 0,
    }));
}

export function analyzePeriodPerformance(
  bets: BetMarket[],
  periodDays: PeriodDays,
): PeriodAggregateResult {
  const betResults = bets.map((bet) => analyzeBetPeriod(bet, periodDays));
  const eligible = betResults.filter(
    (result) => result.hasEnoughHistory && result.leaderAtCheck,
  );

  const leadersWhoWon = eligible.filter((result) => result.leaderWon).length;
  const finalPlaces = eligible
    .map((result) => result.leaderFinalPlace)
    .filter((place): place is number => place != null);

  const placeDistribution: Record<number, number> = {};
  for (const place of finalPlaces) {
    placeDistribution[place] = (placeDistribution[place] ?? 0) + 1;
  }

  return {
    periodDays,
    totalBets: bets.length,
    eligibleBets: eligible.length,
    leadersWhoWon,
    winRate: eligible.length > 0 ? leadersWhoWon / eligible.length : 0,
    avgFinalPlace:
      finalPlaces.length > 0
        ? finalPlaces.reduce((sum, place) => sum + place, 0) / finalPlaces.length
        : null,
    placeDistribution,
    leaderPriceWinRates: buildPriceWinRates(
      eligible.map((result) => ({
        price: result.leaderPriceAtCheck,
        won: result.leaderWon,
      })),
    ),
    dipSlabWinRates: buildDipSlabWinRates(
      eligible.map((result) => ({
        startSlab: result.leaderStartSlab,
        dipSlabsTouched: result.dipSlabsTouched,
        won: result.leaderWon,
      })),
    ),
    aggregateEvolution: buildAggregateEvolution(betResults, periodDays),
    betResults,
  };
}
