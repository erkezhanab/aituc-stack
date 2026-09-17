"use client";
import { useFormStatus } from "react-dom";
import { useT } from "@/i18n/client";

export function SubmitButton({ children, className = "btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? t("common.wait") : children}
    </button>
  );
}
