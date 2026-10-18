import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { type Access, accessOf } from "@/lib/access";

const COOKIE_NAME = "fc_session";
const SESSION_DAYS = 30;

export interface CurrentUser {
  id: string;
  email: string;
  access: Access;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db
    .delete(schema.sessions)
    .where(
      and(
        eq(schema.sessions.userId, userId),
        lt(schema.sessions.expiresAt, new Date()),
      ),
    );
  await db
    .insert(schema.sessions)
    .values({ id: hashToken(token), userId, expiresAt });

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const db = await getDb();
    await db
      .delete(schema.sessions)
      .where(eq(schema.sessions.id, hashToken(token)));
  }
  cookieStore.delete(COOKIE_NAME);
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const db = await getDb();
  const [row] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      role: schema.users.role,
      betaAccess: schema.users.betaAccess,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(
      and(
        eq(schema.sessions.id, hashToken(token)),
        gt(schema.sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row
    ? { id: row.id, email: row.email, access: accessOf(row) }
    : null;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages only admins may see: everybody else gets a plain "not found". */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.access.role !== "admin") notFound();
  return user;
}
