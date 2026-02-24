"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { CATEGORY_COLORS, DEFAULT_CATEGORIES } from "@/lib/categories/default-rules";

interface Transaction {
  id: number;
  accountId: number;
  accountName: string | null;
  accountOwner: string | null;
  date: string;
  chargedAmount: number;
  description: string;
  category: string | null;
  status: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  memo: string | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const mainEl = document.querySelector("main[data-owner]");
    const owner = mainEl?.getAttribute("data-owner") || "all";

    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", "30");
    if (search) params.set("search", search);
    if (category !== "all") params.set("category", category);
    if (owner !== "all") params.set("owner", owner);

    try {
      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      console.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    fetchTransactions();

    const observer = new MutationObserver(() => {
      setPage(1);
      fetchTransactions();
    });
    const mainEl = document.querySelector("main[data-owner]");
    if (mainEl) {
      observer.observe(mainEl, { attributes: true, attributeFilter: ["data-owner"] });
    }
    return () => observer.disconnect();
  }, [fetchTransactions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, fetchTransactions]);

  const exportCSV = () => {
    const headers = ["תאריך", "תיאור", "סכום", "קטגוריה", "חשבון", "סטטוס"];
    const rows = transactions.map((t) => [
      t.date,
      t.description,
      t.chargedAmount,
      t.category || "",
      t.accountName || "",
      t.status === "pending" ? "ממתין" : "הושלם",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">עסקאות</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {total > 0 ? `${total} עסקאות` : "טוען..."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <Download className="h-3.5 w-3.5" />
          ייצוא CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש עסקאות..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              {DEFAULT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
              ))}
              <SelectItem value="אחר">אחר</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">לא נמצאו עסקאות</p>
          ) : (
            <div className="divide-y">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between px-4 md:px-6 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[txn.category || ""] || "#94a3b8" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{txn.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{formatDate(txn.date)}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{txn.accountName}</span>
                        {txn.installmentTotal && txn.installmentTotal > 1 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {txn.installmentNumber}/{txn.installmentTotal}
                          </Badge>
                        )}
                        {txn.status === "pending" && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">ממתין</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 mr-3">
                    {txn.category && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-2 py-0.5 hidden sm:inline-flex"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[txn.category] || "#94a3b8"}15`,
                          color: CATEGORY_COLORS[txn.category] || "#94a3b8",
                        }}
                      >
                        {txn.category}
                      </Badge>
                    )}
                    <span className={`text-sm font-semibold tabular-nums ${txn.chargedAmount < 0 ? "text-destructive" : "text-green-500"}`}>
                      {formatCurrency(txn.chargedAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            עמוד {page} מתוך {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
