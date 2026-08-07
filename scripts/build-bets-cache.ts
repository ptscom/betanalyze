import fs from "node:fs";
import path from "node:path";
import { analyzeFirstCrossover } from "@/lib/analyses/first-crossover";
import { analyzePeriodPerformance } from "@/lib/analyses/period-performance";
import { analyzeReversalOccurrence } from "@/lib/analyses/reversal-occurrence";
import { analyzeRiseInMa } from "@/lib/analyses/rise-in-ma";
import { PERIOD_OPTIONS, THRESHOLD_OPTIONS, reversalCacheKey } from "@/lib/analyses/types";
import {
  type BetsCacheFile,
  getCacheFilePath,
  serializeBet,
  serializeFirstCrossoverAnalysis,
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
    for (const threshold of THRESHOLD_OPTIONS) {
      console.log(
        `  Precomputing ${days}-day reversal occurrence (>${threshold})...`,
      );
      reversalOccurrence[reversalCacheKey(days, threshold)] =
        serializeReversalOccurrenceAnalysis(
          analyzeReversalOccurrence(bets, days, threshold),
        );
    }
  }

  const cache: BetsCacheFile = {
    version: 1,
    generatedAt: new Date().toISOString(),
    bets: bets.map(serializeBet),
    failures,
    periodPerformance,
    firstCrossover,
    riseInMa,
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
