import type { BetMarket, BetOutcomes, CandidateOutcome } from "@/lib/models/types";

const WINNER_THRESHOLD = 0.9;

export function getFinalPrice(points: { loggedAt: Date; price: number }[]): number {
  if (points.length === 0) return 0;
  return points[points.length - 1].price;
}

export function isWinner(finalPrice: number): boolean {
  return finalPrice > WINNER_THRESHOLD;
}

export function computeBetOutcomes(bet: BetMarket): BetOutcomes {
  const candidates: CandidateOutcome[] = bet.candidates
    .map((candidate) => {
      const finalPrice = getFinalPrice(candidate.points);
      return {
        name: candidate.name,
        finalPrice,
        isWinner: isWinner(finalPrice),
        place: 0,
      };
    })
    .sort((a, b) => b.finalPrice - a.finalPrice)
    .map((candidate, index) => ({
      ...candidate,
      place: index + 1,
    }));

  const winner = candidates.find((candidate) => candidate.isWinner)?.name ?? null;

  return {
    betId: bet.id,
    betName: bet.name,
    candidates,
    winner,
  };
}

export function getCandidateOutcome(
  outcomes: BetOutcomes,
  candidateName: string,
): CandidateOutcome | null {
  return outcomes.candidates.find((candidate) => candidate.name === candidateName) ?? null;
}
