import type { BetMarket, BetOutcomes, CandidateOutcome } from "@/lib/models/types";

const WINNER_THRESHOLD = 0.9;

export function getCloseDate(bet: BetMarket): Date {
  const timestamps = bet.candidates.flatMap((candidate) =>
    candidate.points.map((point) => point.loggedAt.getTime()),
  );

  return new Date(Math.max(...timestamps));
}

export function getPriceAt(
  points: { loggedAt: Date; price: number }[],
  at: Date,
): number | null {
  const target = at.getTime();
  let last: number | null = null;

  for (const point of points) {
    if (point.loggedAt.getTime() <= target) {
      last = point.price;
    } else {
      break;
    }
  }

  return last;
}

export function isWinner(finalPrice: number, maxFinalPrice: number): boolean {
  return finalPrice === maxFinalPrice && finalPrice >= WINNER_THRESHOLD;
}

export function computeBetOutcomes(bet: BetMarket): BetOutcomes {
  const closeDate = getCloseDate(bet);

  const candidatesWithFinal = bet.candidates.map((candidate) => {
    const finalPrice = getPriceAt(candidate.points, closeDate) ?? 0;
    return {
      name: candidate.name,
      finalPrice,
      isWinner: false,
      place: 0,
    };
  });

  const maxFinalPrice = Math.max(
    ...candidatesWithFinal.map((candidate) => candidate.finalPrice),
  );

  const candidates: CandidateOutcome[] = candidatesWithFinal
    .map((candidate) => ({
      ...candidate,
      isWinner: isWinner(candidate.finalPrice, maxFinalPrice),
    }))
    .sort((a, b) => b.finalPrice - a.finalPrice || a.name.localeCompare(b.name))
    .map((candidate, index) => ({
      ...candidate,
      place: index + 1,
    }));

  const winner = candidates[0]?.name ?? null;

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
  return (
    outcomes.candidates.find((candidate) => candidate.name === candidateName) ??
    null
  );
}
