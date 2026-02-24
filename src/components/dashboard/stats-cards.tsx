"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, CalendarDays, Clock, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardsProps {
  totalSpending: number;
  todaySpending: number;
  pendingCount: number;
  monthSpending: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

const cards = [
  {
    key: "month",
    label: "הוצאות החודש",
    icon: CalendarDays,
    getValue: (p: StatsCardsProps) => formatCurrency(p.monthSpending),
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    key: "total",
    label: "סה\"כ הוצאות",
    icon: TrendingDown,
    getValue: (p: StatsCardsProps) => formatCurrency(p.totalSpending),
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
  },
  {
    key: "today",
    label: "הוצאות היום",
    icon: Wallet,
    getValue: (p: StatsCardsProps) => formatCurrency(p.todaySpending),
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    key: "pending",
    label: "עסקאות ממתינות",
    icon: Clock,
    getValue: (p: StatsCardsProps) => p.pendingCount.toString(),
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
];

export function StatsCards(props: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs md:text-sm text-muted-foreground font-medium">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className={`text-xl md:text-2xl font-bold ${card.color}`}>
                {card.getValue(props)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
