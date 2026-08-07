import fs from "node:fs";
import path from "node:path";
import type { BetMarket } from "@/lib/models/types";
import type { PeriodAggregateResult, PeriodDays } from "@/lib/analyses/types";
import {
  type BetsCacheFile,
  deserializeBet,
  deserializePeriodAnalysis,
  getCacheFilePath,
} from "@/lib/parser/bets-cache";
import { parseWorkbookBuffer } from "@/lib/parser/parse-bet-file";

const SUPPORTED_EXTENSIONS = new Set([".xlsx", ".xls", ".csv"]);

export function getBetsDirectory(): string {
  return path.join(process.cwd(), "data", "bets");
}

export function listBetFilenames(): string[] {
  const betsDir = getBetsDirectory();
  if (!fs.existsSync(betsDir)) return [];

  return fs
    .readdirSync(betsDir)
    .filter((filename) =>
      SUPPORTED_EXTENSIONS.has(path.extname(filename).toLowerCase()),
    )
    .sort((a, b) => a.localeCompare(b));
}

export interface LoadedBet {
  bet: BetMarket;
  error?: never;
}

export interface FailedBet {
  bet?: never;
  filename: string;
  error: string;
}

export type BetLoadResult = LoadedBet | FailedBet;

interface LoadedBetsData {
  bets: BetMarket[];
  failures: FailedBet[];
  periodPerformance: Map<PeriodDays, PeriodAggregateResult>;
}

let memoryCache: LoadedBetsData | null = null;

function isCacheStale(cachePath: string): boolean {
  if (!fs.existsSync(cachePath)) return true;

  const betsDir = getBetsDirectory();
  if (!fs.existsSync(betsDir)) return false;

  const cacheMtime = fs.statSync(cachePath).mtimeMs;
  const entries = fs.readdirSync(betsDir);

  for (const filename of entries) {
    if (!SUPPORTED_EXTENSIONS.has(path.extname(filename).toLowerCase())) {
      continue;
    }
    const fileMtime = fs.statSync(path.join(betsDir, filename)).mtimeMs;
    if (fileMtime > cacheMtime) {
      return true;
    }
  }

  return false;
}

function loadFromCacheFile(cachePath: string): LoadedBetsData {
  const raw = JSON.parse(
    fs.readFileSync(cachePath, "utf8"),
  ) as BetsCacheFile;

  const periodPerformance = new Map<PeriodDays, PeriodAggregateResult>();
  for (const [days, analysis] of Object.entries(raw.periodPerformance)) {
    periodPerformance.set(
      Number(days) as PeriodDays,
      deserializePeriodAnalysis(analysis),
    );
  }

  return {
    bets: raw.bets.map(deserializeBet).sort((a, b) => a.name.localeCompare(b.name)),
    failures: raw.failures,
    periodPerformance,
  };
}

function ensureCacheLoaded(): LoadedBetsData {
  if (memoryCache) {
    return memoryCache;
  }

  const cachePath = getCacheFilePath();

  if (!isCacheStale(cachePath)) {
    memoryCache = loadFromCacheFile(cachePath);
    return memoryCache;
  }

  const { bets, failures } = loadAllBetsFromExcel();
  memoryCache = {
    bets,
    failures,
    periodPerformance: new Map(),
  };

  return memoryCache;
}

export function loadBetFromFilename(filename: string): BetLoadResult {
  const filePath = path.join(getBetsDirectory(), filename);

  try {
    const buffer = fs.readFileSync(filePath);
    return { bet: parseWorkbookBuffer(buffer, filename) };
  } catch (error) {
    return {
      filename,
      error: error instanceof Error ? error.message : "Unknown parse error",
    };
  }
}

export function loadAllBetsFromExcel(): {
  bets: BetMarket[];
  failures: FailedBet[];
} {
  const filenames = listBetFilenames();
  const bets: BetMarket[] = [];
  const failures: FailedBet[] = [];

  for (const filename of filenames) {
    const result = loadBetFromFilename(filename);
    if ("bet" in result && result.bet) {
      bets.push(result.bet);
    } else if ("error" in result) {
      failures.push(result);
    }
  }

  bets.sort((a, b) => a.name.localeCompare(b.name));
  return { bets, failures };
}

export function loadAllBets(): {
  bets: BetMarket[];
  failures: FailedBet[];
} {
  const data = ensureCacheLoaded();
  return { bets: data.bets, failures: data.failures };
}

export function loadBetById(betId: string): BetMarket | null {
  const { bets } = loadAllBets();
  return bets.find((bet) => bet.id === betId) ?? null;
}

export function getCachedPeriodPerformance(
  periodDays: PeriodDays,
): PeriodAggregateResult | null {
  const data = ensureCacheLoaded();
  return data.periodPerformance.get(periodDays) ?? null;
}

export function clearBetsMemoryCache(): void {
  memoryCache = null;
}
