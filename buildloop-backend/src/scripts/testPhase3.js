// backend/src/scripts/testPhase3.js
//
// Phase 3 — Lean Integration Test  (6 real API calls total)
//
//  Call 1  Voyage AI  embed 1 code chunk
//  Call 2  Pinecone   upsert
//  Call 3  Claude     /api/workspace/ask  (turn 1, messages=[])
//  Call 4  Claude     /api/workspace/ask  (turn 2, messages=[Q1,A1]) ← multi-turn
//  Call 5  Pinecone   deleteMany  (cleanup)
//   + 3 validation calls that never reach Claude (400s only)
//
//  HOW TO RUN:
//    Terminal 1:  node src/index.js
//    Terminal 2:  node src/scripts/testPhase3.js
//
//  Cost: ~$0.01   Time: ~25s

import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import * as Voyage from "voyageai";

const BASE = process.env.API_URL ?? "http://localhost:5000";
const PID  = "__p3test__proj";
const VID  = "__p3test__chunk_0";

// ─── colours ─────────────────────────────────────────────────────────────────
const ok   = (m)    => console.log(`  \x1b[32m✅\x1b[0m ${m}`);
const fail = (m, e) => console.error(`  \x1b[31m❌\x1b[0m ${m}\n     \x1b[2m${e?.message ?? e}\x1b[0m`);
const info = (m)    => console.log(`  \x1b[36m→\x1b[0m  ${m}`);
const warn = (m)    => console.log(`  \x1b[33m⚠\x1b[0m  ${m}`);
const head = (n, l) => console.log(`\n\x1b[1m[ STEP ${n} ]\x1b[0m \x1b[1m${l}\x1b[0m`);
const rule = ()     => console.log("\x1b[2m" + "─".repeat(55) + "\x1b[0m");
const sleep = (ms)  => new Promise((r) => setTimeout(r, ms));

// one small but real code chunk — auth middleware
const CODE = `// auth.middleware.js — verifies Clerk JWT on every protected route
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
export const requireAuth = ClerkExpressRequireAuth({
  onError: (_err, _req, res) => {
    res.status(401).json({ error: "Unauthorised", message: "Valid Clerk JWT required." });
  },
});
// req.auth.userId → Clerk user ID
// Usage: router.get("/api/feedback/:projectId", requireAuth, handler);`;

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await r.json().catch(() => ({})) };
}

