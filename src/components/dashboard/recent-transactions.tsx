"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS } from "@/lib/categories/default-rules";

interface Transaction {
  id: number;
  description: string;
  chargedAmount: number;
  category: string | null;
  date: string;
  accountName: string | null;
  status: string | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "היום";
  if (d.toDateString() === yesterday.toDateString()) return "אתמול";
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">עסקאות אחרונות</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {transactions.length === 0 && (
            <p className="p-6 text-center text-muted-foreground text-sm">אין עסקאות עדיין</p>
          )}
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[txn.category || ""] || "#94a3b8" }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{txn.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{txn.accountName}</span>
                    {txn.category && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {txn.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-left shrink-0 mr-4">
                <p className="text-sm font-semibold tabular-nums text-destructive">
                  {formatCurrency(txn.chargedAmount)}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(txn.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
