import { addDays, startOfDay } from "date-fns";
import type { AlignedSnapshot, BetMarket } from "@/lib/models/types";

function uniqueSortedTimestamps(bet: BetMarket): Date[] {
  const timestamps = new Set<number>();
  for (const candidate of bet.candidates) {
    for (const point of candidate.points) {
      timestamps.add(point.loggedAt.getTime());
    }
  }

  return [...timestamps]
    .sort((a, b) => a - b)
    .map((value) => new Date(value));
}

export function buildAlignedTimeline(bet: BetMarket): AlignedSnapshot[] {
  const timestamps = uniqueSortedTimestamps(bet);
  const latestPrices = new Map<string, number>();

  return timestamps.map((loggedAt) => {
    for (const candidate of bet.candidates) {
      const sameTimePoint = candidate.points.find(
        (point) => point.loggedAt.getTime() === loggedAt.getTime(),
      );
      if (sameTimePoint) {
        latestPrices.set(candidate.name, sameTimePoint.price);
        continue;
      }

      const priorPoints = candidate.points.filter(
        (point) => point.loggedAt.getTime() <= loggedAt.getTime(),
      );
      if (priorPoints.length > 0) {
        latestPrices.set(
          candidate.name,
          priorPoints[priorPoints.length - 1].price,
        );
      }
    }

    const prices = Object.fromEntries(latestPrices.entries());
    const topperEntry = Object.entries(prices).sort((a, b) => b[1] - a[1])[0];

    return {
      loggedAt,
      prices,
      topper: topperEntry ? topperEntry[0] : null,
    };
  });
}

export function getDailyClosingPrices(
  bet: BetMarket,
): Map<string, Map<string, number>> {
  const daily = new Map<string, Map<string, number>>();

  for (const candidate of bet.candidates) {
    for (const point of candidate.points) {
      const dayKey = startOfDay(point.loggedAt).toISOString();
      const candidateDays = daily.get(candidate.name) ?? new Map<string, number>();
      candidateDays.set(dayKey, point.price);
      daily.set(candidate.name, candidateDays);
    }
  }

  return daily;
}

export function getTimelineSince(
  timeline: AlignedSnapshot[],
  since: Date,
): AlignedSnapshot[] {
  return timeline.filter((snapshot) => snapshot.loggedAt >= since);
}

export function getBetWindowStart(bet: BetMarket, days: number): Date {
  return addDays(startOfDay(bet.endDate), -days);
}
