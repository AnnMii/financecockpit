// Shows what changed in the Finanzfluss calculators since the commit our
// implementation follows (the commit the submodule is pinned to).
//
//   npm run upstream:diff            compare with the latest upstream commit
//   npm run upstream:diff -- v1.4.3  compare with another commit or tag
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const SUBMODULE = "vendor/finanzfluss-calculators";

// The files our AV-Depot calculator is derived from.
const PATHS = [
  "src/calculators/av-depot.ts",
  "src/calculators/income-tax.ts",
  "src/constants/av-depot.ts",
  "src/utils/Lohnsteuer",
  "src/utils/financial.ts",
  "test/calculators/av-depot.test.ts",
];

if (!existsSync(`${SUBMODULE}/package.json`)) {
  console.error(
    `${SUBMODULE} is empty. Run "git submodule update --init" first.`,
  );
  process.exit(1);
}

const git = (args, options = {}) =>
  execFileSync("git", ["-C", SUBMODULE, ...args], {
    encoding: "utf8",
    ...options,
  });

git(["fetch", "--quiet", "--tags", "origin"]);

const pinned = git(["rev-parse", "--short", "HEAD"]).trim();
const target = process.argv[2] ?? "origin/main";
const targetCommit = git(["rev-parse", "--short", target]).trim();
const range = `${pinned}..${targetCommit}`;

const changedFiles = git(["diff", "--stat", range, "--", ...PATHS]).trim();

console.log(`Pinned commit: ${pinned}`);
console.log(`Compared with: ${target} (${targetCommit})\n`);

if (!changedFiles) {
  console.log("No changes in the calculator files.");
  process.exit(0);
}

console.log("Commits touching the calculator files:");
console.log(git(["log", "--oneline", range, "--", ...PATHS]) || "(none ahead)\n");
console.log(changedFiles, "\n");
git(["--no-pager", "diff", range, "--", ...PATHS], { stdio: "inherit" });
