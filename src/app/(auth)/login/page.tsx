import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { registrationAllowed } from "@/lib/auth/config";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).auth.loginTitle };
}

export default async function LoginPage() {
  const t = await getDictionary();
  return (
    <>
      <h1 className="mb-5 text-xl font-semibold">{t.auth.loginTitle}</h1>
      <AuthForm mode="login" registrationOpen={registrationAllowed()} />
    </>
  );
}
