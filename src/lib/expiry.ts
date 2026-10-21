// Pure date helpers. All dates are local "YYYY-MM-DD" strings, compared against the real current day.

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(base: Date, n: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
  return toISODate(d);
}

export function daysUntil(expiry: string, today: Date = new Date()): number {
  const [y, m, d] = expiry.split("-").map(Number);
  const e = new Date(y, m - 1, d).getTime();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((e - t) / 86400000);
}

export type ExpiryStatus = "expired" | "within1" | "within3" | "within7" | "ok" | "unknown";

export function expiryStatus(expiry: string | undefined, today: Date = new Date()): ExpiryStatus {
  if (!expiry) return "unknown";
  const n = daysUntil(expiry, today);
  if (n < 0) return "expired";
  if (n <= 1) return "within1";
  if (n <= 3) return "within3";
  if (n <= 7) return "within7";
  return "ok";
}

export const statusLabel: Record<ExpiryStatus, string> = {
  expired: "已过期",
  within1: "1天内到期",
  within3: "3天内到期",
  within7: "7天内到期",
  ok: "新鲜",
  unknown: "未填保质期",
};

export function describeDays(expiry: string | undefined, today: Date = new Date()): string {
  if (!expiry) return "保质期未知";
  const n = daysUntil(expiry, today);
  if (n < 0) return `已过期 ${-n} 天`;
  if (n === 0) return "今天到期";
  if (n === 1) return "明天到期";
  return `还剩 ${n} 天`;
}
