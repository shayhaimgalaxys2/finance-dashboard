"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Receipt, Building2, Settings, TrendingDown } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "סקירה כללית", icon: LayoutDashboard },
  { href: "/transactions", label: "עסקאות", icon: Receipt },
  { href: "/accounts", label: "חשבונות", icon: Building2 },
  { href: "/settings", label: "הגדרות", icon: Settings },
];

interface MobileNavProps {
  onNavigate?: () => void;
}

export function MobileNav({ onNavigate }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    router.push(href);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center gap-3 px-6 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <TrendingDown className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold">Finance</h1>
          <p className="text-xs text-muted-foreground">ניהול פיננסי</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
