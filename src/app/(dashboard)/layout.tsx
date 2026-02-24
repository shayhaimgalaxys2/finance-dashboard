"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [owner, setOwner] = useState("all");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (!data.isSetup) {
          router.push("/login?setup=true");
        } else if (!data.isAuthenticated) {
          router.push("/login");
        } else {
          setIsAuthenticated(true);
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header owner={owner} onOwnerChange={setOwner} />
        <main className="flex-1 overflow-auto p-4 md:p-6" data-owner={owner}>
          {children}
        </main>
      </div>
    </div>
  );
}
