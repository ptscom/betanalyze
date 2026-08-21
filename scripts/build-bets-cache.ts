import fs from "node:fs";
import path from "node:path";
import { analyzeFirstCrossover } from "@/lib/analyses/first-crossover";
import {
  analyzeConsecutiveDownDays,
  analyzeConsecutiveUpDays,
} from "@/lib/analyses/consecutive-days";
import {
  analyzeGapDecrease,
  analyzeGapIncrease,
} from "@/lib/analyses/gap-change";
import { analyzePeriodPerformance } from "@/lib/analyses/period-performance";
import { analyzeReversalOccurrence } from "@/lib/analyses/reversal-occurrence";
import { analyzeRiseInMa } from "@/lib/analyses/rise-in-ma";
import {
  CONSECUTIVE_STREAK_OPTIONS,
  PERIOD_OPTIONS,
  consecutiveDaysCacheKey,
  reversalOccurrenceCacheKey,
} from "@/lib/analyses/types";
import {
  type BetsCacheFile,
  getCacheFilePath,
  serializeBet,
  serializeConsecutiveDaysAnalysis,
  serializeFirstCrossoverAnalysis,
  serializeGapChangeAnalysis,
  serializePeriodAnalysis,
  serializeReversalOccurrenceAnalysis,
  serializeRiseInMaAnalysis,
} from "@/lib/parser/bets-cache";
import { loadAllBetsFromExcel } from "@/lib/parser/load-bets";

export function buildBetsCache(): BetsCacheFile {
  console.log("Building bets cache from Excel files...");
  const started = Date.now();
  const { bets, failures } = loadAllBetsFromExcel();

  const periodPerformance: BetsCacheFile["periodPerformance"] = {};
  const firstCrossover: BetsCacheFile["firstCrossover"] = {};
  const riseInMa: BetsCacheFile["riseInMa"] = {};
  const gapDecrease: BetsCacheFile["gapDecrease"] = {};
  const gapIncrease: BetsCacheFile["gapIncrease"] = {};
  const consecutiveUp: BetsCacheFile["consecutiveUp"] = {};
  const consecutiveDown: BetsCacheFile["consecutiveDown"] = {};
  const reversalOccurrence: BetsCacheFile["reversalOccurrence"] = {};
  for (const days of PERIOD_OPTIONS) {
    console.log(`  Precomputing ${days}-day period analysis...`);
    periodPerformance[String(days)] = serializePeriodAnalysis(
      analyzePeriodPerformance(bets, days),
    );
    console.log(`  Precomputing ${days}-day first crossover analysis...`);
    firstCrossover[String(days)] = serializeFirstCrossoverAnalysis(
      analyzeFirstCrossover(bets, days),
    );
    console.log(`  Precomputing ${days}-day rise in MA analysis...`);
    riseInMa[String(days)] = serializeRiseInMaAnalysis(
      analyzeRiseInMa(bets, days),
    );
    console.log(`  Precomputing ${days}-day gap decrease analysis...`);
    gapDecrease[String(days)] = serializeGapChangeAnalysis(
      analyzeGapDecrease(bets, days),
    );
    console.log(`  Precomputing ${days}-day gap increase analysis...`);
    gapIncrease[String(days)] = serializeGapChangeAnalysis(
      analyzeGapIncrease(bets, days),
    );
    for (const streak of CONSECUTIVE_STREAK_OPTIONS) {
      console.log(
        `  Precomputing ${days}-day consecutive up (${streak} days) analysis...`,
      );
      consecutiveUp[consecutiveDaysCacheKey(days, "up", streak)] =
        serializeConsecutiveDaysAnalysis(
          analyzeConsecutiveUpDays(bets, days, streak),
        );
      console.log(
        `  Precomputing ${days}-day consecutive down (${streak} days) analysis...`,
      );
      consecutiveDown[consecutiveDaysCacheKey(days, "down", streak)] =
        serializeConsecutiveDaysAnalysis(
          analyzeConsecutiveDownDays(bets, days, streak),
        );
    }
    console.log(`  Precomputing ${days}-day reversal occurrence analysis...`);
    reversalOccurrence[reversalOccurrenceCacheKey(days)] =
      serializeReversalOccurrenceAnalysis(
        analyzeReversalOccurrence(bets, days),
      );
  }

  const cache: BetsCacheFile = {
    version: 1,
    generatedAt: new Date().toISOString(),
    bets: bets.map(serializeBet),
    failures,
    periodPerformance,
    firstCrossover,
    riseInMa,
    gapDecrease,
    gapIncrease,
    consecutiveUp,
    consecutiveDown,
    reversalOccurrence,
  };

  const outputPath = getCacheFilePath();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(cache));

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const sizeMb = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(
    `Cache written: ${outputPath} (${sizeMb} MB, ${bets.length} bets, ${elapsed}s)`,
  );

  return cache;
}

buildBetsCache();
