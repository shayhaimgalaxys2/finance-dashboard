"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_COLORS } from "@/lib/categories/default-rules";

interface CategoryBreakdownProps {
  data: { category: string; total: number; count: number }[];
}

const FALLBACK_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#f59e0b", "#eab308", "#84cc16", "#22c55e",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(Math.abs(amount));
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const chartData = data
    .map((d) => ({
      ...d,
      total: Math.abs(d.total),
      fill: CATEGORY_COLORS[d.category] || FALLBACK_COLORS[data.indexOf(d) % FALLBACK_COLORS.length],
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const total = chartData.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">לפי קטגוריה</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="total"
                  paddingAngle={2}
                  stroke="none"
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), ""]}
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    direction: "rtl",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2 w-full">
            {chartData.map((item) => (
              <div key={item.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-muted-foreground">{item.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {total > 0 ? ((item.total / total) * 100).toFixed(0) : 0}%
                  </span>
                  <span className="font-medium tabular-nums">{formatCurrency(item.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
