import { intlTag, type Locale } from "@/i18n";

export function fmtDate(d: Date | string, locale: Locale = "ru") {
  return new Date(d).toLocaleString(intlTag(locale), {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
export function isPast(d: Date | string) {
  return new Date(d).getTime() < Date.now();
}

/** Left-stripe colour for an assignment row: red = deadline passed, orange = < 48h left, neutral otherwise. */
export function deadlineStripe(deadline: Date | string, opts: { submitted?: boolean; muteWhenPast?: boolean } = {}) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (opts.submitted) return "border-l-line-2";
  if (ms < 0) return opts.muteWhenPast ? "border-l-line-2" : "border-l-danger";
  if (ms < 48 * 3600 * 1000) return "border-l-warn";
  return "border-l-fg";
}

/** Two-letter monogram used instead of decorative icons. */
export function monogram(title: string) {
  const words = title.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : title.slice(0, 2)).toUpperCase();
}
