"use client";
import { useId, useState, type InputHTMLAttributes } from "react";
import { useT } from "@/i18n/client";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** i18n key; rendered inline under the input. */
  error?: string;
  hint?: string;
};

/** Labelled input with an inline error message under it. */
export function Field({ label, error, hint, className = "", id, ...rest }: FieldProps) {
  const t = useT();
  const autoId = useId();
  const inputId = id ?? autoId;
  const errId = `${inputId}-err`;
  return (
    <div>
      <label htmlFor={inputId} className="label">{label}</label>
      <input id={inputId} aria-invalid={!!error || undefined} aria-describedby={error ? errId : undefined}
        className={`input ${error ? "border-danger focus:border-danger focus:ring-danger/25" : ""} ${className}`} {...rest} />
      {error ? <p id={errId} className="mt-1 text-[11px] text-danger">{t(error)}</p>
        : hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

/** Password input with a show/hide toggle; hidden by default. */
export function PasswordField({ label, error, hint, className = "", id, ...rest }: Omit<FieldProps, "type">) {
  const t = useT();
  const autoId = useId();
  const inputId = id ?? autoId;
  const errId = `${inputId}-err`;
  const [shown, setShown] = useState(false);
  return (
    <div>
      <label htmlFor={inputId} className="label">{label}</label>
      <div className="relative">
        <input id={inputId} type={shown ? "text" : "password"} aria-invalid={!!error || undefined} aria-describedby={error ? errId : undefined}
          className={`input pr-9 ${error ? "border-danger focus:border-danger focus:ring-danger/25" : ""} ${className}`} {...rest} />
        <button type="button" onClick={() => setShown((s) => !s)} tabIndex={-1}
          aria-label={shown ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={shown}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted transition-colors hover:text-fg">
          {shown ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {error ? <p id={errId} className="mt-1 text-[11px] text-danger">{t(error)}</p>
        : hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

const svgProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
function Eye() {
  return <svg {...svgProps}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
}
function EyeOff() {
  return <svg {...svgProps}><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a19.8 19.8 0 0 1 5.06-5.94" /><path d="M9.9 4.24A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a19.7 19.7 0 0 1-3.22 4.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><path d="m2 2 20 20" /></svg>;
}
