
import { parseSynthesisOutput } from "../services/prompts/synthesis.schema.js";
import { parsePrioritizationOutput } from "../services/prompts/prioritization.schema.js";

let passed = 0;
let failed = 0;

// Helpers
function assert(label, fn) {
  try {
    fn();
    console.log(`  ✅ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${label} — ${err.message}`);
    failed++;
  }
}

function assertThrows(label, fn, expectedMessage) {
  try {
    fn();
    console.error(`  ❌ ${label} — expected throw, got none`);
    failed++;
  } catch (err) {
    if (expectedMessage && !err.message.includes(expectedMessage)) {
      console.error(`  ❌ ${label} — wrong error message: ${err.message}`);
      failed++;
    } else {
      console.log(`  ✅ ${label} (threw as expected)`);
      passed++;
    }
  }
}

console.log("\n=== BuildLoop Phase 2 — Schema Tests ===\n");


// SYNTHESIS TESTS
console.log("[ synthesis.schema.js ]");

const VALID_SYNTHESIS = JSON.stringify([
  {
    clusterLabel: "Mobile onboarding takes too many steps",
    summary:
      "Eight users described friction during initial mobile sign-up. Repeated form steps cause drop-off before activation.",
    sentiment: "negative",
    frequency: 8,
    representativeQuotes: [
      "I gave up after step 4",
      "Why re-enter my email twice?",
    ],
  },
]);

assert("accepts valid synthesis JSON", () => {
  const result = parseSynthesisOutput(VALID_SYNTHESIS, "proj-1");
  if (result.length !== 1) throw new Error("Expected 1 cluster");
  if (result[0].sentiment !== "negative") throw new Error("Wrong sentiment");
});

assert("strips ```json fences", () => {
  const fenced = "```json\n" + VALID_SYNTHESIS + "\n```";
  const result = parseSynthesisOutput(fenced, "proj-1");
  if (!Array.isArray(result)) throw new Error("Expected array");
});

assertThrows("rejects non-JSON output", () => {
  parseSynthesisOutput("Some random text instead of JSON", "proj-1");
}, "invalid JSON");

assertThrows("rejects invalid sentiment", () => {
  parseSynthesisOutput(
    JSON.stringify([
      {
        clusterLabel: "Some label",
        summary:
          "This is a sufficiently long summary text to pass validation.",
        sentiment: "happy",
        frequency: 3,
        representativeQuotes: ["quote"],
      },
    ]),
    "proj-1"
  );
}, "invalid JSON");

assertThrows("rejects empty quotes", () => {
  parseSynthesisOutput(
    JSON.stringify([
      {
        clusterLabel: "Some label",
        summary:
          "This is a sufficiently long summary text to pass validation.",
        sentiment: "negative",
        frequency: 3,
        representativeQuotes: [],
      },
    ]),
    "proj-1"
  );
}, "invalid JSON");


// PRIORITIZATION TESTS

console.log("\n[ prioritization.schema.js ]");

const VALID_PRIORITIZATION = JSON.stringify([
  {
    title: "Streamline mobile onboarding flow",
    priorityScore: 88,
    priorityRationale:
      "High user pain, high frequency, estimated 1 sprint to resolve.",
    effort: "medium",
    impact: "high",
  },
]);

assert("accepts valid prioritization JSON", () => {
  const result = parsePrioritizationOutput(VALID_PRIORITIZATION, "proj-1");
  if (result[0].priorityScore !== 88) throw new Error("Wrong score");
  if (result[0].effort !== "medium") throw new Error("Wrong effort");
});

assert("strips ``` fences", () => {
  const fenced = "```\n" + VALID_PRIORITIZATION + "\n```";
  const result = parsePrioritizationOutput(fenced, "proj-1");
  if (!Array.isArray(result)) throw new Error("Expected array");
});

assertThrows("rejects priorityScore > 100", () => {
  parsePrioritizationOutput(
    JSON.stringify([
      {
        title: "Feature title",
        priorityScore: 110,
        priorityRationale: "Valid rationale text here.",
        effort: "low",
        impact: "high",
      },
    ]),
    "proj-1"
  );
}, "invalid JSON");

assertThrows("rejects invalid effort", () => {
  parsePrioritizationOutput(
    JSON.stringify([
      {
        title: "Feature title",
        priorityScore: 70,
        priorityRationale: "Valid rationale text here.",
        effort: "huge",
        impact: "high",
      },
    ]),
    "proj-1"
  );
}, "invalid JSON");

assertThrows("rejects priorityScore < 0", () => {
  parsePrioritizationOutput(
    JSON.stringify([
      {
        title: "Feature title",
        priorityScore: -5,
        priorityRationale: "Valid rationale text here.",
        effort: "low",
        impact: "low",
      },
    ]),
    "proj-1"
  );
}, "invalid JSON");


// SUMMARY

console.log(`\n=== Results: ${passed} passed | ${failed} failed ===\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 All Phase 2 schema tests passed.\n");
  console.log("Next:");
  console.log("  POST /api/insights/synthesize");
  console.log("  POST /api/insights/prioritize");
  console.log("  POST /api/workspace/ask\n");
}