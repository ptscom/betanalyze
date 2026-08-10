import fs from "node:fs";
import path from "node:path";
import type { BetMarket } from "@/lib/models/types";
import type {
  FirstCrossoverAggregateResult,
  PeriodAggregateResult,
  PeriodDays,
  ReversalAggregateResult,
  RiseInMaAggregateResult,
} from "@/lib/analyses/types";

export interface SerializedPricePoint {
  loggedAt: string;
  price: number;
}

export interface SerializedBetMarket {
  id: string;
  name: string;
  filename: string;
  candidates: {
    name: string;
    points: SerializedPricePoint[];
  }[];
  startDate: string;
  endDate: string;
}

export interface SerializedFailedBet {
  filename: string;
  error: string;
}

export interface SerializedPeriodBetResult {
  betId: string;
  betName: string;
  closeDate: string;
  checkDate: string;
  periodDays: PeriodDays;
  hasEnoughHistory: boolean;
  leaderAtCheck: string | null;
  leaderPriceAtCheck: number | null;
  leaderRankAtCheck: number | null;
  leaderFinalPlace: number | null;
  leaderWon: boolean;
  actualWinner: string | null;
  winnerNames: string[];
  leaderStartSlab: string | null;
  dipSlabsTouched: string[];
  leaderMinPriceInWindow: number | null;
}

export interface SerializedReversalCandidateResult {
  betId: string;
  betName: string;
  closeDate: string;
  windowStart: string;
  periodDays: ReversalAggregateResult["periodDays"];
  candidate: string;
  firstHitAt: string;
  peakPriceInWindow: number;
  finalPlace: number | null;
  reversed: boolean;
  heldOn: boolean;
  actualWinner: string | null;
}

export interface SerializedReversalAggregateResult {
  periodDays: ReversalAggregateResult["periodDays"];
  threshold: ReversalAggregateResult["threshold"];
  totalBets: number;
  betsWithHits: number;
  eligibleCandidates: number;
  reversals: number;
  reversalRate: number;
  heldOnCount: number;
  holdRate: number;
  placeDistribution: Record<number, number>;
  peakPriceOutcomes: ReversalAggregateResult["peakPriceOutcomes"];
  candidateResults: SerializedReversalCandidateResult[];
}

export interface SerializedRiseInMaBetResult {
  betId: string;
  betName: string;
  closeDate: string;
  windowStart: string;
  periodDays: PeriodDays;
  hasEnoughHistory: boolean;
  hasSignal: boolean;
  signalCandidate: string | null;
  signalPrice: number | null;
  signalMa: number | null;
  signalAt: string | null;
  pickFinalPlace: number | null;
  pickWon: boolean;
  actualWinner: string | null;
}

export interface SerializedRiseInMaAggregateResult {
  periodDays: PeriodDays;
  totalBets: number;
  eligibleBets: number;
  picksWhoWon: number;
  winRate: number;
  placeDistribution: Record<number, number>;
  pickPriceWinRates: RiseInMaAggregateResult["pickPriceWinRates"];
  betResults: SerializedRiseInMaBetResult[];
}

export interface SerializedFirstCrossoverBetResult {
  betId: string;
  betName: string;
  closeDate: string;
  windowStart: string;
  periodDays: PeriodDays;
  hasEnoughHistory: boolean;
  hasCrossover: boolean;
  crossoverCandidate: string | null;
  crossoverPrice: number | null;
  crossoverAt: string | null;
  previousLeader: string | null;
  previousLeaderPrice: number | null;
  pickFinalPlace: number | null;
  pickWon: boolean;
  actualWinner: string | null;
}

export interface SerializedFirstCrossoverAggregateResult {
  periodDays: PeriodDays;
  totalBets: number;
  eligibleBets: number;
  picksWhoWon: number;
  winRate: number;
  placeDistribution: Record<number, number>;
  pickPriceWinRates: FirstCrossoverAggregateResult["pickPriceWinRates"];
  betResults: SerializedFirstCrossoverBetResult[];
}

export interface SerializedPeriodAggregateResult {
  periodDays: PeriodDays;
  totalBets: number;
  eligibleBets: number;
  leadersWhoWon: number;
  winRate: number;
  avgFinalPlace: number | null;
  placeDistribution: Record<number, number>;
  leaderPriceWinRates: PeriodAggregateResult["leaderPriceWinRates"];
  dipSlabWinRates: PeriodAggregateResult["dipSlabWinRates"];
  aggregateEvolution: PeriodAggregateResult["aggregateEvolution"];
  betResults: SerializedPeriodBetResult[];
}

