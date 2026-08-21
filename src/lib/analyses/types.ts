export type PeriodDays = 7 | 14 | 21;

export const PERIOD_OPTIONS: PeriodDays[] = [7, 14, 21];

export interface PeriodBetResult {
  betId: string;
  betName: string;
  closeDate: Date;
  checkDate: Date;
  periodDays: PeriodDays;
  hasEnoughHistory: boolean;
  leaderAtCheck: string | null;
  leaderPriceAtCheck: number | null;
  leaderRankAtCheck: number | null;
  leaderFinalPlace: number | null;
  leaderWon: boolean;
  actualWinner: string | null;
  winnerNames: string[];
  periodChartData: PeriodChartPoint[];
}

export interface PeriodChartPoint {
  date: string;
  dayOffset: number;
  winnerAvgPrice: number | null;
  otherAvgPrice: number | null;
  [candidate: string]: string | number | null | undefined;
}

export interface PriceBracketWinRate {
  label: string;
  min: number;
  max: number;
  total: number;
  becameWinner: number;
  winRate: number;
}

export interface FirstCrossoverBetResult {
  betId: string;
  betName: string;
  closeDate: Date;
  windowStart: Date;
  periodDays: PeriodDays;
  hasEnoughHistory: boolean;
  hasCrossover: boolean;
  crossoverCandidate: string | null;
  crossoverPrice: number | null;
  crossoverAt: Date | null;
  previousLeader: string | null;
  previousLeaderPrice: number | null;
  pickFinalPlace: number | null;
  pickWon: boolean;
  actualWinner: string | null;
}

export interface FirstCrossoverAggregateResult {
  periodDays: PeriodDays;
  totalBets: number;
  eligibleBets: number;
  picksWhoWon: number;
  winRate: number;
  placeDistribution: Record<number, number>;
  pickPriceWinRates: PriceBracketWinRate[];
  betResults: FirstCrossoverBetResult[];
}

export interface RiseInMaBetResult {
  betId: string;
  betName: string;
  closeDate: Date;
  windowStart: Date;
  periodDays: PeriodDays;
  hasEnoughHistory: boolean;
  hasSignal: boolean;
  signalCandidate: string | null;
  signalPrice: number | null;
  signalMa: number | null;
  signalAt: Date | null;
  pickFinalPlace: number | null;
  pickWon: boolean;
  actualWinner: string | null;
}

export interface RiseInMaAggregateResult {
  periodDays: PeriodDays;
  totalBets: number;
  eligibleBets: number;
  picksWhoWon: number;
  winRate: number;
  placeDistribution: Record<number, number>;
  pickPriceWinRates: PriceBracketWinRate[];
  betResults: RiseInMaBetResult[];
}

export type ReversalThreshold = 0.5 | 0.6 | 0.7 | 0.8 | 0.9;

export const THRESHOLD_OPTIONS: ReversalThreshold[] = [0.5, 0.6, 0.7, 0.8, 0.9];

export function reversalCacheKey(
  periodDays: PeriodDays,
  threshold: ReversalThreshold,
): string {
  return `${periodDays}-${threshold}`;
}

export interface ReversalOccurrenceBetResult {
  betId: string;
  betName: string;
  closeDate: Date;
  windowStart: Date;
  periodDays: PeriodDays;
  threshold: ReversalThreshold;
  hasEnoughHistory: boolean;
  hasHit: boolean;
  hitCandidate: string | null;
  hitPrice: number | null;
  hitAt: Date | null;
  reversed: boolean;
  pickFinalPlace: number | null;
  heldOn: boolean;
  actualWinner: string | null;
}

export interface ReversalOccurrenceAggregateResult {
  periodDays: PeriodDays;
  threshold: ReversalThreshold;
  totalBets: number;
  eligibleBets: number;
  reversals: number;
  reversalRate: number;
  heldOnCount: number;
  holdRate: number;
  placeDistribution: Record<number, number>;
  hitPriceOutcomes: PriceBracketWinRate[];
  betResults: ReversalOccurrenceBetResult[];
}

export interface PeriodAggregateResult {
  periodDays: PeriodDays;
  totalBets: number;
  eligibleBets: number;
  leadersWhoWon: number;
  winRate: number;
  avgFinalPlace: number | null;
  placeDistribution: Record<number, number>;
  leaderPriceWinRates: PriceBracketWinRate[];
  aggregateEvolution: { dayOffset: number; winnerAvg: number; otherAvg: number }[];
  betResults: PeriodBetResult[];
}
