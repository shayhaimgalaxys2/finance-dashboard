"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, RefreshCw, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { MobileNav } from "./mobile-nav";
import { useState } from "react";
import { toast } from "sonner";

interface HeaderProps {
  owner: string;
  onOwnerChange: (owner: string) => void;
}

export function Header({ owner, onOwnerChange }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [isScraping, setIsScraping] = useState(false);

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const results = data.results || [];
        const successCount = results.filter((r: { status: string }) => r.status === "success").length;
        const errorCount = results.filter((r: { status: string }) => r.status === "error").length;
        const totalTxns = data.summary?.totalTransactions || 0;

        if (errorCount > 0 && successCount === 0) {
          const errors = results
            .filter((r: { status: string }) => r.status === "error")
            .map((r: { accountName: string; errorMessage?: string }) => `${r.accountName}: ${r.errorMessage}`)
            .join("\n");
          toast.error(`הסריקה נכשלה`, { description: errors });
        } else if (errorCount > 0) {
          toast.warning(`${successCount} חשבונות עודכנו, ${errorCount} נכשלו (${totalTxns} עסקאות)`);
        } else {
          toast.success(`הסריקה הושלמה - ${successCount} חשבונות, ${totalTxns} עסקאות`);
        }

        // Refresh the page data
        window.dispatchEvent(new Event("scrape-complete"));
      } else {
        toast.error(data.error || "שגיאה בסריקה");
      }
    } catch {
      toast.error("שגיאה בסריקה");
    } finally {
      setIsScraping(false);
    }
  };

  const ownerOptions = [
    { value: "all", label: "הכל" },
    { value: "mine", label: "שלי" },
    { value: "wife", label: "אשתי" },
  ];

  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-64" showCloseButton={false}>
            <SheetTitle className="sr-only">תפריט ניווט</SheetTitle>
            <MobileNav onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {ownerOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onOwnerChange(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                owner === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleScrape}
          disabled={isScraping}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isScraping ? "animate-spin" : ""}`} />
          {isScraping ? "סורק..." : "סנכרן"}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
