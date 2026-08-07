import * as XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";

interface CandidateConfig {
  name: string;
  prices: number[];
}

interface BetConfig {
  filename: string;
  startDate: string;
  intervalHours: number;
  candidates: CandidateConfig[];
}

const SAMPLE_BETS: BetConfig[] = [
  {
    filename: "2026-alabama-governor-dem-primary.xlsx",
    startDate: "2026-03-01T16:00:00-08:00",
    intervalHours: 24,
    candidates: [
      {
        name: "Yolanda Flowers",
        prices: [
          0.01, 0.01, 0.02, 0.02, 0.03, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08,
          0.1, 0.12, 0.15, 0.18, 0.22, 0.28, 0.35, 0.42, 0.5, 0.58, 0.65, 0.72,
          0.78, 0.84, 0.9, 0.94, 0.96, 0.97, 0.98,
        ],
      },
      {
        name: "Malika Sanders-Fortier",
        prices: [
          0.45, 0.44, 0.43, 0.42, 0.4, 0.38, 0.36, 0.34, 0.32, 0.3, 0.28, 0.26,
          0.24, 0.22, 0.2, 0.18, 0.16, 0.14, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04,
          0.03, 0.02, 0.02, 0.01, 0.01, 0.01,
        ],
      },
      {
        name: "James Fields",
        prices: [
          0.35, 0.36, 0.37, 0.38, 0.39, 0.38, 0.37, 0.36, 0.35, 0.34, 0.33, 0.32,
          0.31, 0.3, 0.29, 0.28, 0.27, 0.26, 0.25, 0.24, 0.23, 0.22, 0.21, 0.2,
          0.19, 0.18, 0.17, 0.16, 0.15, 0.14,
        ],
      },
    ],
  },
  {
    filename: "2026-senate-race-michigan.xlsx",
    startDate: "2026-01-15T12:00:00-05:00",
    intervalHours: 48,
    candidates: [
      {
        name: "Candidate A",
        prices: [
          0.52, 0.53, 0.54, 0.55, 0.56, 0.55, 0.54, 0.53, 0.52, 0.51, 0.5, 0.49,
          0.48, 0.47, 0.46, 0.45, 0.44, 0.43, 0.42, 0.41,
        ],
      },
      {
        name: "Candidate B",
        prices: [
          0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.33, 0.36, 0.4, 0.44, 0.48, 0.52,
          0.56, 0.6, 0.64, 0.68, 0.72, 0.76, 0.8, 0.92,
        ],
      },
      {
        name: "Candidate C",
        prices: [
          0.28, 0.25, 0.24, 0.19, 0.18, 0.15, 0.14, 0.13, 0.12, 0.11, 0.1, 0.09,
          0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01,
        ],
      },
    ],
  },
  {
    filename: "2026-mayor-nyc.xlsx",
    startDate: "2026-02-01T09:00:00-05:00",
    intervalHours: 36,
    candidates: [
      {
        name: "Incumbent",
        prices: [
          0.62, 0.61, 0.6, 0.59, 0.58, 0.57, 0.56, 0.55, 0.54, 0.53, 0.52, 0.51,
          0.5, 0.49, 0.48, 0.47, 0.46, 0.45, 0.44, 0.43, 0.42, 0.41, 0.4, 0.39,
          0.38,
        ],
      },
      {
        name: "Challenger",
        prices: [
          0.15, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21, 0.22, 0.23, 0.24, 0.25, 0.26,
          0.27, 0.28, 0.29, 0.3, 0.31, 0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38,
          0.39,
        ],
      },
      {
        name: "Third Party",
        prices: [
          0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23,
          0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23, 0.23,
          0.23,
        ],
      },
    ],
  },
];

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function buildRows(config: BetConfig): string[][] {
  const headers = [
    "Logged At",
    "Section",
    "Side",
    "Displayed Market Price",
    "Potential Payout If Correct",
    "Potential Profit If Correct",
    "Average Fill Price",
    "Fill Status",
    "Market Status",
  ];

  const rows: string[][] = [headers];
  const start = new Date(config.startDate);

  for (const candidate of config.candidates) {
    candidate.prices.forEach((price, index) => {
      const loggedAt = new Date(
        start.getTime() + index * config.intervalHours * 3_600_000,
      );
      const payout = price > 0 ? 100 / price : 0;
      const profit = payout - 100;

      rows.push([
        formatTimestamp(loggedAt),
        candidate.name,
        "Yes",
        `$${price.toFixed(2)}`,
        `$${payout.toFixed(2)}`,
        `$${profit.toFixed(2)}`,
        `$${price.toFixed(2)}`,
        "Historical Estimate",
        "Closed",
      ]);
    });
  }

  return rows;
}

function main() {
  const outputDir = path.join(process.cwd(), "data", "bets");
  fs.mkdirSync(outputDir, { recursive: true });

  for (const bet of SAMPLE_BETS) {
    const rows = buildRows(bet);
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Market Data");
    const outputPath = path.join(outputDir, bet.filename);
    XLSX.writeFile(workbook, outputPath);
    console.log(`Wrote ${outputPath}`);
  }
}

main();
