"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BetMarket } from "@/lib/models/types";
import { formatDate } from "@/lib/utils/format";

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];

interface PriceChartProps {
  bet: BetMarket;
}

export function PriceChart({ bet }: PriceChartProps) {
  const timestamps = new Set<number>();
  for (const candidate of bet.candidates) {
    for (const point of candidate.points) {
      timestamps.add(point.loggedAt.getTime());
    }
  }

  const chartData = [...timestamps]
    .sort((a, b) => a - b)
    .map((timestamp) => {
      const row: Record<string, number | string> = {
        date: formatDate(new Date(timestamp)),
        timestamp,
      };

      for (const candidate of bet.candidates) {
        const latestPoint = candidate.points
          .filter((point) => point.loggedAt.getTime() <= timestamp)
          .at(-1);
        if (latestPoint) {
          row[candidate.name] = latestPoint.price;
        }
      }

      return row;
    });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            domain={[0, 1]}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
          />
          <Legend />
          {bet.candidates.map((candidate, index) => (
            <Line
              key={candidate.name}
              type="monotone"
              dataKey={candidate.name}
              stroke={COLORS[index % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
