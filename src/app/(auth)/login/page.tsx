import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { registrationAllowed } from "@/lib/auth/config";

export const metadata: Metadata = { title: "Anmelden" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-5 text-xl font-semibold">Anmelden</h1>
      <AuthForm mode="login" registrationOpen={registrationAllowed()} />
    </>
  );
}
