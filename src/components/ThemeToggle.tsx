"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icons";
import { useT } from "@/i18n/client";

export function ThemeToggle() {
  const t = useT();
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      try { if (localStorage.getItem("theme")) return; } catch {}
      document.documentElement.classList.toggle("dark", e.matches);
      setDark(e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  };
  const label = dark ? t("common.light") : t("common.dark");
  return (
    <button type="button" onClick={toggle} className="icon-btn" aria-label={label} title={label}>
      {dark === null ? <span className="h-4 w-4" /> : dark ? <Icon.Sun size={15} /> : <Icon.Moon size={15} />}
    </button>
  );
}
