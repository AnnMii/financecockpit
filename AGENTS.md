<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Daily dependency and security check

Whenever a prompt is worked on, first look at the file `.dependency-check` in the
repository root (it holds the time of the last check as an ISO date, and is
ignored by Git). If it is missing or older than 24 hours, do this check before
the actual task, then write the new time into the file:

1. `npm audit --omit=dev` (what runs in production) and `npm audit` (dev tools).
2. `npm outdated`, with a look at the packages that matter most for safety:
   `next`, `react`, `react-dom`, `@libsql/client`, `drizzle-orm`, `zod`.
3. If something looks serious (a high or critical advisory, or a security
   release of a package above), search the web for the advisory and check
   whether the app is actually affected.
4. Report the result in two or three lines at the start of the answer: nothing
   new, or what was found and which version fixes it.

The check is not automatic: it only happens when a prompt is worked on, so at
least once a day when the project is in use. Never upgrade, install or change
`package.json` as part of the check without asking; propose the update instead.
Skip the check only if the user asks for it. Use the user's language for the
report.
