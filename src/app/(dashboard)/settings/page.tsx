"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  CreditCard,
  Building2,
  Send,
  Tag,
  Save,
  X,
} from "lucide-react";

const COMPANIES = [
  { value: "beinleumi", label: "בנק הבינלאומי הראשון", type: "bank" },
  { value: "hapoalim", label: "בנק הפועלים", type: "bank" },
  { value: "leumi", label: "בנק לאומי", type: "bank" },
  { value: "discount", label: "בנק דיסקונט", type: "bank" },
  { value: "mizrahi", label: "בנק מזרחי", type: "bank" },
  { value: "otsarHahayal", label: "אוצר החייל", type: "bank" },
  { value: "visaCal", label: "ויזה כאל", type: "card" },
  { value: "max", label: "מקס", type: "card" },
  { value: "isracard", label: "ישראכרט", type: "card" },
  { value: "amex", label: "אמריקן אקספרס", type: "card" },
];

const CREDENTIAL_FIELDS: Record<string, { key: string; label: string; type: string }[]> = {
  beinleumi: [
    { key: "username", label: "שם משתמש", type: "text" },
    { key: "password", label: "סיסמה", type: "password" },
  ],
  hapoalim: [
    { key: "userCode", label: "קוד משתמש", type: "text" },
    { key: "password", label: "סיסמה", type: "password" },
  ],
  leumi: [
    { key: "username", label: "שם משתמש", type: "text" },
    { key: "password", label: "סיסמה", type: "password" },
  ],
  discount: [
    { key: "id", label: "תעודת זהות", type: "text" },
    { key: "password", label: "סיסמה", type: "password" },
    { key: "num", label: "קוד זיהוי", type: "text" },
  ],
  mizrahi: [
    { key: "username", label: "שם משתמש", type: "text" },
    { key: "password", label: "סיסמה", type: "password" },
  ],
  otsarHahayal: [
    { key: "username", label: "שם משתמש", type: "text" },
    { key: "password", label: "סיסמה", type: "password" },
  ],
  visaCal: [
    { key: "username", label: "שם משתמש", type: "text" },
    { key: "password", label: "סיסמה", type: "password" },
  ],
  max: [
    { key: "username", label: "שם משתמש", type: "text" },
    { key: "password", label: "סיסמה", type: "password" },
  ],
  isracard: [
    { key: "id", label: "תעודת זהות", type: "text" },
    { key: "card6Digits", label: "6 ספרות אחרונות", type: "text" },
    { key: "password", label: "סיסמה", type: "password" },
  ],
  amex: [
    { key: "id", label: "תעודת זהות", type: "text" },
    { key: "card6Digits", label: "6 ספרות אחרונות", type: "text" },
    { key: "password", label: "סיסמה", type: "password" },
  ],
};

interface Account {
  id: number;
  name: string;
  companyId: string;
  owner: string;
  isActive: boolean;
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">הגדרות</h2>
        <p className="text-muted-foreground text-sm mt-1">ניהול חשבונות, טלגרם וקטגוריות</p>
      </div>

