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
