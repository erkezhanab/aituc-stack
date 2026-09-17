"use client";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmtDate } from "@/lib/format";

const PRESETS = ["23:59", "18:00", "12:00", "09:00"];

/** Date + time inputs; submits the combined instant as an ISO string in the hidden `deadline` field. */
export function DeadlinePicker() {
  const { t, locale } = useI18n();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("23:59");
  const [today, setToday] = useState<string>(); // set on the client only (avoids server/client date mismatch)
  useEffect(() => {
    const d = new Date();
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }, []);
  const iso = useMemo(() => {
    if (!date || !time) return "";
    const d = new Date(`${date}T${time}`); // teacher's local timezone
    return isNaN(d.getTime()) ? "" : d.toISOString();
  }, [date, time]);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div>
          <label className="label">{t("teacher.deadlineDate")}</label>
          <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required className="input" />
        </div>
        <div className="w-28">
          <label className="label">{t("teacher.deadlineTime")}</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required step={60} className="input font-mono" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {PRESETS.map((p) => (
          <button key={p} type="button" onClick={() => setTime(p)}
            className={`rounded-[3px] border px-1.5 py-px font-mono text-[11px] transition-colors ${time === p ? "border-fg bg-fg text-bg" : "border-line-2 text-muted hover:text-fg"}`}>
            {p}
          </button>
        ))}
        {iso && <span className="ml-auto text-[11px] text-muted">{t("teacher.deadlinePreview", { date: fmtDate(iso, locale) })}</span>}
      </div>
      <input type="hidden" name="deadline" value={iso} />
    </div>
  );
}
