import { format } from "date-fns";
import type { StrategyResult, StrategySummary } from "@/lib/models/types";

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatDate(value: Date): string {
  return format(value, "MMM d, yyyy");
}

export function formatPlace(place: number | null): string {
  if (place == null) return "—";
  const suffix =
    place % 10 === 1 && place % 100 !== 11
      ? "st"
      : place % 10 === 2 && place % 100 !== 12
        ? "2nd"
        : place % 10 === 3 && place % 100 !== 13
          ? "rd"
          : "th";
  return `${place}${suffix}`;
}

export function getResultStatus(result: StrategyResult): {
  label: string;
  tone: "win" | "loss" | "neutral";
} {
  if (!result.pickedCandidate) {
    return { label: "No signal", tone: "neutral" };
  }

  if (result.pickedWon) {
    return { label: "Winner", tone: "win" };
  }

  return { label: `Finished ${formatPlace(result.pickedPlace)}`, tone: "loss" };
}

export function sortSummariesByWinRate(
  summaries: StrategySummary[],
): StrategySummary[] {
  return [...summaries].sort((a, b) => b.winRate - a.winRate);
}
