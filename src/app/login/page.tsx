"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TrendingDown, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("setup") === "true") {
      setIsSetup(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSetup) {
      if (password.length < 6) {
        setError("הסיסמה חייבת להכיל לפחות 6 תווים");
        return;
      }
      if (password !== confirmPassword) {
        setError("הסיסמאות לא תואמות");
        return;
      }
    }

    setLoading(true);
    try {
      const method = isSetup ? "PUT" : "POST";
      const res = await fetch("/api/auth", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "שגיאה");
      }
    } catch {
      setError("שגיאת חיבור");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <TrendingDown className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl">Finance Dashboard</CardTitle>
            <CardDescription className="mt-2">
              {isSetup
                ? "ברוכים הבאים! הגדר סיסמת מאסטר לאבטחת המערכת"
                : "הזן את סיסמת המאסטר כדי להיכנס"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                <Lock className="inline h-3.5 w-3.5 ml-1" />
                סיסמת מאסטר
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="הזן סיסמה..."
                  className="pl-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isSetup && (
              <div className="space-y-2">
                <Label htmlFor="confirm">אימות סיסמה</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="הזן שוב..."
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "מתחבר..." : isSetup ? "הגדר סיסמה והתחל" : "כניסה"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
