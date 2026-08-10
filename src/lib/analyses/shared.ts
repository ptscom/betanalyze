import type { PriceBracketWinRate } from "@/lib/analyses/types";

export const PRICE_BRACKETS = [
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

export function getPriceBracketLabel(price: number): string | null {
  const bracket = PRICE_BRACKETS.find(
    (row) => price >= row.min && price < row.max,
  );
  return bracket?.label ?? null;
}

export function getSlabsInPriceRange(
  lowPrice: number,
  highPrice: number,
): string[] {
  const low = Math.min(lowPrice, highPrice);
  const high = Math.max(lowPrice, highPrice);

  return PRICE_BRACKETS.filter(
    (bracket) => bracket.min < high && bracket.max > low,
  ).map((bracket) => bracket.label);
}

export function getPriceBracketIndex(price: number): number {
  return PRICE_BRACKETS.findIndex(
    (bracket) => price >= bracket.min && price < bracket.max,
  );
}

export function getSlabsTouchedWhileFalling(
  dailyPrices: number[],
  startPrice: number,
): string[] {
  if (dailyPrices.length === 0) {
    return [];
  }

  const startSlabIndex = getPriceBracketIndex(startPrice);
  if (startSlabIndex === -1) {
    return [];
  }

  const isDipSlab = (label: string): boolean => {
    const index = PRICE_BRACKETS.findIndex((bracket) => bracket.label === label);
    return index !== -1 && index <= startSlabIndex;
  };

  const touched = new Set<string>();
  const startLabel = getPriceBracketLabel(startPrice);
  if (startLabel && isDipSlab(startLabel)) {
    touched.add(startLabel);
  }

  let previousPrice = dailyPrices[0];
  for (let index = 1; index < dailyPrices.length; index++) {
    const currentPrice = dailyPrices[index];
    if (currentPrice < previousPrice) {
      for (const label of getSlabsInPriceRange(currentPrice, previousPrice)) {
        if (isDipSlab(label)) {
          touched.add(label);
        }
      }
    }
    previousPrice = currentPrice;
  }

  return PRICE_BRACKETS.filter((bracket) => touched.has(bracket.label)).map(
    (bracket) => bracket.label,
  );
}

export function buildPriceWinRates(
  picks: { price: number | null; won: boolean }[],
): PriceBracketWinRate[] {
  return PRICE_BRACKETS.map((bracket) => {
    const inBracket = picks.filter(
      (pick) =>
        pick.price != null &&
        pick.price >= bracket.min &&
        pick.price < bracket.max,
    );
    const becameWinner = inBracket.filter((pick) => pick.won).length;

    return {
      label: bracket.label,
      min: bracket.min,
      max: bracket.max,
      total: inBracket.length,
      becameWinner,
      winRate: inBracket.length > 0 ? becameWinner / inBracket.length : 0,
    };
  });
}
