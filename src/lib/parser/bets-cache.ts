import fs from "node:fs";
import path from "node:path";
import type { BetMarket } from "@/lib/models/types";
import type { PeriodAggregateResult, PeriodDays } from "@/lib/analyses/types";

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
