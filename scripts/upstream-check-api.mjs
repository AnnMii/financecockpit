// Two calculators (pension gap, withdrawal plan) are not part of the Finanzfluss
// source repository; their website computes them on a server. Our formulas
// were derived from that server's answers, which are stored as fixtures in
// test/fixtures and checked by the unit tests.
//
//   npm run upstream:check-api              ask the server again and report
//                                           answers that differ from the fixtures
//   npm run upstream:check-api -- --record  store the current answers (after
//                                           adding cases or accepting a change)
import { readFileSync, writeFileSync } from "node:fs";

const API = "https://api.finanzfluss.de/calculator";
const FIXTURES = [
  { file: "test/fixtures/pension-gap.json", endpoint: "pension-gap-calculator" },
  { file: "test/fixtures/withdrawal-plan.json", endpoint: "withdrawl-plan-calculator" },
];
const record = process.argv.includes("--record");
let differences = 0;

for (const { file, endpoint } of FIXTURES) {
  const fixture = JSON.parse(readFileSync(file, "utf8"));
  for (const testCase of fixture.cases) {
    const url = `${API}/${endpoint}?${new URLSearchParams(testCase.params)}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`${endpoint} / ${testCase.name}: HTTP ${response.status}`);
      differences++;
      continue;
    }
    const answer = await response.json();
    // The chart data is not part of what we compare.
    delete answer.diagramData;

    if (record) {
      testCase.expected = answer;
    } else if (JSON.stringify(answer) !== JSON.stringify(testCase.expected)) {
      differences++;
      console.log(`${endpoint} / ${testCase.name}`);
      console.log(`  fixture: ${JSON.stringify(testCase.expected)}`);
      console.log(`  server:  ${JSON.stringify(answer)}`);
    }
  }
  if (record) {
    fixture.recordedAt = new Date().toISOString().slice(0, 10);
    writeFileSync(file, `${JSON.stringify(fixture, null, 2)}\n`);
    console.log(`Recorded ${fixture.cases.length} cases in ${file}`);
  }
}

if (!record) {
  console.log(
    differences === 0
      ? "The server still gives the answers stored in the fixtures."
      : `${differences} answer(s) differ. Check the formulas, then run with --record.`,
  );
  process.exit(differences === 0 ? 0 : 1);
}
