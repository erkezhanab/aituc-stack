"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { setLocaleAction } from "@/actions/locale";
import { LOCALES, type Locale } from "@/i18n";

export function LangToggle() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const pick = (l: Locale) => {
    if (l === locale) return;
    try { localStorage.setItem("lang", l); } catch {}
    start(async () => {
      await setLocaleAction(l);
      router.refresh();
    });
  };
  return (
    <div className={`inline-flex h-8 items-center rounded-[var(--radius-btn)] border border-line-2 bg-surface p-px text-[11px] font-semibold ${pending ? "opacity-60" : ""}`} role="group" aria-label={t("common.language")}>
      {LOCALES.map((l) => (
        <button key={l} type="button" onClick={() => pick(l)}
          className={`h-full rounded-[2px] px-2 uppercase transition-colors ${l === locale ? "bg-fg text-bg" : "text-muted hover:text-fg"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}
