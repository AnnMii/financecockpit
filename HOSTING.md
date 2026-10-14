# Hosting plan

Checklist for putting the Finanzcockpit online, with data security as the main
concern. Legend: **[Claude]** = can be done by Claude in the repository once
you say go; **[You]** = needs an account, a decision, money or a legal check
that only you can do.

## What is at stake

The database holds, per e-mail address, age, income, pension entitlements,
children's years of birth, savings rates and (in `plan_records`) recorded
balances. All of it is **plain text** today (see feature 1 in
[PLANNED_FEATURES.md](PLANNED_FEATURES.md)); only passwords are hashed (scrypt)
and session tokens are stored as hashes. So whoever reads the database file
reads everything. Hosting security therefore means: nobody but the app may reach
the database or its backups, the connection is encrypted, and the data is
encrypted wherever it rests.

## Recommended setup

A single small Linux VM (EU region) running the app in Docker behind Caddy
(automatic HTTPS), SQLite file on an encrypted volume, nightly encrypted
backups to a second location. This keeps one process, one file, no database
password to leak, and is cheap (about €4–8/month).

Alternative: Vercel/serverless with Turso. Easier to run, but the data then sits
with a US-based third party in plain text, which is worse for your goal until
feature 1 (encryption in the browser) exists. Not recommended before that.

## Phase 0 – Decisions (You)

- [ ] **Decide who the users are.** Only you and family (accounts created, then
      registration closed) or the public. Public hosting adds GDPR duties (privacy
      policy, imprint, data processing agreements, deletion on request) and makes
      feature 1 close to mandatory. Everything below assumes **private use first**.
- [ ] **Decide the provider and region.** EU region (e.g. Hetzner, Germany).
      Provider with an EU company avoids transfer issues.
