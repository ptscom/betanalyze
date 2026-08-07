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

export function findFirstCrossoverInWindow(
  timeline: AlignedSnapshot[],
  windowStart: Date,
  closeDate: Date,
): CrossoverEvent | null {
  const windowStartTime = windowStart.getTime();
  const closeTime = closeDate.getTime();

  return (
    findCrossovers(timeline).find(
      (event) =>
        event.loggedAt.getTime() >= windowStartTime &&
        event.loggedAt.getTime() <= closeTime,
    ) ?? null
  );
}
