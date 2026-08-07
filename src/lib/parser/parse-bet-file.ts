import * as XLSX from "xlsx";
import type { BetMarket, CandidateSeries, PricePoint } from "@/lib/models/types";

const COLUMN_ALIASES: Record<string, string[]> = {
  loggedAt: ["logged at", "logged_at", "date", "timestamp", "time"],
  section: ["section", "candidate", "name", "market"],
  price: [
    "displayed market price",
    "market price",
    "price",
    "displayed price",
  ],
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

function parsePrice(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const cleaned = String(value).replace(/[$,\s]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelEpoch.getTime() + value * 86_400_000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function betNameFromFilename(filename: string): string {
  return filename
    .replace(/\.(xlsx|xls|csv)$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseSheetRows(
  sheet: XLSX.WorkSheet,
  candidateName: string,
): PricePoint[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (rows.length < 2) return [];

  const headers = (rows[0] as unknown[]).map(normalizeHeader);
  const loggedAtIdx = findColumnIndex(headers, COLUMN_ALIASES.loggedAt);
  const priceIdx = findColumnIndex(headers, COLUMN_ALIASES.price);

  if (loggedAtIdx === -1 || priceIdx === -1) {
    return [];
  }

  const points: PricePoint[] = [];

  for (const row of rows.slice(1)) {
    if (!Array.isArray(row)) continue;

    const loggedAt = parseDate(row[loggedAtIdx]);
    const price = parsePrice(row[priceIdx]);

    if (!loggedAt || price == null) continue;

    points.push({ loggedAt, price });
  }

  return points.sort((a, b) => a.loggedAt.getTime() - b.loggedAt.getTime());
}

function parseSheetBySections(sheet: XLSX.WorkSheet): CandidateSeries[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (rows.length < 2) return [];

  const headers = (rows[0] as unknown[]).map(normalizeHeader);
  const loggedAtIdx = findColumnIndex(headers, COLUMN_ALIASES.loggedAt);
  const sectionIdx = findColumnIndex(headers, COLUMN_ALIASES.section);
  const priceIdx = findColumnIndex(headers, COLUMN_ALIASES.price);

  if (loggedAtIdx === -1 || sectionIdx === -1 || priceIdx === -1) {
    return [];
  }

  const byCandidate = new Map<string, PricePoint[]>();

  for (const row of rows.slice(1)) {
    if (!Array.isArray(row)) continue;

    const loggedAt = parseDate(row[loggedAtIdx]);
    const candidate = String(row[sectionIdx] ?? "").trim();
    const price = parsePrice(row[priceIdx]);

    if (!loggedAt || !candidate || price == null) continue;

    const points = byCandidate.get(candidate) ?? [];
    points.push({ loggedAt, price });
    byCandidate.set(candidate, points);
  }

  return [...byCandidate.entries()]
    .map(([name, points]) => ({
      name,
      points: points.sort(
        (a, b) => a.loggedAt.getTime() - b.loggedAt.getTime(),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function parseMultiSheetWorkbook(workbook: XLSX.WorkBook): CandidateSeries[] {
  const candidates: CandidateSeries[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const points = parseSheetRows(sheet, sheetName);

    if (points.length > 0) {
      candidates.push({ name: sheetName, points });
    }
  }

  return candidates.sort((a, b) => a.name.localeCompare(b.name));
}

export function parseWorkbookBuffer(
  buffer: Buffer,
  filename: string,
): BetMarket {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

  if (workbook.SheetNames.length === 0) {
    throw new Error(`No sheets found in ${filename}`);
  }

  let candidates: CandidateSeries[];

  if (workbook.SheetNames.length > 1) {
    candidates = parseMultiSheetWorkbook(workbook);
  } else {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    candidates = parseSheetBySections(sheet);

    if (candidates.length === 0) {
      const points = parseSheetRows(sheet, workbook.SheetNames[0]);
      if (points.length > 0) {
        candidates = [{ name: workbook.SheetNames[0], points }];
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error(`No valid price rows found in ${filename}`);
  }

  const allPoints = candidates.flatMap((candidate) => candidate.points);
  const startDate = new Date(
    Math.min(...allPoints.map((point) => point.loggedAt.getTime())),
  );
  const endDate = new Date(
    Math.max(...allPoints.map((point) => point.loggedAt.getTime())),
  );

  const id = filename.replace(/\.(xlsx|xls|csv)$/i, "");

  return {
    id,
    name: betNameFromFilename(filename),
    filename,
    candidates,
    startDate,
    endDate,
  };
}
