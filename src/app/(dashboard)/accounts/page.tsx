"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Building2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Account {
  id: number;
  name: string;
  companyId: string;
  owner: string;
  accountNumber: string | null;
  lastScrapedAt: string | null;
  isActive: boolean;
}

const COMPANY_LABELS: Record<string, string> = {
  beinleumi: "בנק הבינלאומי",
  visaCal: "ויזה כאל",
  max: "מקס",
  isracard: "ישראכרט",
  amex: "אמריקן אקספרס",
  hapoalim: "בנק הפועלים",
  leumi: "בנק לאומי",
  discount: "בנק דיסקונט",
  mizrahi: "בנק מזרחי",
  otsarHahayal: "אוצר החייל",
};

const COMPANY_ICONS: Record<string, string> = {
  beinleumi: "bank",
  hapoalim: "bank",
  leumi: "bank",
  discount: "bank",
  mizrahi: "bank",
  otsarHahayal: "bank",
  visaCal: "card",
  max: "card",
  isracard: "card",
  amex: "card",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapingId, setScrapingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {
      console.error("Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  }

  async function handleScrape(accountId: number) {
    setScrapingId(accountId);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      if (res.ok && data.results?.[0]?.status === "success") {
        toast.success(`נסרקו ${data.results[0].transactionsCount} עסקאות חדשות`);
        fetchAccounts();
      } else {
        toast.error(data.results?.[0]?.errorMessage || "שגיאה בסריקה");
      }
    } catch {
      toast.error("שגיאה בסריקה");
    } finally {
      setScrapingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">חשבונות</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[180px]" />)}
        </div>
      </div>
    );
  }

  const mineAccounts = accounts.filter((a) => a.owner === "mine");
  const wifeAccounts = accounts.filter((a) => a.owner === "wife");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">חשבונות</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {accounts.length} חשבונות מוגדרים
        </p>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">אין חשבונות מוגדרים</h3>
            <p className="text-sm text-muted-foreground mt-1">
              עבור להגדרות כדי להוסיף חשבונות בנק וכרטיסי אשראי
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {mineAccounts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">החשבונות שלי</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {mineAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    isScraping={scrapingId === account.id}
                    onScrape={() => handleScrape(account.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {wifeAccounts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">החשבונות של אשתי</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {wifeAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    isScraping={scrapingId === account.id}
                    onScrape={() => handleScrape(account.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AccountCard({
  account,
  isScraping,
  onScrape,
}: {
  account: Account;
  isScraping: boolean;
  onScrape: () => void;
}) {
  const isBank = COMPANY_ICONS[account.companyId] === "bank";
  const Icon = isBank ? Building2 : CreditCard;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">{account.name}</h4>
              <p className="text-xs text-muted-foreground">
                {COMPANY_LABELS[account.companyId] || account.companyId}
              </p>
            </div>
          </div>

          <Badge variant={account.isActive ? "default" : "secondary"} className="text-[10px]">
            {account.isActive ? "פעיל" : "מושבת"}
          </Badge>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="space-y-1">
            {account.accountNumber && (
              <p className="text-xs text-muted-foreground">
                חשבון: ****{account.accountNumber.slice(-4)}
              </p>
            )}
            <div className="flex items-center gap-1.5">
              {account.lastScrapedAt ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    עודכן: {formatDate(account.lastScrapedAt)}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">טרם נסרק</span>
                </>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onScrape}
            disabled={isScraping}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${isScraping ? "animate-spin" : ""}`} />
            {isScraping ? "סורק..." : "סרוק"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
