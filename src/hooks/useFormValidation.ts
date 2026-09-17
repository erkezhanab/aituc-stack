"use client";
import { useCallback, useState, type FormEvent } from "react";
import type { z } from "zod";
import { fieldErrorsOf, formDataToObject, type FieldErrors } from "@/lib/validation/auth";

/** Fields whose values are never echoed back into the form after a failed submit. */
const SECRET_FIELDS = new Set(["password", "confirmPassword", "inviteCode"]);

/**
 * Client-side mirror of the server validation for a native <form action={serverAction}>.
 * Errors appear per field after the field is blurred (or after the first submit attempt);
 * an invalid submit is cancelled before it reaches the server.
 */
export function useFormValidation(schema: z.ZodType, serverErrors?: FieldErrors) {
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  // A server error for a field stays until the user edits that field again.
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  // Non-secret values from the last submit: React resets a native form after its action, so we restore them.
  const [draft, setDraft] = useState<Record<string, string>>({});

  // New server response → forget previous dismissals (state adjusted during render, no effect needed).
  const [seenServerErrors, setSeenServerErrors] = useState(serverErrors);
  if (serverErrors !== seenServerErrors) {
    setSeenServerErrors(serverErrors);
    setDismissed({});
  }

  const check = useCallback((form: HTMLFormElement) => {
    const r = schema.safeParse(formDataToObject(new FormData(form)));
    const errs = r.success ? {} : fieldErrorsOf(r.error);
    setClientErrors(errs);
    return errs;
  }, [schema]);

  const onChange = useCallback((e: FormEvent<HTMLFormElement>) => {
    const name = (e.target as HTMLInputElement).name;
    if (name) setDismissed((d) => (d[name] ? d : { ...d, [name]: true }));
    check(e.currentTarget);
  }, [check]);

  const onBlur = useCallback((e: FormEvent<HTMLFormElement>) => {
    const name = (e.target as HTMLInputElement).name;
    if (name) setTouched((t) => (t[name] ? t : { ...t, [name]: true }));
    check(e.currentTarget);
  }, [check]);

  const onSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    const errs = check(e.currentTarget);
    setSubmitted(true);
    if (Object.keys(errs).length) {
      e.preventDefault();
      const first = e.currentTarget.querySelector<HTMLInputElement>(Object.keys(errs).map((n) => `[name="${n}"]`).join(","));
      first?.focus();
      return;
    }
    const values = formDataToObject(new FormData(e.currentTarget));
    setDraft(Object.fromEntries(Object.entries(values).filter(([k]) => !SECRET_FIELDS.has(k))));
  }, [check]);

  const errorFor = (name: string): string | undefined => {
    if (serverErrors?.[name] && !dismissed[name]) return serverErrors[name];
    if (submitted || touched[name]) return clientErrors[name];
    return undefined;
  };

  /** Spread onto a non-secret input so its value survives the post-action form reset. */
  const draftFor = (name: string) => ({ defaultValue: draft[name] ?? "" });

  return { formProps: { onChange, onBlur, onSubmit, noValidate: true }, errorFor, draftFor };
}
