// Account administration on the database, for GDPR requests and housekeeping.
//
//   node scripts/account.mjs list
//   node scripts/account.mjs export <email>   prints all data of the account as JSON
//   node scripts/account.mjs delete <email>   deletes the account and everything it owns
//
// Uses DATABASE_URL (and DATABASE_AUTH_TOKEN) like the app. With Docker:
//   docker compose exec app node scripts/account.mjs list
import { createClient } from "@libsql/client";

const [command, rawEmail] = process.argv.slice(2);
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./data/financecockpit.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const rows = async (sql, args = []) => (await client.execute({ sql, args })).rows;

async function findUser(email) {
  const [user] = await rows(
    "select id, email, created_at from users where email = ?",
    [email.trim().toLowerCase()],
  );
  if (!user) {
    console.error("No account with this e-mail address.");
    process.exit(1);
  }
  return user;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

if (command === "list") {
  for (const user of await rows(
    "select email, created_at from users order by created_at",
  )) {
    console.log(`${user.email}\tcreated ${new Date(Number(user.created_at) * 1000).toISOString()}`);
  }
} else if (command === "export" && rawEmail) {
  const user = await findUser(rawEmail);
  const profiles = await rows(
    "select scope, name, data, is_active, created_at, updated_at from profiles where user_id = ? order by scope, created_at",
    [user.id],
  );
  const planRecords = await rows(
    "select kind, data, created_at from plan_records where user_id = ? order by created_at",
    [user.id],
  );
  console.log(
    JSON.stringify(
      {
        email: user.email,
        createdAt: new Date(Number(user.created_at) * 1000).toISOString(),
        profiles: profiles.map((p) => ({ ...p, data: parseJson(p.data) })),
        planRecords: planRecords.map((r) => ({ ...r, data: parseJson(r.data) })),
      },
      (_key, value) => (typeof value === "bigint" ? Number(value) : value),
      2,
    ),
  );
} else if (command === "delete" && rawEmail) {
  const user = await findUser(rawEmail);
  // Explicit deletes, so nothing depends on foreign keys being enforced.
  await client.batch(
    [
      { sql: "delete from sessions where user_id = ?", args: [user.id] },
      { sql: "delete from profiles where user_id = ?", args: [user.id] },
      { sql: "delete from plan_records where user_id = ?", args: [user.id] },
      { sql: "delete from users where id = ?", args: [user.id] },
    ],
    "write",
  );
  console.log(`Deleted the account ${user.email} with all its data.`);
} else {
  console.error("Usage: node scripts/account.mjs list | export <email> | delete <email>");
  process.exit(1);
}
client.close();
