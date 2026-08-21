import { startOfDay } from "date-fns";

export type ConsecutiveDayDirection = "up" | "down";

export interface ConsecutiveDaySignal {
  day: Date;
  price: number;
}

export function findConsecutiveDayMoveSignal(
  dailyPrices: Map<string, number>,
  direction: ConsecutiveDayDirection,
  streakLength: number,
  windowStart: Date,
  closeDate: Date,
): ConsecutiveDaySignal | null {
  const sortedDays = [...dailyPrices.entries()].sort(
    (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime(),
  );

  if (sortedDays.length < streakLength + 1) {
    return null;
  }

  const windowStartTime = startOfDay(windowStart).getTime();
  const closeTime = closeDate.getTime();

  for (let index = streakLength; index < sortedDays.length; index += 1) {
    const [dayKey, price] = sortedDays[index];
    const pointTime = startOfDay(new Date(dayKey)).getTime();

    if (pointTime < windowStartTime || pointTime > closeTime) {
      continue;
    }

    let matchingMoves = 0;
    for (let step = 0; step < streakLength; step += 1) {
      const current = sortedDays[index - step][1];
      const previous = sortedDays[index - step - 1][1];
      const moved =
        direction === "up" ? current > previous : current < previous;

      if (moved) {
        matchingMoves += 1;
      }
    }

    if (matchingMoves === streakLength) {
      return {
        day: new Date(dayKey),
        price,
      };
    }
  }

  return null;
}
