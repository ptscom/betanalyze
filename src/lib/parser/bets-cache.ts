import fs from "node:fs";
import path from "node:path";
import type { BetMarket } from "@/lib/models/types";
import type {
  FirstCrossoverAggregateResult,
  PeriodAggregateResult,
  PeriodDays,
  ReversalOccurrenceAggregateResult,
  RiseInMaAggregateResult,
  ReversalThreshold,
} from "@/lib/analyses/types";
import { reversalCacheKey } from "@/lib/analyses/types";

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
}

export interface SerializedReversalOccurrenceBetResult {
  betId: string;
  betName: string;
  closeDate: string;
  windowStart: string;
  periodDays: PeriodDays;
  threshold: ReversalThreshold;
  hasEnoughHistory: boolean;
  hasHit: boolean;
  hitCandidate: string | null;
  hitPrice: number | null;
  hitAt: string | null;
  reversed: boolean;
  pickFinalPlace: number | null;
  heldOn: boolean;
  actualWinner: string | null;
}

export interface SerializedReversalOccurrenceAggregateResult {
  periodDays: PeriodDays;
  threshold: ReversalThreshold;
  totalBets: number;
  eligibleBets: number;
  reversals: number;
  reversalRate: number;
  heldOnCount: number;
  holdRate: number;
  placeDistribution: Record<number, number>;
  hitPriceOutcomes: ReversalOccurrenceAggregateResult["hitPriceOutcomes"];
  betResults: SerializedReversalOccurrenceBetResult[];
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
  reversalOccurrence: Record<string, SerializedReversalOccurrenceAggregateResult>;
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

export function serializeReversalOccurrenceAnalysis(
  analysis: ReversalOccurrenceAggregateResult,
): SerializedReversalOccurrenceAggregateResult {
  return {
    periodDays: analysis.periodDays,
    threshold: analysis.threshold,
    totalBets: analysis.totalBets,
    eligibleBets: analysis.eligibleBets,
    reversals: analysis.reversals,
    reversalRate: analysis.reversalRate,
    heldOnCount: analysis.heldOnCount,
    holdRate: analysis.holdRate,
    placeDistribution: analysis.placeDistribution,
    hitPriceOutcomes: analysis.hitPriceOutcomes,
    betResults: analysis.betResults.map((result) => ({
      betId: result.betId,
      betName: result.betName,
      closeDate: result.closeDate.toISOString(),
      windowStart: result.windowStart.toISOString(),
      periodDays: result.periodDays,
      threshold: result.threshold,
      hasEnoughHistory: result.hasEnoughHistory,
      hasHit: result.hasHit,
      hitCandidate: result.hitCandidate,
      hitPrice: result.hitPrice,
      hitAt: result.hitAt?.toISOString() ?? null,
      reversed: result.reversed,
      pickFinalPlace: result.pickFinalPlace,
      heldOn: result.heldOn,
      actualWinner: result.actualWinner,
    })),
  };
}

export function deserializeReversalOccurrenceAnalysis(
  analysis: SerializedReversalOccurrenceAggregateResult,
): ReversalOccurrenceAggregateResult {
  return {
    ...analysis,
    betResults: analysis.betResults.map((result) => ({
      ...result,
      closeDate: new Date(result.closeDate),
      windowStart: new Date(result.windowStart),
      hitAt: result.hitAt ? new Date(result.hitAt) : null,
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
    })),
  };
}

export function deserializePeriodAnalysis(
  analysis: SerializedPeriodAggregateResult,
): PeriodAggregateResult {
  return {
    ...analysis,
    betResults: analysis.betResults.map((result) => ({
      ...result,
      closeDate: new Date(result.closeDate),
      checkDate: new Date(result.checkDate),
      periodChartData: [],
    })),
  };
}
