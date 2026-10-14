"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type AuthFormState, login, register } from "@/app/actions/auth";
import { useLocale } from "./locale-provider";

const inputClass =
  "w-full rounded-md border border-axis bg-surface px-3 py-2 text-sm text-ink";

export function AuthForm({
  mode,
  registrationOpen,
}: {
  mode: "login" | "register";
  registrationOpen: boolean;
}) {
  const { t } = useLocale();
  const isLogin = mode === "login";
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    isLogin ? login : register,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.auth.email}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.auth.password}</span>
        <input
          name="password"
          type="password"
          required
          minLength={isLogin ? undefined : 10}
          autoComplete={isLogin ? "current-password" : "new-password"}
          className={inputClass}
        />
        {!isLogin && (
          <span className="mt-1 block text-xs text-ink-2">
            {t.auth.passwordHint}
          </span>
        )}
      </label>
      {!isLogin && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {t.auth.passwordRepeat}
          </span>
          <input
            name="passwordRepeat"
            type="password"
            required
            autoComplete="new-password"
            className={inputClass}
          />
        </label>
      )}

      <p aria-live="polite" className="min-h-5 text-sm text-critical">
        {state.error && t.auth.errors[state.error]}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-60"
      >
        {isLogin ? t.auth.loginButton : t.auth.registerButton}
      </button>

      {isLogin
        ? registrationOpen && (
            <p className="text-center text-sm text-ink-2">
              {t.auth.noAccount}{" "}
              <Link href="/register" className="font-medium text-accent">
                {t.auth.registerLink}
              </Link>
            </p>
          )
        : (
            <p className="text-center text-sm text-ink-2">
              {t.auth.hasAccount}{" "}
              <Link href="/login" className="font-medium text-accent">
                {t.auth.loginLink}
              </Link>
            </p>
          )}
    </form>
  );
}
