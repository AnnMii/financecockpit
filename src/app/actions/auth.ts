"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { registrationAllowed } from "@/lib/auth/config";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";

export interface AuthFormState {
  error?: string;
  email?: string;
}

const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

// Verified against when the e-mail is unknown, so both cases take equally long.
const DUMMY_HASH =
  "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) {
    return { error: "Bitte E-Mail-Adresse und Passwort eingeben.", email };
  }

  const db = await getDb();
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, parsed.data.email))
    .limit(1);

  const valid = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_HASH,
  );
  if (!user || !valid) {
    return { error: "E-Mail-Adresse oder Passwort ist falsch.", email };
  }

  await createSession(user.id);
  redirect("/");
}

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  if (!registrationAllowed()) {
    return { error: "Die Registrierung ist deaktiviert.", email };
  }

  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Bitte eine gültige E-Mail-Adresse eingeben.", email };
  }
  if (parsed.data.password.length < 10) {
    return { error: "Das Passwort braucht mindestens 10 Zeichen.", email };
  }
  if (parsed.data.password !== formData.get("passwordRepeat")) {
    return { error: "Die Passwörter stimmen nicht überein.", email };
  }

  const db = await getDb();
  const id = randomUUID();
  const inserted = await db
    .insert(schema.users)
    .values({
      id,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      createdAt: new Date(),
    })
    .onConflictDoNothing({ target: schema.users.email })
    .returning({ id: schema.users.id });
  if (inserted.length === 0) {
    return { error: "Für diese E-Mail-Adresse gibt es schon ein Konto.", email };
  }

  await createSession(id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
