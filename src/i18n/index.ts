import ru from "./ru.json";
import kz from "./kz.json";

export const LOCALES = ["ru", "kz"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE = "lang";

export type Dict = Record<string, string>;
export type Params = Record<string, string | number>;
export type TFn = (key: string, params?: Params) => string;

export const dictionaries: Record<Locale, Dict> = { ru, kz };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function makeT(dict: Dict): TFn {
  return (key, params) => {
    let s = dict[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}

/** Intl locale tag for date formatting. */
export function intlTag(locale: Locale) {
  return locale === "kz" ? "kk-KZ" : "ru-RU";
}
