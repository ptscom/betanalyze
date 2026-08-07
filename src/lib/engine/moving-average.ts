import { startOfDay } from "date-fns";

export interface DailyMovingAveragePoint {
  day: Date;
  price: number;
  movingAverage: number | null;
}

export function computeDailyMovingAverages(
  dailyPrices: Map<string, number>,
  windowSize: number,
): DailyMovingAveragePoint[] {
  const sortedDays = [...dailyPrices.entries()].sort(
    (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime(),
  );

  const results: DailyMovingAveragePoint[] = [];

  for (let index = 0; index < sortedDays.length; index += 1) {
    const [dayKey, price] = sortedDays[index];
    const windowStart = Math.max(0, index - windowSize + 1);
    const window = sortedDays.slice(windowStart, index + 1);
    const movingAverage =
      window.length === windowSize
        ? window.reduce((sum, [, value]) => sum + value, 0) / windowSize
        : null;

    results.push({
      day: new Date(dayKey),
      price,
      movingAverage,
    });
  }

  return results;
}

export interface MaRiseSignal {
  day: Date;
  price: number;
  movingAverage: number;
}

export function findMaRiseSignal(
  dailyPrices: Map<string, number>,
  options: {
    windowSize: number;
    consecutiveIncreases: number;
    windowStart: Date;
    closeDate: Date;
  },
): MaRiseSignal | null {
  const series = computeDailyMovingAverages(
    dailyPrices,
    options.windowSize,
  ).filter(
    (point): point is DailyMovingAveragePoint & { movingAverage: number } =>
      point.movingAverage != null,
  );

  if (series.length < options.consecutiveIncreases + 1) {
    return null;
  }

  const windowStartTime = startOfDay(options.windowStart).getTime();
  const closeTime = options.closeDate.getTime();

  for (let index = options.consecutiveIncreases; index < series.length; index += 1) {
    const point = series[index];
    const pointTime = startOfDay(point.day).getTime();

    if (pointTime < windowStartTime || pointTime > closeTime) {
      continue;
    }

    let increases = 0;
    for (let step = 0; step < options.consecutiveIncreases; step += 1) {
      const current = series[index - step].movingAverage;
      const previous = series[index - step - 1].movingAverage;
      if (current > previous) {
        increases += 1;
      }
    }

    if (increases === options.consecutiveIncreases) {
      return {
        day: point.day,
        price: point.price,
        movingAverage: point.movingAverage,
      };
    }
  }

  return null;
}
