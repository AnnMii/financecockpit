// Search engines are kept out by default. To allow indexing later, set
// ALLOW_INDEXING=true (app) and ROBOTS_TAG=all (Caddy), see HOSTING.md.
export function indexingAllowed(): boolean {
  return process.env.ALLOW_INDEXING === "true";
}
