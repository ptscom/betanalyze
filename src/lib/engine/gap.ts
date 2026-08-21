import { startOfDay } from "date-fns";
import type { BetMarket } from "@/lib/models/types";
import { getDailyClosingPrices } from "@/lib/engine/timeline";

export interface DailyLeaderGap {
  day: Date;
  leader: string;
  leaderPrice: number;
  second: string;
  secondPrice: number;
  gap: number;
}

export interface GapChangeSignal {
  day: Date;
  leader: string;
  leaderPrice: number;
  second: string;
  secondPrice: number;
  gap: number;
  pickCandidate: string;
  pickPrice: number;
}

export type GapChangeDirection = "decrease" | "increase";

function rankCandidatesForDay(
  bet: BetMarket,
  dayKey: string,
): Omit<DailyLeaderGap, "day"> | null {
  const dailyByCandidate = getDailyClosingPrices(bet);
  const ranked = [...dailyByCandidate.entries()]
    .map(([name, daily]) => {
      const price = daily.get(dayKey);
      return price != null ? { name, price } : null;
    })
    .filter((entry): entry is { name: string; price: number } => entry != null)
    .sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));

  if (ranked.length < 2) {
    return null;
  }

  return {
    leader: ranked[0].name,
    leaderPrice: ranked[0].price,
    second: ranked[1].name,
    secondPrice: ranked[1].price,
    gap: ranked[0].price - ranked[1].price,
  };
}

export function buildDailyLeaderGaps(
  bet: BetMarket,
  windowStart: Date,
  closeDate: Date,
): DailyLeaderGap[] {
  const dailyByCandidate = getDailyClosingPrices(bet);
  const windowStartTime = startOfDay(windowStart).getTime();
  const closeTime = closeDate.getTime();
  const dayKeys = new Set<string>();

  for (const daily of dailyByCandidate.values()) {
    for (const dayKey of daily.keys()) {
      const time = new Date(dayKey).getTime();
      if (time >= windowStartTime && time <= closeTime) {
        dayKeys.add(dayKey);
      }
    }
  }

  const gaps: DailyLeaderGap[] = [];

  for (const dayKey of [...dayKeys].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  )) {
    const ranked = rankCandidatesForDay(bet, dayKey);
    if (!ranked) continue;

    gaps.push({
      day: new Date(dayKey),
      ...ranked,
    });
  }

  return gaps;
}

export function findGapChangeSignal(
  gaps: DailyLeaderGap[],
  direction: GapChangeDirection,
  consecutiveChanges: number,
  windowStart: Date,
  closeDate: Date,
): GapChangeSignal | null {
  if (gaps.length < consecutiveChanges + 1) {
    return null;
  }

  const windowStartTime = startOfDay(windowStart).getTime();
  const closeTime = closeDate.getTime();

  for (let index = consecutiveChanges; index < gaps.length; index += 1) {
    const point = gaps[index];
    const pointTime = startOfDay(point.day).getTime();

    if (pointTime < windowStartTime || pointTime > closeTime) {
      continue;
    }

    let matchingChanges = 0;
    for (let step = 0; step < consecutiveChanges; step += 1) {
      const currentGap = gaps[index - step].gap;
      const previousGap = gaps[index - step - 1].gap;
      const changed =
        direction === "decrease"
          ? currentGap < previousGap
          : currentGap > previousGap;

      if (changed) {
        matchingChanges += 1;
      }
    }

    if (matchingChanges === consecutiveChanges) {
      const pickCandidate =
        direction === "decrease" ? point.second : point.leader;
      const pickPrice =
        direction === "decrease" ? point.secondPrice : point.leaderPrice;

      return {
        day: point.day,
        leader: point.leader,
        leaderPrice: point.leaderPrice,
        second: point.second,
        secondPrice: point.secondPrice,
        gap: point.gap,
        pickCandidate,
        pickPrice,
      };
    }
  }

  return null;
}
