import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import type { BetMarket } from "@/lib/models/types";
import { computeBetOutcomes } from "@/lib/engine/outcomes";
import { buildAlignedTimeline } from "@/lib/engine/timeline";
import type {
  PeriodAggregateResult,
  PeriodBetResult,
  PeriodChartPoint,
  PeriodDays,
  PriceBracketBucket,
} from "@/lib/analyses/types";

const PRICE_BRACKETS = [
  { label: "$0.00–0.10", min: 0, max: 0.1 },
  { label: "$0.10–0.20", min: 0.1, max: 0.2 },
  { label: "$0.20–0.30", min: 0.2, max: 0.3 },
  { label: "$0.30–0.40", min: 0.3, max: 0.4 },
  { label: "$0.40–0.50", min: 0.4, max: 0.5 },
  { label: "$0.50–0.60", min: 0.5, max: 0.6 },
  { label: "$0.60–0.70", min: 0.6, max: 0.7 },
  { label: "$0.70–0.80", min: 0.7, max: 0.8 },
  { label: "$0.80–0.90", min: 0.8, max: 0.9 },
  { label: "$0.90+", min: 0.9, max: 1.01 },
];

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
  const closeDate = bet.endDate;
  const checkDate = addDays(startOfDay(closeDate), -periodDays);
  const timeline = buildAlignedTimeline(bet);
  const hasEnoughHistory = bet.startDate.getTime() <= checkDate.getTime();
  const winnerNames = outcomes.candidates
    .filter((candidate) => candidate.isWinner)
    .map((candidate) => candidate.name);

  const checkSnapshot = findSnapshotAtOrBefore(timeline, checkDate);
  const rankings = checkSnapshot ? rankAtSnapshot(checkSnapshot.prices) : [];
  const leader = rankings[0] ?? null;
  const leaderOutcome = leader
    ? outcomes.candidates.find((candidate) => candidate.name === leader.name)
    : null;

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
    leaderWon: leaderOutcome?.isWinner ?? false,
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
  };
}

function buildPriceBrackets(
  winnerPrices: number[],
  nonWinnerPrices: number[],
): PriceBracketBucket[] {
  return PRICE_BRACKETS.map((bracket) => ({
    ...bracket,
    winners: winnerPrices.filter(
      (price) => price >= bracket.min && price < bracket.max,
    ).length,
    nonWinners: nonWinnerPrices.filter(
      (price) => price >= bracket.min && price < bracket.max,
    ).length,
  }));
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

  const winnerPricesAtCheck: number[] = [];
  const nonWinnerPricesAtCheck: number[] = [];

  for (const result of eligible) {
    if (!result.periodChartData.length || result.winnerNames.length === 0) {
      continue;
    }

    const firstPoint = result.periodChartData[0];
    for (const winner of result.winnerNames) {
      const price = firstPoint[winner];
      if (typeof price === "number") {
        winnerPricesAtCheck.push(price);
      }
    }

    for (const [name, price] of Object.entries(firstPoint)) {
      if (
        typeof price === "number" &&
        !result.winnerNames.includes(name) &&
        !["dayOffset", "winnerAvgPrice", "otherAvgPrice"].includes(name)
      ) {
        nonWinnerPricesAtCheck.push(price);
      }
    }
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
    winnerPricesAtCheck,
    nonWinnerPricesAtCheck,
    priceBrackets: buildPriceBrackets(
      winnerPricesAtCheck,
      nonWinnerPricesAtCheck,
    ),
    aggregateEvolution: buildAggregateEvolution(betResults, periodDays),
    betResults,
  };
}
