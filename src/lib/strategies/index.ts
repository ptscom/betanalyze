import type {
  BetMarket,
  BetOutcomes,
  Strategy,
  StrategyResult,
  StrategySignal,
} from "@/lib/models/types";
import { getCandidateOutcome } from "@/lib/engine/outcomes";
import {
  buildAlignedTimeline,
  getBetWindowStart,
  getDailyClosingPrices,
  getTimelineSince,
} from "@/lib/engine/timeline";
import {
  findFirstCrossover,
  findLatestCrossover,
} from "@/lib/engine/crossover";
import { findMomentumSignal } from "@/lib/engine/moving-average";

function buildResult(
  strategy: Strategy,
  bet: BetMarket,
  outcomes: BetOutcomes,
  signals: StrategySignal[],
  pickedCandidate: string | null,
): StrategyResult {
  const pickedOutcome = pickedCandidate
    ? getCandidateOutcome(outcomes, pickedCandidate)
    : null;

  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    betId: bet.id,
    betName: bet.name,
    signals,
    pickedCandidate,
    pickedPlace: pickedOutcome?.place ?? null,
    pickedWon: pickedOutcome?.isWinner ?? null,
    winner: outcomes.winner,
  };
}

export const earlyMoverStrategy: Strategy = {
  id: "early-mover",
  name: "Early Mover",
  description:
    "Picks the candidate with the highest opening market price (first recorded price).",
  run(bet, outcomes) {
    const ranked = bet.candidates
      .map((candidate) => ({
        name: candidate.name,
        openingPrice: candidate.points[0]?.price ?? 0,
        openingAt: candidate.points[0]?.loggedAt ?? bet.startDate,
      }))
      .sort((a, b) => b.openingPrice - a.openingPrice);

    const leader = ranked[0];
    if (!leader || leader.openingPrice <= 0) {
      return buildResult(earlyMoverStrategy, bet, outcomes, [], null);
    }

    const signals: StrategySignal[] = ranked.map((entry, index) => ({
      candidate: entry.name,
      triggeredAt: entry.openingAt,
      metadata: {
        openingPrice: entry.openingPrice,
        openingRank: index + 1,
      },
    }));

    return buildResult(
      earlyMoverStrategy,
      bet,
      outcomes,
      signals,
      leader.name,
    );
  },
};

export const firstCrossoverStrategy: Strategy = {
  id: "first-crossover",
  name: "First Crossover",
  description:
    "Picks the candidate who first crosses above the market leader during the full bet timeline.",
  run(bet, outcomes) {
    const timeline = buildAlignedTimeline(bet);
    const crossover = findFirstCrossover(timeline);

    if (!crossover) {
      return buildResult(firstCrossoverStrategy, bet, outcomes, [], null);
    }

    const signals: StrategySignal[] = [
      {
        candidate: crossover.newTopper,
        triggeredAt: crossover.loggedAt,
        metadata: {
          previousTopper: crossover.previousTopper ?? "none",
          newTopperPrice: crossover.newTopperPrice,
          previousTopperPrice: crossover.previousTopperPrice,
        },
      },
    ];

    return buildResult(
      firstCrossoverStrategy,
      bet,
      outcomes,
      signals,
      crossover.newTopper,
    );
  },
};

export const latestCrossoverStrategy: Strategy = {
  id: "latest-crossover",
  name: "Latest Crossover (2 weeks)",
  description:
    "Picks the candidate from the most recent leader change within the final 14 days of the bet.",
  run(bet, outcomes) {
    const timeline = buildAlignedTimeline(bet);
    const windowStart = getBetWindowStart(bet, 14);
    const recentTimeline = getTimelineSince(timeline, windowStart);
    const crossover = findLatestCrossover(recentTimeline);

    if (!crossover) {
      return buildResult(latestCrossoverStrategy, bet, outcomes, [], null);
    }

    const signals: StrategySignal[] = [
      {
        candidate: crossover.newTopper,
        triggeredAt: crossover.loggedAt,
        metadata: {
          previousTopper: crossover.previousTopper ?? "none",
          newTopperPrice: crossover.newTopperPrice,
          previousTopperPrice: crossover.previousTopperPrice,
          windowDays: 14,
        },
      },
    ];

    return buildResult(
      latestCrossoverStrategy,
      bet,
      outcomes,
      signals,
      crossover.newTopper,
    );
  },
};

export const momentumMaStrategy: Strategy = {
  id: "momentum-ma",
  name: "5-Day MA Momentum",
  description:
    "Picks the first candidate above $0.20 with three consecutive daily increases in their 5-day moving average.",
  run(bet, outcomes) {
    const dailyByCandidate = getDailyClosingPrices(bet);
    const signals: StrategySignal[] = [];
    let earliestPick: StrategySignal | null = null;

    for (const [candidate, dailyPrices] of dailyByCandidate.entries()) {
      const signal = findMomentumSignal(dailyPrices, {
        minPrice: 0.2,
        windowSize: 5,
        consecutiveIncreases: 3,
      });

      if (!signal) continue;

      const strategySignal: StrategySignal = {
        candidate,
        triggeredAt: signal.day,
        metadata: {
          price: signal.price,
          movingAverage: signal.movingAverage,
          minPrice: 0.2,
          windowSize: 5,
          consecutiveIncreases: 3,
        },
      };

      signals.push(strategySignal);

      if (
        !earliestPick ||
        strategySignal.triggeredAt.getTime() < earliestPick.triggeredAt.getTime()
      ) {
        earliestPick = strategySignal;
      }
    }

    return buildResult(
      momentumMaStrategy,
      bet,
      outcomes,
      signals.sort(
        (a, b) => a.triggeredAt.getTime() - b.triggeredAt.getTime(),
      ),
      earliestPick?.candidate ?? null,
    );
  },
};

export const allStrategies: Strategy[] = [
  earlyMoverStrategy,
  firstCrossoverStrategy,
  latestCrossoverStrategy,
  momentumMaStrategy,
];

export function getStrategyById(strategyId: string): Strategy | undefined {
  return allStrategies.find((strategy) => strategy.id === strategyId);
}
