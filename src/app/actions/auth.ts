"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { type AuthError, registrationAllowed } from "@/lib/auth/config";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  LIMITS,
  allowAttempt,
  clearAttempts,
  clientIp,
  limitKey,
  pruneAttempts,
} from "@/lib/auth/rate-limit";
import { createSession, deleteSession } from "@/lib/auth/session";

export interface AuthFormState {
  error?: AuthError;
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
    return { error: "missingCredentials", email };
  }

  const emailKey = limitKey("login-email", parsed.data.email);
  const allowed =
    (await allowAttempt(emailKey, LIMITS.loginPerEmail)) &&
    (await allowAttempt(limitKey("login-ip", await clientIp()), LIMITS.loginPerIp));
  if (!allowed) {
    return { error: "tooManyAttempts", email };
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
    return { error: "wrongCredentials", email };
  }

  await clearAttempts(emailKey);
  await pruneAttempts();
  await createSession(user.id);
  redirect("/cockpit");
}

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  if (!registrationAllowed()) {
    return { error: "registrationClosed", email };
  }

  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "invalidEmail", email };
  }
  if (parsed.data.password.length < 10) {
    return { error: "passwordTooShort", email };
  }
  if (parsed.data.password !== formData.get("passwordRepeat")) {
    return { error: "passwordMismatch", email };
  }

  if (!(await allowAttempt(limitKey("register-ip", await clientIp()), LIMITS.registerPerIp))) {
    return { error: "tooManyAttempts", email };
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
    return { error: "emailTaken", email };
  }

  await createSession(id);
  redirect("/cockpit");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
