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

export interface StrategySignal {
  candidate: string;
  triggeredAt: Date;
  metadata: Record<string, string | number | boolean>;
}

export interface StrategyResult {
  strategyId: string;
  strategyName: string;
  betId: string;
  betName: string;
  signals: StrategySignal[];
  pickedCandidate: string | null;
  pickedPlace: number | null;
  pickedWon: boolean | null;
  winner: string | null;
}

export interface StrategySummary {
  strategyId: string;
  strategyName: string;
  totalBets: number;
  betsWithSignal: number;
  wins: number;
  winRate: number;
  avgPlace: number | null;
  placeDistribution: Record<number, number>;
}

export interface AlignedSnapshot {
  loggedAt: Date;
  prices: Record<string, number>;
  topper: string | null;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  run: (bet: BetMarket, outcomes: BetOutcomes) => StrategyResult;
}
