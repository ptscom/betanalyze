import type { AlignedSnapshot } from "@/lib/models/types";

export interface CrossoverEvent {
  loggedAt: Date;
  newTopper: string;
  previousTopper: string | null;
  newTopperPrice: number;
  previousTopperPrice: number;
}

export function findCrossovers(timeline: AlignedSnapshot[]): CrossoverEvent[] {
  const events: CrossoverEvent[] = [];
  let previousTopper: string | null = null;

  for (const snapshot of timeline) {
    const topper = snapshot.topper;
    if (!topper) continue;

    if (previousTopper && topper !== previousTopper) {
      const previousPrice = snapshot.prices[previousTopper] ?? 0;
      const newPrice = snapshot.prices[topper] ?? 0;

      if (newPrice > previousPrice) {
        events.push({
          loggedAt: snapshot.loggedAt,
          newTopper: topper,
          previousTopper,
          newTopperPrice: newPrice,
          previousTopperPrice: previousPrice,
        });
      }
    }

    previousTopper = topper;
  }

  return events;
}

export function findFirstCrossover(
  timeline: AlignedSnapshot[],
): CrossoverEvent | null {
  return findCrossovers(timeline)[0] ?? null;
}

export function findLatestCrossover(
  timeline: AlignedSnapshot[],
): CrossoverEvent | null {
  const events = findCrossovers(timeline);
  return events.length > 0 ? events[events.length - 1] : null;
}
