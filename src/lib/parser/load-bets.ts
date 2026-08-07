import fs from "node:fs";
import path from "node:path";
import type { BetMarket } from "@/lib/models/types";
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

export function loadAllBets(): {
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

export function loadBetById(betId: string): BetMarket | null {
  const filenames = listBetFilenames();
  const match = filenames.find(
    (filename) => filename.replace(/\.(xlsx|xls|csv)$/i, "") === betId,
  );

  if (!match) return null;

  const result = loadBetFromFilename(match);
  return "bet" in result && result.bet ? result.bet : null;
}
