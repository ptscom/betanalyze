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

export type JumpThreshold = 0.1 | 0.25 | 0.5;

export const JUMP_THRESHOLD_OPTIONS: JumpThreshold[] = [0.1, 0.25, 0.5];

export function jumpCacheKey(
  periodDays: PeriodDays,
  threshold: JumpThreshold,
): string {
  return `${periodDays}-${threshold}`;
}

export interface SingleDayJumpBetResult {
  betId: string;
  betName: string;
  closeDate: Date;
  windowStart: Date;
  periodDays: PeriodDays;
  threshold: JumpThreshold;
  hasEnoughHistory: boolean;
  hasJump: boolean;
  jumpCandidate: string | null;
  jumpAt: Date | null;
  priceBefore: number | null;
  priceAfter: number | null;
  jumpPct: number | null;
  pickFinalPlace: number | null;
  pickWon: boolean;
  actualWinner: string | null;
}

export interface SingleDayJumpAggregateResult {
  periodDays: PeriodDays;
  threshold: JumpThreshold;
  totalBets: number;
  eligibleBets: number;
  picksWhoWon: number;
  winRate: number;
  placeDistribution: Record<number, number>;
  pickPriceWinRates: PriceBracketWinRate[];
  betResults: SingleDayJumpBetResult[];
}
