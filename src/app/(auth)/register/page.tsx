import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { registrationAllowed } from "@/lib/auth/config";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).auth.registerTitle };
}

export default async function RegisterPage() {
  if (!registrationAllowed()) redirect("/login");
  const t = await getDictionary();

  return (
    <>
      <h1 className="mb-5 text-xl font-semibold">{t.auth.registerTitle}</h1>
      <AuthForm mode="register" registrationOpen />
    </>
  );
}
