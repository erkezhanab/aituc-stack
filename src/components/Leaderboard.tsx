import Link from "next/link";
import type { LeaderRow } from "@/lib/rating";
import { ON_TIME_BONUS } from "@/lib/rating";
import type { TFn } from "@/i18n";

type Props = {
  rows: LeaderRow[];
  subjects: { id: string; title: string }[];
  filters: { subjectId?: string; period: "all" | "month" };
  basePath: string;
  highlightId?: string;
  anonymize?: boolean;
  t: TFn;
};

export function Leaderboard({ rows, subjects, filters, basePath, highlightId, anonymize, t }: Props) {
  const q = (p: Partial<Props["filters"]>) => {
    const sp = new URLSearchParams();
    const f = { ...filters, ...p };
    if (f.subjectId) sp.set("subject", f.subjectId);
    if (f.period !== "all") sp.set("period", f.period);
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const chip = (active: boolean) => (active ? "chip-on" : "chip-off");
  const nameOf = (r: LeaderRow) => {
    const me = r.studentId === highlightId;
    if (anonymize && !me) return t("lb.anon", { id: r.studentId.slice(-6).toUpperCase() });
    return me ? `${r.name} ${t("lb.you")}` : r.name;
  };
  const top3 = rows.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Link href={q({ period: "all" })} className={chip(filters.period === "all")}>{t("lb.allTime")}</Link>
        <Link href={q({ period: "month" })} className={chip(filters.period === "month")}>{t("lb.month")}</Link>
        <span className="mx-1.5 h-4 w-px bg-line-2" />
        <Link href={q({ subjectId: undefined })} className={chip(!filters.subjectId)}>{t("lb.allSubjects")}</Link>
        {subjects.map((s) => (
          <Link key={s.id} href={q({ subjectId: s.id })} className={chip(filters.subjectId === s.id)}>{s.title}</Link>
        ))}
      </div>

      {top3.length > 0 && (
        <div className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line" style={{ gridTemplateColumns: `repeat(${top3.length}, minmax(0, 1fr))` }}>
          {top3.map((r, i) => (
            <div key={r.studentId} className={`bg-surface p-4 ${i === 0 ? "stripe border-l-gold" : ""}`}>
              <div className="flex items-baseline justify-between">
                <span className="display text-[34px] font-bold leading-none text-muted/60">{String(r.rank).padStart(2, "0")}</span>
                <span className="display text-[26px] font-bold leading-none tabular-nums">{r.rating.toFixed(2)}</span>
              </div>
              <p className="mt-3 truncate text-[13px] font-semibold">{nameOf(r)}</p>
              <p className="text-[11px] text-muted">
                {t("lb.submitted")}: {r.submitted}{r.bonus > 0 && <> · <span className="text-fg-2">+{ON_TIME_BONUS} {t("lb.bonus").toLowerCase()}</span></>}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="w-14">{t("lb.rank")}</th><th>{t("lb.student")}</th><th>{t("lb.avg")}</th><th>{t("lb.bonus")}</th><th>{t("lb.rating")}</th><th>{t("lb.submitted")}</th><th>{t("lb.onTime")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted">{t("lb.empty")}</td></tr>}
            {rows.map((r) => {
              const me = r.studentId === highlightId;
              return (
                <tr key={r.studentId} className={me ? "bg-accent-soft/40" : ""}>
                  <td className="font-mono text-muted">{String(r.rank).padStart(2, "0")}</td>
                  <td className={r.rank <= 3 ? "font-semibold" : ""}>{nameOf(r)}</td>
                  <td className="tabular-nums">{r.avg.toFixed(2)}</td>
                  <td>{r.bonus ? <span className="badge-neutral">+{ON_TIME_BONUS}</span> : <span className="text-muted">—</span>}</td>
                  <td className="display font-bold tabular-nums">{r.rating.toFixed(2)}</td>
                  <td className="tabular-nums">{r.submitted} <span className="text-[11px] text-muted">({t("lb.graded", { n: r.graded })})</span></td>
                  <td>
                    <span className="inline-flex items-center gap-2 tabular-nums">
                      <span className="h-1 w-14 bg-surface-3"><span className={`block h-full ${r.late ? "bg-warn" : "bg-fg"}`} style={{ width: `${Math.round(r.onTimeShare * 100)}%` }} /></span>
                      {Math.round(r.onTimeShare * 100)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted">{t("lb.note", { bonus: ON_TIME_BONUS })}</p>
    </div>
  );
}
