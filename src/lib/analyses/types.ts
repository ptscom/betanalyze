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
  leaderStartSlab: string | null;
  dipSlabsTouched: string[];
  leaderMinPriceInWindow: number | null;
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

export interface DipSlabWinRate {
  startSlab: string;
  dipSlab: string;
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
  pickStartSlab: string | null;
  dipSlabsTouched: string[];
  minPriceInWindow: number | null;
}

export interface FirstCrossoverAggregateResult {
  periodDays: PeriodDays;
  totalBets: number;
  eligibleBets: number;
  picksWhoWon: number;
  winRate: number;
  placeDistribution: Record<number, number>;
  pickPriceWinRates: PriceBracketWinRate[];
  dipSlabWinRates: DipSlabWinRate[];
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
  pickStartSlab: string | null;
  dipSlabsTouched: string[];
  minPriceInWindow: number | null;
}

export interface RiseInMaAggregateResult {
  periodDays: PeriodDays;
  totalBets: number;
  eligibleBets: number;
  picksWhoWon: number;
  winRate: number;
  placeDistribution: Record<number, number>;
  pickPriceWinRates: PriceBracketWinRate[];
  dipSlabWinRates: DipSlabWinRate[];
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
  dipSlabWinRates: DipSlabWinRate[];
  aggregateEvolution: { dayOffset: number; winnerAvg: number; otherAvg: number }[];
  betResults: PeriodBetResult[];
}

export type ReversalPeriodDays = 7 | 14 | 21 | 28;

export const REVERSAL_PERIOD_OPTIONS: ReversalPeriodDays[] = [7, 14, 21, 28];

export const REVERSAL_THRESHOLD = 0.9;

export interface ReversalCandidateResult {
  betId: string;
  betName: string;
  closeDate: Date;
  windowStart: Date;
  periodDays: ReversalPeriodDays;
  candidate: string;
  firstHitAt: Date;
  peakPriceInWindow: number;
  finalPlace: number | null;
  reversed: boolean;
  heldOn: boolean;
  actualWinner: string | null;
  priceAtFirstHit: number;
  pickStartSlab: string | null;
  dipSlabsTouched: string[];
  minPriceInWindow: number | null;
}

export interface ReversalAggregateResult {
  periodDays: ReversalPeriodDays;
  threshold: typeof REVERSAL_THRESHOLD;
  totalBets: number;
  betsWithHits: number;
  eligibleCandidates: number;
  reversals: number;
  reversalRate: number;
  heldOnCount: number;
  holdRate: number;
  placeDistribution: Record<number, number>;
  peakPriceOutcomes: PriceBracketWinRate[];
  dipSlabWinRates: DipSlabWinRate[];
  candidateResults: ReversalCandidateResult[];
}

export const POST_BIG_FALL_THRESHOLD = 0.25;

export interface PostBigFallBetResult {
  betId: string;
  betName: string;
  closeDate: Date;
  checkDate: Date;
  periodDays: PeriodDays;
  hasEnoughHistory: boolean;
  leaderAtCheck: string | null;
  leaderPriceAtCheck: number | null;
  leaderStartSlab: string | null;
  hasBigFall: boolean;
  fallDays: 1 | 2 | null;
  fallAt: Date | null;
  priceBeforeFall: number | null;
  priceAfterFall: number | null;
  fallPct: number | null;
  leaderFinalPlace: number | null;
  leaderWon: boolean;
  actualWinner: string | null;
  pickStartSlab: string | null;
  dipSlabsTouched: string[];
  minPriceInWindow: number | null;
}

export interface PostBigFallAggregateResult {
  periodDays: PeriodDays;
  threshold: typeof POST_BIG_FALL_THRESHOLD;
  totalBets: number;
  eligibleBets: number;
  leadersWhoWon: number;
  winRate: number;
  oneDayFalls: number;
  twoDayFalls: number;
  placeDistribution: Record<number, number>;
  priceAfterFallWinRates: PriceBracketWinRate[];
  dipSlabWinRates: DipSlabWinRate[];
  betResults: PostBigFallBetResult[];
}
