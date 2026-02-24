"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface AccountBreakdownProps {
  data: { accountId: number; accountName: string; total: number }[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(Math.abs(amount));
}

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f97316", "#22c55e", "#0ea5e9"];

export function AccountBreakdown({ data }: AccountBreakdownProps) {
  const chartData = data.map((d, i) => ({
    name: d.accountName,
    total: Math.abs(d.total),
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }));

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <h3 className="text-base font-semibold mb-4">לפי כרטיס / חשבון</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "הוצאות"]}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  direction: "rtl",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