- [ ] **Decide on a domain** (or use the provider's hostname for a start).
- [ ] **Decide whether to do feature 1 (encryption in the browser) before going
      public.** Recommended yes for any user beyond the family circle.

## Phase 1 – Code hardening before the first deploy

- [x] **[Claude] Dockerfile and `.dockerignore`.** Multi-stage build, non-root
      user, only `.next`, `drizzle/`, `node_modules` (production) in the image;
      `data/`, `.env*`, `vendor/`, tests excluded. `data/` is a mounted volume.
      *Done: `Dockerfile`, `.dockerignore`. Not yet built here (no Docker on the development machine); the standalone server it runs was tested locally. Build it once on the server and check that `docker compose ps` shows the app as healthy.*
- [x] **[Claude] `docker-compose.yml`** with the app and Caddy, app port not
      published to the internet (only Caddy reaches it), volume for `data/`,
      restart policy.
      *Done: app port only reachable by Caddy, read-only root file system, all capabilities dropped, volume for the data.*
- [x] **[Claude] Caddyfile** for automatic HTTPS and redirect from HTTP.
      *Done: `Caddyfile`; needs `DOMAIN` in `.env`.*
- [x] **[Claude] Security headers** in `next.config.ts`: `Strict-Transport-Security`,
      `Content-Security-Policy` (no third-party sources; the app has none),
      `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
      `X-Frame-Options`/`frame-ancestors`. Test the pages in a browser afterwards.
      *Done: CSP, HSTS, nosniff, frame denial, referrer and permissions policy; checked in Firefox on all pages (zod set to `jitless` so the CSP reports nothing).*
- [x] **[Claude] Sign-in rate limiting.** Limit attempts per e-mail and per IP
      (table or in-memory with backoff) on login and registration. Today there is
      none, so passwords can be guessed without limit.
      *Done: 10 failed attempts per e-mail and 40 per IP per 15 minutes on login, 5 per hour per IP on registration; counters are hashed in the table `rate_limits`; tested in unit tests and in the browser.*
- [x] **[Claude] Password rules.** Minimum length (e.g. 12), reject trivially
      common passwords. Check what the registration form enforces today.
      *Done: registration already required at least 10 characters; no list of common passwords (left out on purpose, the rate limit is the main protection).*
- [x] **[Claude] Session review.** Cookie is already `httpOnly`, `sameSite=lax`
      and `secure` in production. Check expiry, deletion on logout, deletion of all
      sessions on password change, and that the session lookup cannot be bypassed.
      *Done: tokens are random and stored only as SHA-256, the cookie is `httpOnly`, `sameSite=lax` and `secure`, 30 days, logout deletes the session. There is no password change yet; when it comes (feature 1) it must delete all other sessions.*
- [x] **[Claude] Server action review.** Every action checks the signed-in user
      and ownership of the profile/plan record (no access to other users' rows).
      Add tests that user A cannot read or change user B's data.
      *Done: every action resolves the user from the session and filters by it; covered by `src/lib/data-isolation.test.ts`.*
- [x] **[Claude] Input limits.** Maximum size of profile JSON and plan records,
      maximum number of profiles per scope, so one account cannot fill the disk.
      *Done: profile values are re-validated and clamped on the server, at most 20 profiles per scope, plan records at most 64 KB each and 300 per user; covered by tests.*
- [x] **[Claude] Health endpoint** (`/api/health`, no data) for monitoring and the
      container health check.
      *Done: `/api/health`, also used by the Docker health check.*
- [x] **[Claude] No sensitive logging.** Check that e-mails, values and errors with
      user data are not written to logs.
      *Done: the code has no `console` calls.*
- [x] **[Claude] Dependency audit.** `npm audit`, update patch versions, pin the
      Node version in `package.json` (`engines`) and the Docker image.
      *Done: `npm audit --omit=dev` reports 0 vulnerabilities; the remaining findings are in dev tools (vitest, drizzle-kit) that are not in the image. `engines` requires Node >= 20.9, the image uses Node 22.*
- [x] **[Claude] Account tools:** a script/command to delete an account with all
      its data, and one to export it (needed for GDPR requests later, useful now).
      *Done: `node scripts/account.mjs list | export <email> | delete <email>`.*
- [x] **[Claude] Remove the stray empty file `main`** from the repository root
      (and decide about the duplicate commits on GitHub; see below).
      *Done: removed.*
- [x] **[Claude] Make the database file private.** Create `data/` with mode 700
      and the DB file with 600 on start, so other users on the server cannot read it.
      *Done: data directory mode 700, database files 600 (Linux).*

## Phase 2 – Server and network (You, with Claude writing the commands)

- [ ] **[You] Create the VM** (Ubuntu LTS, EU region), add your SSH key, disable
      password login and root login.
- [ ] **[You] Point the domain** (A/AAAA record) at the server.
- [ ] **[Claude] Provide a server setup script/checklist:** automatic security
      updates (`unattended-upgrades`), firewall allowing only 22 (ideally restricted
      to your IP), 80 and 443, `fail2ban` for SSH, Docker install.
- [ ] **[You] Run the setup**, clone the repository, create `.env` on the server
      only (never in Git), `docker compose up -d`.
- [ ] **[You] Turn on full-disk or volume encryption** at the provider (or LUKS)
      so the database and backups are encrypted at rest.
- [ ] **[You] Set `ALLOW_REGISTRATION=false`** as soon as the accounts you need
      exist (create them first, then close registration and restart).
- [ ] **[You] Check from outside:** HTTPS grade (e.g. SSL Labs, securityheaders.com),
      port scan shows only 80/443 (and 22), the app port is not reachable directly.

## Phase 3 – Backups and recovery

The database is one file; losing it means losing every account.

- [ ] **[Claude] Backup script** using SQLite's online backup (`sqlite3 .backup` or
      `VACUUM INTO`), not a plain file copy of a running database; compress and
      **encrypt** the result (e.g. `age` or `gpg`) before it leaves the server.
- [ ] **[Claude] Restore script** and a restore description in this file.
- [ ] **[You] Provide a second location** for backups (object storage or another
      server in a different datacenter), with credentials that can only *write*
      new backups, not delete old ones. Keep the encryption key **off** the server
      (password manager plus a printed copy).
- [ ] **[You] Schedule the backup** (cron/systemd timer, daily; keep e.g. 7 daily,
      4 weekly, 12 monthly).
- [ ] **[You] Test a restore** into a scratch directory before relying on it, and
      repeat every few months. An untested backup is not a backup.
- [ ] **[You] Delete** `data/financecockpit.backup-2026-10-11.db` once everything
      is verified (from [TODO.md](TODO.md) item 11).

## Phase 4 – Operation

- [ ] **[You] Uptime monitoring** on `/api/health` (free tier of any monitor) with
      mail notification.
- [ ] **[Claude] Update routine** described in this file: pull, rebuild, check
      migrations on a copy of the database first, restart, check health.
- [ ] **[You] Monthly:** apply OS updates (if not automatic), `npm audit`, check
      that the last backup exists and is recent.
- [ ] **[You] Keep secrets in a password manager:** server login, backup key,
      domain account. Use two-factor authentication on the provider, the domain
      registrar and GitHub.
- [ ] **[You] Incident plan in one paragraph:** if you suspect a leak, take the
      app offline, rotate the backup credentials, delete all sessions
      (`DELETE FROM sessions`), tell the users, change passwords.

## Phase 5 – Only for public hosting

- [ ] **[You] Legal:** imprint (Impressum), privacy policy, processing agreement
      with the hosting provider; check whether the app counts as financial advice
      (it should state clearly that it is a calculator, no advice). Have this
      checked by a lawyer or a reliable template service.
- [ ] **[Claude] Implement feature 1** (encryption in the browser, recovery key,
      password change, optional anonymous statistics) per
      [PLANNED_FEATURES.md](PLANNED_FEATURES.md).
- [ ] **[Claude] "Forgot password"** (covered by the recovery key of feature 1; an
      e-mail flow would need a mail provider and is not planned).
- [ ] **[Claude] Cookie/privacy notice:** the app sets only a session cookie and a
      language cookie, both technically necessary; document this in the privacy
      policy.
- [ ] **[You] Licence:** publish the source code under the AGPL (see
      [README.md](README.md), "Syncing with the Finanzfluss original").
- [ ] **[Claude] Account deletion in the interface** (not just a script).

## Repository housekeeping

- [ ] **[You] Decide about the duplicate commit pair on GitHub** (`6cc8afa` /
      `63fa1f5`). Rewriting pushed history is possible but not needed; leaving it
      is harmless.
- [ ] **[Claude] Confirm no secrets in Git history:** search for keys, tokens and
      `.env` content before the repository becomes public. `data/` and `.env*` are
      already ignored.

## Suggested order

1. Phase 0 decisions.
2. Phase 1 (everything Claude can do in one or two rounds).
3. Phase 3 scripts, then Phase 2 and the backup setup on the server.
4. Phase 4.
5. Phase 5 only if others than you and your family will use it.