async function run() {
  console.log("\n\x1b[1m" + "═".repeat(55) + "\x1b[0m");
  console.log("\x1b[1m  Phase 3 — Lean Integration Test\x1b[0m");
  console.log("\x1b[1m" + "═".repeat(55) + "\x1b[0m");

  // env check
  const REQUIRED_KEYS = ["VOYAGE_API_KEY","PINECONE_API_KEY","PINECONE_INDEX", process.env.USE_GEMINI ? "GEMINI_API_KEY" : null,].filter(Boolean);
  const missing = REQUIRED_KEYS.filter((k) => !process.env[k]);
  if (missing.length) { console.error(`\n  Missing: ${missing.join(", ")}\n`); process.exit(1); }

  const voyage = new Voyage.VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY
});
  const ns     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
                   .index(process.env.PINECONE_INDEX).namespace("workspace");

  let passed = 0, failed = 0;
  let firstAnswer = "";

  // ── STEP 1: Seed one code chunk → Pinecone ──────────────────────────────
  head(1, "Seed Pinecone (1 chunk, API call 1+2)");
  try {
    const emb = await voyage.embed({ model: "voyage-3", input: [CODE], inputType: "document" });
    const vec = emb.data[0].embedding;
    if (vec.length !== 1024) throw new Error(`dim=${vec.length}, expected 1024`);

    await ns.upsert({ records: [{ id: VID, values: vec,
      metadata: { text: CODE, fileName: "auth.middleware.js", language: "JavaScript", projectId: PID }
    }]});

    ok("1 vector seeded — waiting 6s for Pinecone to index...");
    await sleep(6000);
    passed++;
  } catch (err) {
    fail("Seed failed", err);
    console.error("  Cannot continue without seeded vectors.\n"); process.exit(1);
  }

  // ── STEP 2: Server health ────────────────────────────────────────────────
  head(2, "Server health check");
  try {
    let up = false;
    for (const p of ["/api/health", "/health", "/api"]) {
      try { if ((await fetch(`${BASE}${p}`)).status < 500) { up = true; break; } } catch {}
    }
    if (!up) throw new Error(`Not reachable at ${BASE}`);
    ok(`Server up at ${BASE}`);
    passed++;
  } catch (err) {
    fail("Server not reachable — run: node src/index.js", err);
    await ns.deleteMany({ ids: [VID] }).catch(() => {});
    process.exit(1);
  }

  // ── STEP 3: First question (turn 1, messages=[]) — API call 3 ───────────
  head(3, "Turn 1 — messages=[]  (API call 3)");
  info("Q: 'How does auth middleware verify JWT?'  ~10-15s...");
  try {
    const t0 = Date.now();
    const { status, data } = await post("/api/workspace/ask", {
      projectId: PID,
      question:  "How does the auth middleware verify the JWT token?",
      messages:  [],
    });
    const ms = Date.now() - t0;

    if (status !== 200) throw new Error(`status=${status} ${JSON.stringify(data)}`);
    if (!data.answer)   throw new Error("Missing 'answer' in response");
    if (!Array.isArray(data.citations)) throw new Error("Missing 'citations' array");

    firstAnswer = data.answer;
    ok(`Answer in ${ms}ms`);
    rule();
    firstAnswer.split("\n").filter(Boolean).forEach((l) => console.log(`  ${l}`));
    rule();

    // grounding check
    const hits = ["clerk","jwt","401","requireauth","token"].filter((t) => firstAnswer.toLowerCase().includes(t));
    hits.length >= 2
      ? ok(`Grounded — mentions: ${hits.join(", ")}`)
      : warn(`Low grounding — only matched: ${hits.join(", ")}`);

    // citation shape check (all 5 fields CitationCards needs)
    const required = ["sourceIndex","fileName","language","excerpt","score"];
    const allGood  = data.citations.every((c) => required.every((f) => c[f] !== undefined));
    info(`Citations: ${data.citations.length}`);
    data.citations.forEach((c) =>
      info(`  [${c.sourceIndex}] ${c.fileName}  score=${(c.score*100).toFixed(0)}%  excerpt="${String(c.excerpt).slice(0,50).replace(/\n/g,"↵")}..."`)
    );
    allGood
      ? ok("Citation shape correct — all 5 fields present (CitationCards will render)")
      : warn("Citation missing fields — check workspace.service.js citations map");

    passed++;
  } catch (err) {
    fail("Turn 1 failed", err);
    failed++;
    firstAnswer = "";
  }

  // ── STEP 4: Follow-up (turn 2, messages=[Q1,A1]) — API call 4 ───────────
  head(4, "Turn 2 — messages=[Q1,A1]  multi-turn  (API call 4)");

  if (!firstAnswer) {
    warn("Skipping — Turn 1 failed");
  } else {
    info("Q: 'What status code on failure?' with prior history in messages[]");
    try {
      const { status, data } = await post("/api/workspace/ask", {
        projectId: PID,
        question:  "What HTTP status code does it return on failure?",
        messages:  [
          { role: "user",      content: "How does the auth middleware verify the JWT token?" },
          { role: "assistant", content: firstAnswer },
        ],
      });

      if (status !== 200) throw new Error(`status=${status}`);
      if (!data.answer)   throw new Error("Missing answer");

      ok("Multi-turn answer received");
      info(`Answer: "${data.answer.slice(0,150).replace(/\n/g," ")}..."`);

      data.answer.includes("401")
        ? ok("Multi-turn correct — Claude answered 401 from conversation history ✓")
        : warn("Answer didn't mention 401 — check messages[] is forwarded to Claude");

      passed++;
    } catch (err) {
      fail("Multi-turn failed", err);
      failed++;
    }
  }

  // ── STEP 5: Validation (3 checks, no Claude calls) ──────────────────────
  head(5, "Validation — 3 × 400 checks  (no Claude calls)");
  const checks = [
    { label: "empty question",     body: { projectId: PID, question: "  ",  messages: [] } },
    { label: "missing projectId",  body: { question: "How does auth work?", messages: [] } },
    { label: "messages not array", body: { projectId: PID, question: "test", messages: "string" } },
  ];

  let validPassed = 0;
  for (const { label, body } of checks) {
    try {
      const { status, data } = await post("/api/workspace/ask", body);
      if (status === 400 && data.success === false) {
        ok(`400 ← ${label} ("${data.message}")`);
        validPassed++;} else {
          fail(
            `Validation failed for ${label}`,
            `status=${status}, response=${JSON.stringify(data)}`
          );
          failed++;
        }
    } catch (err) {
      fail(`${label} check threw`, err);
    }
  }
  if (validPassed >= 2) passed++; else failed++;

  // ── STEP 6: Cleanup ──────────────────────────────────────────────────────
  head(6, "Cleanup — deleteVectors  (API call 5)");
  try {
    await ns.deleteMany({ ids: [VID] });
    ok("Test vector deleted — Pinecone index is clean");
    passed++;
  } catch (err) {
    fail("Cleanup failed — manually delete vector id: " + VID, err);
    failed++;
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n\x1b[1m" + "═".repeat(55) + "\x1b[0m");
  failed === 0
    ? console.log(`\x1b[32m\x1b[1m  🎉 All ${passed}/6 steps passed — Phase 3 verified.\x1b[0m`)
    : console.log(`  \x1b[32m\x1b[1m✅ ${passed} passed\x1b[0m   \x1b[31m\x1b[1m❌ ${failed} failed\x1b[0m`);
  console.log("\x1b[1m" + "═".repeat(55) + "\x1b[0m\n");
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => { console.error("\x1b[31mUnexpected error:\x1b[0m", err); process.exit(1); });