export interface CategoryDefinition {
  name: string;
  icon: string;
  color: string;
  patterns: string[];
}

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  {
    name: "מזון וסופר",
    icon: "ShoppingCart",
    color: "#22c55e",
    patterns: [
      "שופרסל", "רמי לוי", "ויקטורי", "יוחננוף", "אושר עד", "מגה",
      "חצי חינם", "סופר", "מרקט", "שוק", "ירקות", "פירות",
      "טיב טעם", "יינות ביתן", "סלא", "פרש מרקט", "קרפור",
      "ניו פארם", "מחסני השוק", "זול ובגדול", "קינג סטור"
    ],
  },
  {
    name: "מסעדות וקפה",
    icon: "Coffee",
    color: "#f97316",
    patterns: [
      "מקדונלד", "ארומה", "קפה קפה", "דומינו", "שווארמה",
      "פיצה", "סושי", "בורגר", "קפה", "מסעדה", "ביסטרו",
      "רולדין", "גרג", "לנדוור", "כפית", "חומוס", "פלאפל",
      "באגט", "ג'ירפה", "וולט", "תן ביס"
    ],
  },
  {
    name: "דלק ורכב",
    icon: "Fuel",
    color: "#ef4444",
    patterns: [
      "פז", "דלק", "סונול", "דור אלון", "חניון", "חניה",
      "טסט", "ביטוח רכב", "שמן", "צמיגים", "מוסך", "דור-אלון",
      "ten", "אלון", "ביטוח חובה"
    ],
  },
  {
    name: "בריאות",
    icon: "Heart",
    color: "#ec4899",
    patterns: [
      "מכבי", "כללית", "מאוחדת", "לאומית", "סופר פארם",
      "בית מרקחת", "רופא", "מרפאה", "בדיקה", "אופטיק",
      "משקפיים", "שיניים", "פארם"
    ],
  },
  {
    name: "ביגוד והנעלה",
    icon: "Shirt",
    color: "#8b5cf6",
    patterns: [
      "זארה", "H&M", "קסטרו", "גולף", "פוקס", "מנגו",
      "נעלי", "בגדי", "אופנה", "רנואר", "תמנון",
      "טרמינל", "סטורי", "שופרא"
    ],
  },
  {
    name: "חינוך",
    icon: "GraduationCap",
    color: "#0ea5e9",
    patterns: [
      "גן ילדים", "בית ספר", "חוגים", "קורס", "שכר לימוד",
      "ספרים", "משרד החינוך", "צהרון", "חוג"
    ],
  },
  {
    name: "בילויים ופנאי",
    icon: "Ticket",
    color: "#f59e0b",
    patterns: [
      "סינמה", "קולנוע", "הצגה", "כרטיס", "פארק", "לונה",
      "הופעה", "מוזיאון", "תיאטרון", "סינמה סיטי", "יס פלנט",
      "סלופארק"
    ],
  },
  {
    name: "תקשורת",
    icon: "Wifi",
    color: "#06b6d4",
    patterns: [
      "סלקום", "פלאפון", "הוט", "פרטנר", "בזק", "גולן",
      "012", "013", "נטוויז'ן", "yes", "רמי", "אינטרנט"
    ],
  },
  {
    name: "חשבונות בית",
    icon: "Home",
    color: "#64748b",
    patterns: [
      "חשמל", "חברת חשמל", "מים", "מקורות", "ארנונה", "גז",
      "ועד בית", "עירייה", "דירה", "שכירות", "משכנתא"
    ],
  },
  {
    name: "קניות כלליות",
    icon: "ShoppingBag",
    color: "#a855f7",
    patterns: [
      "אמזון", "amazon", "עלי אקספרס", "aliexpress", "איקאה",
      "ace", "הום סנטר", "אייס"
    ],
  },
  {
    name: "העברות",
    icon: "ArrowLeftRight",
    color: "#94a3b8",
    patterns: [
      "העברה", "שיק", "המחאה", "ביט", "פייבוקס", "paybox"
    ],
  },
];

export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map((c) => [c.name, c.color])
);

export const CATEGORY_ICONS: Record<string, string> = Object.fromEntries(
  DEFAULT_CATEGORIES.map((c) => [c.name, c.icon])
);
