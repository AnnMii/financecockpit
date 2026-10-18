import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // Interface choices that follow the account, as JSON; see src/lib/preferences.ts.
  preferences: text("preferences").notNull().default("{}"),
  // "user" or "admin", see src/lib/access.ts.
  role: text("role").notNull().default("user"),
  // Switched on by an admin; unlocks the features that are still in beta.
  betaAccess: integer("beta_access", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  // SHA-256 of the cookie token, so a leaked database does not leak sessions.
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // "shared" or the id of a calculator, see src/lib/settings/schema.ts
    scope: text("scope").notNull(),
    name: text("name").notNull(),
    data: text("data").notNull(),
    // Exactly one profile per user and scope is the one in use.
    isActive: integer("is_active", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("profiles_user_scope_name").on(
      table.userId,
      table.scope,
      table.name,
    ),
  ],
);

/** Frozen plan versions and recorded snapshots of the Gesamtplan, see src/lib/plan. */
export const planRecords = sqliteTable("plan_records", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // "version" or "snapshot"
  kind: text("kind").notNull(),
  // One self-contained JSON document per record.
  data: text("data").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/** Attempt counters that throttle sign-in and registration, see src/lib/auth/rate-limit.ts. */
export const rateLimits = sqliteTable("rate_limits", {
  // Hashed, so no e-mail address or IP is stored in clear text.
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: integer("window_start").notNull(),
});

/** What admins changed about accounts. Kept even when an account is deleted, hence no foreign keys. */
export const adminLog = sqliteTable("admin_log", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull(),
  targetId: text("target_id").notNull(),
  // "role" or "beta"
  action: text("action").notNull(),
  // e.g. "user -> admin"
  detail: text("detail").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
