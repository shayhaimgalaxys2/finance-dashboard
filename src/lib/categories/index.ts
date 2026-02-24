import { db } from "@/lib/db";
import { categoryRules } from "@/lib/db/schema";
import { DEFAULT_CATEGORIES } from "./default-rules";

export function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase();

  // Check default patterns
  for (const cat of DEFAULT_CATEGORIES) {
    for (const pattern of cat.patterns) {
      if (desc.includes(pattern.toLowerCase())) {
        return cat.name;
      }
    }
  }

  return "אחר";
}

export async function categorizeWithCustomRules(description: string): Promise<string> {
  // First check custom rules (higher priority)
  try {
    const customRules = await db.select().from(categoryRules).all();
    const sortedRules = customRules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    for (const rule of sortedRules) {
      try {
        const regex = new RegExp(rule.pattern, "i");
        if (regex.test(description)) {
          return rule.category;
        }
      } catch {
        // If not valid regex, do simple includes
        if (description.toLowerCase().includes(rule.pattern.toLowerCase())) {
          return rule.category;
        }
      }
    }
  } catch {
    // DB not ready, fall through to defaults
  }

  return categorizeTransaction(description);
}