export interface BetsCacheFile {
  version: 1;
  generatedAt: string;
  bets: SerializedBetMarket[];
  failures: SerializedFailedBet[];
  periodPerformance: Record<string, SerializedPeriodAggregateResult>;
  firstCrossover: Record<string, SerializedFirstCrossoverAggregateResult>;
  riseInMa: Record<string, SerializedRiseInMaAggregateResult>;
  reversal: Record<string, SerializedReversalAggregateResult>;
}

export function getCacheFilePath(): string {
  return path.join(process.cwd(), "data", "bets-cache.json");
}

export function serializeBet(bet: BetMarket): SerializedBetMarket {
  return {
    id: bet.id,
    name: bet.name,
    filename: bet.filename,
    candidates: bet.candidates.map((candidate) => ({
      name: candidate.name,
      points: candidate.points.map((point) => ({
        loggedAt: point.loggedAt.toISOString(),
        price: point.price,
      })),
    })),
    startDate: bet.startDate.toISOString(),
    endDate: bet.endDate.toISOString(),
  };
}

export function deserializeBet(bet: SerializedBetMarket): BetMarket {
  return {
    id: bet.id,
    name: bet.name,
    filename: bet.filename,
    candidates: bet.candidates.map((candidate) => ({
      name: candidate.name,
      points: candidate.points.map((point) => ({
        loggedAt: new Date(point.loggedAt),
        price: point.price,
      })),
    })),
    startDate: new Date(bet.startDate),
    endDate: new Date(bet.endDate),
  };
}

export function serializeReversalAnalysis(
  analysis: ReversalAggregateResult,
): SerializedReversalAggregateResult {
  return {
    periodDays: analysis.periodDays,
    threshold: analysis.threshold,
    totalBets: analysis.totalBets,
    betsWithHits: analysis.betsWithHits,
    eligibleCandidates: analysis.eligibleCandidates,
    reversals: analysis.reversals,
    reversalRate: analysis.reversalRate,
    heldOnCount: analysis.heldOnCount,
    holdRate: analysis.holdRate,
    placeDistribution: analysis.placeDistribution,
    peakPriceOutcomes: analysis.peakPriceOutcomes,
    candidateResults: analysis.candidateResults.map((result) => ({
      betId: result.betId,
      betName: result.betName,
      closeDate: result.closeDate.toISOString(),
      windowStart: result.windowStart.toISOString(),
      periodDays: result.periodDays,
      candidate: result.candidate,
      firstHitAt: result.firstHitAt.toISOString(),
      peakPriceInWindow: result.peakPriceInWindow,
      finalPlace: result.finalPlace,
      reversed: result.reversed,
      heldOn: result.heldOn,
      actualWinner: result.actualWinner,
    })),
  };
}

export function deserializeReversalAnalysis(
  analysis: SerializedReversalAggregateResult,
): ReversalAggregateResult {
  return {
    ...analysis,
    candidateResults: analysis.candidateResults.map((result) => ({
      ...result,
      closeDate: new Date(result.closeDate),
      windowStart: new Date(result.windowStart),
      firstHitAt: new Date(result.firstHitAt),
    })),
  };
}

export function serializeRiseInMaAnalysis(
  analysis: RiseInMaAggregateResult,
): SerializedRiseInMaAggregateResult {
  return {
    periodDays: analysis.periodDays,
    totalBets: analysis.totalBets,
    eligibleBets: analysis.eligibleBets,
    picksWhoWon: analysis.picksWhoWon,
    winRate: analysis.winRate,
    placeDistribution: analysis.placeDistribution,
    pickPriceWinRates: analysis.pickPriceWinRates,
    betResults: analysis.betResults.map((result) => ({
      betId: result.betId,
      betName: result.betName,
      closeDate: result.closeDate.toISOString(),
      windowStart: result.windowStart.toISOString(),
      periodDays: result.periodDays,
      hasEnoughHistory: result.hasEnoughHistory,
      hasSignal: result.hasSignal,
      signalCandidate: result.signalCandidate,
      signalPrice: result.signalPrice,
      signalMa: result.signalMa,
      signalAt: result.signalAt?.toISOString() ?? null,
      pickFinalPlace: result.pickFinalPlace,
      pickWon: result.pickWon,
      actualWinner: result.actualWinner,
    })),
  };
}

