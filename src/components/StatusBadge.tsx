import type { TFn } from "@/i18n";
import { Icon } from "./Icons";

export type Status = "onTime" | "late" | "submittedOnTime" | "submittedLate" | "pending" | "overdue" | "notSubmitted" | "notGraded";

/* Semantics: submitted = neutral; late = orange; overdue / not graded = red; pending = outlined neutral. */
const styles: Record<Status, { cls: string; icon?: React.ReactNode }> = {
  onTime: { cls: "badge-solid", icon: <Icon.Check size={11} /> },
  submittedOnTime: { cls: "badge-solid", icon: <Icon.Check size={11} /> },
  late: { cls: "badge-warn", icon: <Icon.Clock size={11} /> },
  submittedLate: { cls: "badge-warn", icon: <Icon.Clock size={11} /> },
  pending: { cls: "badge-neutral" },
  overdue: { cls: "badge-danger", icon: <Icon.Alert size={11} /> },
  notSubmitted: { cls: "badge-neutral" },
  notGraded: { cls: "badge-danger" },
};

export function StatusBadge({ status, t }: { status: Status; t: TFn }) {
  const s = styles[status];
  return <span className={s.cls}>{s.icon}{t(`status.${status}`)}</span>;
}

/** Score is typography, not color: bold number + quiet denominator. Low scores get a red tint. */
export function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={`display inline-flex items-baseline gap-px font-bold tabular-nums ${score < 4 ? "text-danger" : ""}`}>
      {score}<span className="text-[11px] font-medium text-muted">/12</span>
    </span>
  );
}
