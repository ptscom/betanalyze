import type {
  BetMarket,
  Strategy,
  StrategyResult,
  StrategySummary,
} from "@/lib/models/types";
import { computeBetOutcomes } from "@/lib/engine/outcomes";
import { allStrategies } from "@/lib/strategies";

export function runStrategyOnBet(
  strategy: Strategy,
  bet: BetMarket,
): StrategyResult {
  const outcomes = computeBetOutcomes(bet);
  return strategy.run(bet, outcomes);
}

export function runStrategyAcrossBets(
  strategy: Strategy,
  bets: BetMarket[],
): StrategyResult[] {
  return bets.map((bet) => runStrategyOnBet(strategy, bet));
}

export function summarizeStrategyResults(
  strategy: Strategy,
  results: StrategyResult[],
): StrategySummary {
  const withSignal = results.filter((result) => result.pickedCandidate != null);
  const wins = withSignal.filter((result) => result.pickedWon).length;
  const places = withSignal
    .map((result) => result.pickedPlace)
    .filter((place): place is number => place != null);

  const placeDistribution: Record<number, number> = {};
  for (const place of places) {
    placeDistribution[place] = (placeDistribution[place] ?? 0) + 1;
  }

  const avgPlace =
    places.length > 0
      ? places.reduce((sum, place) => sum + place, 0) / places.length
      : null;

  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    totalBets: results.length,
    betsWithSignal: withSignal.length,
    wins,
    winRate: withSignal.length > 0 ? wins / withSignal.length : 0,
    avgPlace,
    placeDistribution,
  };
}

export function runFullBacktest(bets: BetMarket[]): {
  resultsByStrategy: Record<string, StrategyResult[]>;
  summaries: StrategySummary[];
} {
  const resultsByStrategy: Record<string, StrategyResult[]> = {};
  const summaries: StrategySummary[] = [];

  for (const strategy of allStrategies) {
    const results = runStrategyAcrossBets(strategy, bets);
    resultsByStrategy[strategy.id] = results;
    summaries.push(summarizeStrategyResults(strategy, results));
  }

  return { resultsByStrategy, summaries };
}