export function deserializeRiseInMaAnalysis(
  analysis: SerializedRiseInMaAggregateResult,
): RiseInMaAggregateResult {
  return {
    ...analysis,
    betResults: analysis.betResults.map((result) => ({
      ...result,
      closeDate: new Date(result.closeDate),
      windowStart: new Date(result.windowStart),
      signalAt: result.signalAt ? new Date(result.signalAt) : null,
    })),
  };
}

export function serializeFirstCrossoverAnalysis(
  analysis: FirstCrossoverAggregateResult,
): SerializedFirstCrossoverAggregateResult {
  return {
    periodDays: analysis.periodDays,
    totalBets: analysis.totalBets,
    eligibleBets: analysis.eligibleBets,
    picksWhoWon: analysis.picksWhoWon,
    winRate: analysis.winRate,
    placeDistribution: analysis.placeDistribution,
    pickPriceWinRates: analysis.pickPriceWinRates,
    betResults: analysis.betResults.map((result) => ({
      betId: result.betId,
      betName: result.betName,
      closeDate: result.closeDate.toISOString(),
      windowStart: result.windowStart.toISOString(),
      periodDays: result.periodDays,
      hasEnoughHistory: result.hasEnoughHistory,
      hasCrossover: result.hasCrossover,
      crossoverCandidate: result.crossoverCandidate,
      crossoverPrice: result.crossoverPrice,
      crossoverAt: result.crossoverAt?.toISOString() ?? null,
      previousLeader: result.previousLeader,
      previousLeaderPrice: result.previousLeaderPrice,
      pickFinalPlace: result.pickFinalPlace,
      pickWon: result.pickWon,
      actualWinner: result.actualWinner,
    })),
  };
}

export function deserializeFirstCrossoverAnalysis(
  analysis: SerializedFirstCrossoverAggregateResult,
): FirstCrossoverAggregateResult {
  return {
    ...analysis,
    betResults: analysis.betResults.map((result) => ({
      ...result,
      closeDate: new Date(result.closeDate),
      windowStart: new Date(result.windowStart),
      crossoverAt: result.crossoverAt ? new Date(result.crossoverAt) : null,
    })),
  };
}

export function serializePeriodAnalysis(
  analysis: PeriodAggregateResult,
): SerializedPeriodAggregateResult {
  return {
    periodDays: analysis.periodDays,
    totalBets: analysis.totalBets,
    eligibleBets: analysis.eligibleBets,
    leadersWhoWon: analysis.leadersWhoWon,
    winRate: analysis.winRate,
    avgFinalPlace: analysis.avgFinalPlace,
    placeDistribution: analysis.placeDistribution,
    leaderPriceWinRates: analysis.leaderPriceWinRates,
    dipSlabWinRates: analysis.dipSlabWinRates,
    aggregateEvolution: analysis.aggregateEvolution,
    betResults: analysis.betResults.map((result) => ({
      betId: result.betId,
      betName: result.betName,
      closeDate: result.closeDate.toISOString(),
      checkDate: result.checkDate.toISOString(),
      periodDays: result.periodDays,
      hasEnoughHistory: result.hasEnoughHistory,
      leaderAtCheck: result.leaderAtCheck,
      leaderPriceAtCheck: result.leaderPriceAtCheck,
      leaderRankAtCheck: result.leaderRankAtCheck,
      leaderFinalPlace: result.leaderFinalPlace,
      leaderWon: result.leaderWon,
      actualWinner: result.actualWinner,
      winnerNames: result.winnerNames,
      leaderStartSlab: result.leaderStartSlab,
      dipSlabsTouched: result.dipSlabsTouched,
      leaderMinPriceInWindow: result.leaderMinPriceInWindow,
    })),
  };
}

export function deserializePeriodAnalysis(
  analysis: SerializedPeriodAggregateResult,
): PeriodAggregateResult {
  return {
    ...analysis,
    dipSlabWinRates: analysis.dipSlabWinRates ?? [],
    betResults: analysis.betResults.map((result) => ({
      ...result,
      closeDate: new Date(result.closeDate),
      checkDate: new Date(result.checkDate),
      periodChartData: [],
      leaderStartSlab: result.leaderStartSlab ?? null,
      dipSlabsTouched: result.dipSlabsTouched ?? [],
      leaderMinPriceInWindow: result.leaderMinPriceInWindow ?? null,
    })),
  };
}
