"use client";

import { useEffect, useState, useCallback } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { AccountBreakdown } from "@/components/dashboard/account-card";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalSpending: number;
  spendingByCategory: { category: string; total: number; count: number }[];
  spendingByAccount: { accountId: number; accountName: string; total: number }[];
  dailySpending: { date: string; total: number }[];
  pendingTransactions: number;
  recentTransactions: {
    id: number;
    description: string;
    chargedAmount: number;
    category: string | null;
    date: string;
    accountName: string | null;
    status: string | null;
  }[];
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[340px] rounded-xl" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayStats, setTodayStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    // Read owner from parent layout's data attribute
    const mainEl = document.querySelector("main[data-owner]");
    const owner = mainEl?.getAttribute("data-owner") || "all";

    try {
      const [monthRes, todayRes] = await Promise.all([
        fetch(`/api/stats?period=month&owner=${owner}`),
        fetch(`/api/stats?period=today&owner=${owner}`),
      ]);
      const monthData = await monthRes.json();
      const todayData = await todayRes.json();
      setStats(monthData);
      setTodayStats(todayData);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Re-fetch when owner changes
    const observer = new MutationObserver(() => {
      setLoading(true);
      fetchStats();
    });

    const mainEl = document.querySelector("main[data-owner]");
    if (mainEl) {
      observer.observe(mainEl, { attributes: true, attributeFilter: ["data-owner"] });
    }

    return () => observer.disconnect();
  }, [fetchStats]);

  if (loading || !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">סקירה כללית</h2>
        <p className="text-muted-foreground text-sm mt-1">מבט על המצב הפיננסי שלך</p>
      </div>

      <StatsCards
        monthSpending={stats.totalSpending}
        totalSpending={stats.totalSpending}
        todaySpending={todayStats?.totalSpending || 0}
        pendingCount={stats.pendingTransactions}
      />

      <SpendingChart data={stats.dailySpending} />

      <div className="grid lg:grid-cols-2 gap-4">
        <CategoryBreakdown data={stats.spendingByCategory} />
        <AccountBreakdown data={stats.spendingByAccount} />
      </div>

      <RecentTransactions transactions={stats.recentTransactions} />
    </div>
  );
}
