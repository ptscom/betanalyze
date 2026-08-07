import { format } from "date-fns";

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
        ? "nd"
        : place % 10 === 3 && place % 100 !== 13
          ? "rd"
          : "th";
  return `${place}${suffix}`;
}
