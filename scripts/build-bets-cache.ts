import fs from "node:fs";
import path from "node:path";
import { analyzeFirstCrossover } from "@/lib/analyses/first-crossover";
import { analyzePeriodPerformance } from "@/lib/analyses/period-performance";
import { PERIOD_OPTIONS } from "@/lib/analyses/types";
import {
  type BetsCacheFile,
  getCacheFilePath,
  serializeBet,
  serializeFirstCrossoverAnalysis,
  serializePeriodAnalysis,
} from "@/lib/parser/bets-cache";
import { loadAllBetsFromExcel } from "@/lib/parser/load-bets";

export function buildBetsCache(): BetsCacheFile {
  console.log("Building bets cache from Excel files...");
  const started = Date.now();
  const { bets, failures } = loadAllBetsFromExcel();

  const periodPerformance: BetsCacheFile["periodPerformance"] = {};
  const firstCrossover: BetsCacheFile["firstCrossover"] = {};
  for (const days of PERIOD_OPTIONS) {
    console.log(`  Precomputing ${days}-day period analysis...`);
    periodPerformance[String(days)] = serializePeriodAnalysis(
      analyzePeriodPerformance(bets, days),
    );
    console.log(`  Precomputing ${days}-day first crossover analysis...`);
    firstCrossover[String(days)] = serializeFirstCrossoverAnalysis(
      analyzeFirstCrossover(bets, days),
    );
  }

  const cache: BetsCacheFile = {
    version: 1,
    generatedAt: new Date().toISOString(),
    bets: bets.map(serializeBet),
    failures,
    periodPerformance,
    firstCrossover,
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