      <Tabs defaultValue="accounts" dir="rtl">
        <TabsList className="mb-4">
          <TabsTrigger value="accounts" className="gap-2">
            <CreditCard className="h-3.5 w-3.5" />
            חשבונות
          </TabsTrigger>
          <TabsTrigger value="telegram" className="gap-2">
            <Send className="h-3.5 w-3.5" />
            טלגרם
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Tag className="h-3.5 w-3.5" />
            קטגוריות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <AccountsSettings />
        </TabsContent>
        <TabsContent value="telegram">
          <TelegramSettings />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AccountsSettings() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    companyId: "",
    owner: "mine",
    credentials: {} as Record<string, string>,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {
      toast.error("שגיאה בטעינת חשבונות");
    }
  }

  async function handleSave() {
    if (!form.name || !form.companyId) {
      toast.error("יש למלא שם וסוג חשבון");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("חשבון נוסף בהצלחה");
        setShowForm(false);
        setForm({ name: "", companyId: "", owner: "mine", credentials: {} });
        fetchAccounts();
      } else {
        const data = await res.json();
        toast.error(data.error || "שגיאה בשמירה");
      }
    } catch {
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("למחוק את החשבון? כל העסקאות שלו יימחקו גם.")) return;

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("חשבון נמחק");
        fetchAccounts();
      }
    } catch {
      toast.error("שגיאה במחיקה");
    }
  }

  const credentialFields = form.companyId ? CREDENTIAL_FIELDS[form.companyId] || [] : [];

  return (
    <div className="space-y-4">
      {/* Existing Accounts */}
      {accounts.map((account) => (
        <Card key={account.id}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {COMPANIES.find((c) => c.value === account.companyId)?.type === "bank" ? (
                <Building2 className="h-5 w-5 text-primary" />
              ) : (
                <CreditCard className="h-5 w-5 text-primary" />
              )}
              <div>
                <p className="font-medium text-sm">{account.name}</p>
                <p className="text-xs text-muted-foreground">
                  {COMPANIES.find((c) => c.value === account.companyId)?.label} •{" "}
                  {account.owner === "mine" ? "שלי" : "אשתי"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={account.isActive ? "default" : "secondary"} className="text-[10px]">
                {account.isActive ? "פעיל" : "מושבת"}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Account Form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">הוספת חשבון חדש</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>שם החשבון</Label>
                <Input
                  placeholder="לדוגמה: ויזה כאל - שלי"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>סוג</Label>
                <Select
                  value={form.companyId}
                  onValueChange={(v) => setForm({ ...form, companyId: v, credentials: {} })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר חברה..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>בעלים</Label>
                <Select value={form.owner} onValueChange={(v) => setForm({ ...form, owner: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mine">שלי</SelectItem>
                    <SelectItem value="wife">אשתי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {credentialFields.length > 0 && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground">פרטי התחברות</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {credentialFields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs">{field.label}</Label>
                      <Input
                        type={field.type}
                        value={form.credentials[field.key] || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            credentials: { ...form.credentials, [field.key]: e.target.value },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-3.5 w-3.5" />
                {saving ? "שומר..." : "שמור"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>ביטול</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)} variant="outline" className="w-full gap-2 border-dashed">
          <Plus className="h-4 w-4" />
          הוסף חשבון
        </Button>
      )}
    </div>
  );
}

function TelegramSettings() {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setBotToken(data.telegram_bot_token || "");
        setChatId(data.telegram_chat_id || "");
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_bot_token: botToken,
          telegram_chat_id: chatId,
        }),
      });
      if (res.ok) toast.success("הגדרות טלגרם נשמרו");
      else toast.error("שגיאה בשמירה");
    } catch {
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_bot_token: botToken,
          telegram_chat_id: chatId,
          test: true,
        }),
      });
      const data = await res.json();
      if (data.testSent) toast.success("הודעת טסט נשלחה בהצלחה!");
      else toast.error("שליחה נכשלה - בדוק את הפרטים");
    } catch {
      toast.error("שגיאה בשליחה");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">הגדרות טלגרם</CardTitle>
        <CardDescription>
          הגדר בוט טלגרם לקבלת סיכום יומי כל בוקר ב-07:00
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Bot Token</Label>
          <Input
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="הדבק כאן את ה-token מ-@BotFather"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground">
            צור בוט חדש דרך @BotFather בטלגרם וקבל token
          </p>
        </div>

        <div className="space-y-2">
          <Label>Chat ID</Label>
          <Input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="לדוגמה: 123456789"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground">
            שלח הודעה לבוט @userinfobot כדי לקבל את ה-Chat ID שלך
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-3.5 w-3.5" />
            {saving ? "שומר..." : "שמור"}
          </Button>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !botToken || !chatId}
            className="gap-2"
          >
            <Send className="h-3.5 w-3.5" />
            {testing ? "שולח..." : "שלח הודעת טסט"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoriesSettings() {
  const [rules, setRules] = useState<{ id: number; pattern: string; category: string }[]>([]);
  const [newPattern, setNewPattern] = useState("");
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    fetch("/api/settings/categories")
      .then((res) => res.json())
      .then((data) => setRules(data.rules || []));
  }, []);

  async function handleAdd() {
    if (!newPattern || !newCategory) return;
    try {
      const res = await fetch("/api/settings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: newPattern, category: newCategory }),
      });
      if (res.ok) {
        const data = await res.json();
        setRules([...rules, data.rule]);
        setNewPattern("");
        setNewCategory("");
        toast.success("כלל נוסף");
      }
    } catch {
      toast.error("שגיאה");
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch("/api/settings/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setRules(rules.filter((r) => r.id !== id));
        toast.success("כלל נמחק");
      }
    } catch {
      toast.error("שגיאה");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">כללי קטגוריזציה מותאמים</CardTitle>
        <CardDescription>
          הוסף כללים נוספים מעבר לברירות המחדל. Pattern יכול להיות טקסט רגיל או regex.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new rule */}
        <div className="flex gap-2">
          <Input
            placeholder="דפוס (לדוגמה: קופת חולים)"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="קטגוריה"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-[160px]"
          />
          <Button onClick={handleAdd} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Rules list */}
        <div className="divide-y rounded-lg border">
          {rules.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              אין כללים מותאמים. כללי ברירת המחדל עדיין פעילים.
            </p>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <code className="text-xs bg-muted px-2 py-1 rounded">{rule.pattern}</code>
                  <span className="text-sm">→</span>
                  <Badge variant="secondary">{rule.category}</Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
