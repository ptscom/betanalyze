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
