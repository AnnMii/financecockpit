import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { registrationAllowed } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Registrieren" };

export default function RegisterPage() {
  if (!registrationAllowed()) redirect("/login");

  return (
    <>
      <h1 className="mb-5 text-xl font-semibold">Konto anlegen</h1>
      <AuthForm mode="register" registrationOpen />
    </>
  );
}
