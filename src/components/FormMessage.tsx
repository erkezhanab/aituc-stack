"use client";
import type { ActionState } from "@/actions/auth";
import { useT } from "@/i18n/client";

export function FormMessage({ state }: { state: ActionState }) {
  const t = useT();
  if (!state) return null;
  if (state.error === undefined && state.ok === undefined) return null; // field-level errors are rendered inline
  if (state.error !== undefined)
    return <p className="stripe border-l-danger bg-danger-soft/60 px-3 py-1.5 text-[13px] text-danger">{t(state.error, state.params)}</p>;
  return (
    <div className="stripe border-l-fg bg-surface-2 px-3 py-1.5 text-[13px]">
      <p>{t(state.ok ?? "", state.params)}</p>
    </div>
  );
}
