"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SpendingChartProps {
  data: { date: string; total: number }[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(Math.abs(value));
}

export function SpendingChart({ data }: SpendingChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    total: Math.abs(d.total),
    label: formatDate(d.date),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">הוצאות - 30 ימים אחרונים</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "הוצאות"]}
                labelFormatter={(label) => `תאריך: ${label}`}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  direction: "rtl",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#colorSpending)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
