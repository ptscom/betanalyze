"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PeriodDays, ReversalPeriodDays } from "@/lib/analyses/types";
import { PERIOD_OPTIONS, REVERSAL_PERIOD_OPTIONS } from "@/lib/analyses/types";

interface PeriodSelectorProps {
  selected: PeriodDays;
}

export function PeriodSelector({ selected }: PeriodSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectPeriod(days: PeriodDays) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(days));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-1">
      {PERIOD_OPTIONS.map((days) => (
        <button
          key={days}
          type="button"
          onClick={() => selectPeriod(days)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            selected === days
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {days}-day check
        </button>
      ))}
    </div>
  );
}

interface ReversalPeriodSelectorProps {
  selected: ReversalPeriodDays;
}

export function ReversalPeriodSelector({
  selected,
}: ReversalPeriodSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectPeriod(days: ReversalPeriodDays) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(days));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-1">
      {REVERSAL_PERIOD_OPTIONS.map((days) => (
        <button
          key={days}
          type="button"
          onClick={() => selectPeriod(days)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            selected === days
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {days}-day window
        </button>
      ))}
    </div>
  );
}

interface AnalysisNavProps {
  active: "period-performance" | "first-crossover" | "rise-in-ma" | "reversal";
}

export function AnalysisNav({ active }: AnalysisNavProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      <Link
        href="/analyze/period-performance?days=14"
        className={`rounded-full px-4 py-2 text-sm font-medium ${
          active === "period-performance"
            ? "bg-blue-600 text-white"
            : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
        }`}
      >
        Period wise Performance
      </Link>
      <Link
        href="/analyze/first-crossover?days=14"
        className={`rounded-full px-4 py-2 text-sm font-medium ${
          active === "first-crossover"
            ? "bg-blue-600 text-white"
            : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
        }`}
      >
        First Crossover
      </Link>
      <Link
        href="/analyze/rise-in-ma?days=14"
        className={`rounded-full px-4 py-2 text-sm font-medium ${
          active === "rise-in-ma"
            ? "bg-blue-600 text-white"
            : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
        }`}
      >
        Rise in MA
      </Link>
      <Link
        href="/analyze/reversal?days=14"
        className={`rounded-full px-4 py-2 text-sm font-medium ${
          active === "reversal"
            ? "bg-blue-600 text-white"
            : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
        }`}
      >
        Reversal
      </Link>
    </nav>
  );
}
