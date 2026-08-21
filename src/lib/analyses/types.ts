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

export type GapChangeDirection = "decrease" | "increase";

export interface GapChangeBetResult {
  betId: string;
  betName: string;
  closeDate: Date;
  windowStart: Date;
  periodDays: PeriodDays;
  direction: GapChangeDirection;
  hasEnoughHistory: boolean;
  hasSignal: boolean;
  signalCandidate: string | null;
  signalPrice: number | null;
  signalGap: number | null;
  leaderAtSignal: string | null;
  leaderPriceAtSignal: number | null;
  secondAtSignal: string | null;
  secondPriceAtSignal: number | null;
  signalAt: Date | null;
  pickFinalPlace: number | null;
  pickWon: boolean;
  actualWinner: string | null;
}

export interface GapChangeAggregateResult {
  direction: GapChangeDirection;
  periodDays: PeriodDays;
  totalBets: number;
  eligibleBets: number;
  picksWhoWon: number;
  winRate: number;
  placeDistribution: Record<number, number>;
  pickPriceWinRates: PriceBracketWinRate[];
  betResults: GapChangeBetResult[];
}

export type ConsecutiveDayDirection = "up" | "down";

export type ConsecutiveStreakLength = 3 | 5;

export const CONSECUTIVE_STREAK_OPTIONS: ConsecutiveStreakLength[] = [3, 5];

export function consecutiveDaysCacheKey(
  periodDays: PeriodDays,
  direction: ConsecutiveDayDirection,
  streakLength: ConsecutiveStreakLength,
): string {
  return `${periodDays}-${direction}-${streakLength}`;
}

export interface ConsecutiveDaysBetResult {
  betId: string;
  betName: string;
  closeDate: Date;
  windowStart: Date;
  periodDays: PeriodDays;
  direction: ConsecutiveDayDirection;
  streakLength: ConsecutiveStreakLength;
  hasEnoughHistory: boolean;
  hasSignal: boolean;
  signalCandidate: string | null;
  signalPrice: number | null;
  signalAt: Date | null;
  pickFinalPlace: number | null;
  pickWon: boolean;
  actualWinner: string | null;
}

export interface ConsecutiveDaysAggregateResult {
  direction: ConsecutiveDayDirection;
  streakLength: ConsecutiveStreakLength;
  periodDays: PeriodDays;
  totalBets: number;
  eligibleBets: number;
  picksWhoWon: number;
  winRate: number;
  placeDistribution: Record<number, number>;
  pickPriceWinRates: PriceBracketWinRate[];
  betResults: ConsecutiveDaysBetResult[];
}

export const REVERSAL_OCCURRENCE_MIN_PRICE = 0.5;

export const REVERSAL_OCCURRENCE_SLABS = [
  { label: "$0.50–$0.60", min: 0.5, max: 0.6 },
  { label: "$0.60–$0.70", min: 0.6, max: 0.7 },
  { label: "$0.70–$0.80", min: 0.7, max: 0.8 },
  { label: "$0.80–$0.90", min: 0.8, max: 0.9 },
  { label: "$0.90–$1.00", min: 0.9, max: 1.01 },
] as const;

export function reversalOccurrenceCacheKey(periodDays: PeriodDays): string {
  return String(periodDays);
}

export function getReversalOccurrenceSlabLabel(price: number): string | null {
  for (const slab of REVERSAL_OCCURRENCE_SLABS) {
    if (price >= slab.min && price < slab.max) {
      return slab.label;
    }
  }
  return null;
}

export interface ReversalSlabWinRate {
  label: string;
  min: number;
  max: number;
  total: number;
  reversals: number;
  reversalRate: number;
  heldOnCount: number;
  holdRate: number;
}

export interface ReversalOccurrenceBetResult {
  betId: string;
  betName: string;
  closeDate: Date;
  windowStart: Date;
  periodDays: PeriodDays;
  hasEnoughHistory: boolean;
  hasHit: boolean;
  hitCandidate: string | null;
  hitPrice: number | null;
  hitSlab: string | null;
  hitAt: Date | null;
  reversed: boolean;
  pickFinalPlace: number | null;
  heldOn: boolean;
  actualWinner: string | null;
}

export interface ReversalOccurrenceAggregateResult {
  periodDays: PeriodDays;
  minEntryPrice: typeof REVERSAL_OCCURRENCE_MIN_PRICE;
  totalBets: number;
  eligibleBets: number;
  reversals: number;
  reversalRate: number;
  heldOnCount: number;
  holdRate: number;
  slabWinRates: ReversalSlabWinRate[];
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
