export interface PricePoint {
  loggedAt: Date;
  price: number;
}

export interface CandidateSeries {
  name: string;
  points: PricePoint[];
}

export interface BetMarket {
  id: string;
  name: string;
  filename: string;
  candidates: CandidateSeries[];
  startDate: Date;
  endDate: Date;
}

export interface CandidateOutcome {
  name: string;
  finalPrice: number;
  isWinner: boolean;
  place: number;
}

export interface BetOutcomes {
  betId: string;
  betName: string;
  candidates: CandidateOutcome[];
  winner: string | null;
}

export interface AlignedSnapshot {
  loggedAt: Date;
  prices: Record<string, number>;
  topper: string | null;
}
