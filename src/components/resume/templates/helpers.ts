import type { DateFormat } from "@/stores/customize.store";

export function formatDate(date: string | undefined | null, format: DateFormat = "short"): string {
  if (!date) return "";
  const lower = date.trim().toLowerCase();
  if (lower === "present" || lower === "current") return "Present";

  // Support YYYY-MM or YYYY-MM-DD
  const cleaned = date.length === 7 ? date + "-01" : date;
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return date;

  switch (format) {
    case "short":   return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    case "long":    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    case "numeric": return d.toLocaleDateString("en-US", { month: "2-digit", year: "numeric" });
    case "year":    return String(d.getFullYear());
    default:        return date;
  }
}

export function dateRange(start: string, end: string | undefined, current: boolean, format: DateFormat): string {
  const s = formatDate(start, format);
  const e = current ? "Present" : formatDate(end, format);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
}

export function fullName(personalInfo: { firstName?: string; lastName?: string }): string {
  return [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(" ") || "Your Name";
}

// inline styles shared across templates
export const BULLET_STYLE: React.CSSProperties = {
  marginBottom: "2pt",
  paddingLeft: "12pt",
  position: "relative",
};

export const BULLET_DOT_STYLE: React.CSSProperties = {
  position: "absolute",
  left: "2pt",
  top: "0",
};
