/**
 * Recommendation Integration Tests — FeastPilot Advanced Reasoning V1
 *
 * Tests all six recommendation types:
 *   1. Spicy recommendation
 *   2. Vegetarian recommendation
 *   3. Dessert recommendation
 *   4. Pairing recommendation
 *   5. Budget recommendation
 *   6. Value recommendation
 *
 * Uses real AgentService with MODEL_PROVIDER forced to "mock".
 * Run: npx ts-node src/dev/runRecommendationTests.ts
 */

// Force mock provider before any module is imported.
process.env.MODEL_PROVIDER = "mock";

import { agentService } from "../services/AgentService";
import { sessionService } from "../services/SessionService";

// ── Fixtures ──────────────────────────────────────────────────────────────────
//
// behrouz_biryani menu:
//   bb_1  Paneer Biryani          ₹329  Biryani  veg   serving=1
//   bb_2  Veg Dum Biryani         ₹299  Biryani  veg   serving=1
//   bb_3  Chicken Dum Biryani     ₹389  Biryani  non   serving=1
//   bb_4  Mutton Biryani          ₹499  Biryani  non   serving=1
//   bb_5  Gulab Jamun             ₹99   Dessert  veg   serving=1
//
// chinese_wok menu (budget range):
//   cw_1  Veg Hakka Noodles       ₹199  Noodles  veg   serving=1
//   cw_3  Chicken Hakka Noodles   ₹249  Noodles  non   serving=1
//   cw_4  Chicken Manchurian      ₹279  Starter  non   serving=1   ← spicy

// ── Harness ───────────────────────────────────────────────────────────────────

interface TestOutcome {
  name: string;
  passed: boolean;
  reason?: string;
}

const outcomes: TestOutcome[] = [];

function record(name: string, passed: boolean, reason?: string): void {
  outcomes.push({ name, passed, reason });
  console.log(passed ? `[PASS] ${name}` : `[FAIL] ${name}`);
  if (!passed && reason) console.log(`       Reason: ${reason}`);
}

async function send(sessionId: string, message: string): Promise<string> {
  const result = await agentService.handleMessage(sessionId, message);
  return result.response;
}

/** Create a session with Behrouz Biryani already selected. */
async function setupBehrouzSession(): Promise<string> {
  const session = await sessionService.createSession();
  await send(session.id, "I want biryani");
  await send(session.id, "Behrouz");
  await send(session.id, "show menu");
  return session.id;
}

/** Create a session with Chinese Wok selected (for spice tests cross-restaurant). */
async function setupChineseWokSession(): Promise<string> {
  const session = await sessionService.createSession();
  await send(session.id, "I want chinese");
  await send(session.id, "Chinese Wok");
  await send(session.id, "show menu");
  return session.id;
}

// ── Test 1: Spicy recommendation ─────────────────────────────────────────────

async function testSpicyRecommendation(): Promise<void> {
  // Test A — spicy recommendation at Behrouz (biryani is considered spicy)
  {
    const sessionId = await setupBehrouzSession();
    const response = await send(sessionId, "Suggest something spicy");

    const lower = response.toLowerCase();
    const mentionsBiryani = lower.includes("biryani") || lower.includes("dum");
    const mentionsPrice = response.includes("₹");

    record(
      "Spicy 1A — Behrouz: suggests a spicy item",
      mentionsBiryani && mentionsPrice,
      `response="${response}"`
    );
  }

  // Test B — generic spicy query without restaurant
  {
    const session = await sessionService.createSession();
    const response = await send(session.id, "Recommend something spicy");

    const lower = response.toLowerCase();
    const isRecommendation = lower.includes("₹") && response.length > 10;

    record(
      "Spicy 1B — No restaurant: returns a spicy recommendation",
      isRecommendation,
      `response="${response}"`
    );
  }
}

// ── Test 2: Vegetarian recommendation ────────────────────────────────────────

async function testVegetarianRecommendation(): Promise<void> {
  // Test A — vegetarian at Behrouz: should suggest Paneer or Veg Dum Biryani
  {
    const sessionId = await setupBehrouzSession();
    const response = await send(sessionId, "Best vegetarian option");

    const lower = response.toLowerCase();
    const mentionsVegItem =
      lower.includes("paneer") || lower.includes("veg dum") || lower.includes("veg");
    const mentionsPrice = response.includes("₹");

    record(
      "Veg 2A — Behrouz: suggests vegetarian main course",
      mentionsVegItem && mentionsPrice,
      `response="${response}"`
    );
  }

  // Test B — "recommend a veg dish" phrasing
  {
    const sessionId = await setupBehrouzSession();
    const response = await send(sessionId, "Recommend a veg dish");

    const lower = response.toLowerCase();
    const isVegRecommendation = lower.includes("veg") || lower.includes("paneer");

    record(
      "Veg 2B — Behrouz: 'recommend a veg dish' triggers vegetarian",
      isVegRecommendation,
      `response="${response}"`
    );
  }
}

// ── Test 3: Dessert recommendation ───────────────────────────────────────────

async function testDessertRecommendation(): Promise<void> {
  // Test A — dessert at Behrouz: should suggest Gulab Jamun (₹99)
  {
    const sessionId = await setupBehrouzSession();
    const response = await send(sessionId, "Recommend a dessert");

    const lower = response.toLowerCase();
    const mentionsGulab = lower.includes("gulab") || lower.includes("jamun");
    const mentionsPrice = response.includes("₹99") || response.includes("₹");

    record(
      "Dessert 3A — Behrouz: suggests Gulab Jamun",
      mentionsGulab && mentionsPrice,
      `response="${response}"`
    );
  }

  // Test B — "something sweet" phrasing
  {
    const sessionId = await setupBehrouzSession();
    const response = await send(sessionId, "I want something sweet to finish");

    const lower = response.toLowerCase();
    const isDessertResponse = lower.includes("gulab") || lower.includes("₹99") || lower.includes("dessert");

    record(
      "Dessert 3B — Behrouz: 'something sweet' triggers dessert",
      isDessertResponse,
      `response="${response}"`
    );
  }

  // Test C — dedicated dessert restaurant (Sweet Truth)
  {
    const session = await sessionService.createSession();
    await send(session.id, "I want dessert");
    await send(session.id, "Sweet Truth");
    const response = await send(session.id, "Recommend a dessert");

    const lower = response.toLowerCase();
    const mentionsDessert =
      lower.includes("cake") || lower.includes("brownie") ||
      lower.includes("cheesecake") || lower.includes("tiramisu") ||
      lower.includes("₹");

    record(
      "Dessert 3C — Sweet Truth: recommends from dessert restaurant",
      mentionsDessert,
      `response="${response}"`
    );
  }
}

// ── Test 4: Pairing recommendation ───────────────────────────────────────────

async function testPairingRecommendation(): Promise<void> {
  // Test A — "what goes well with chicken biryani" at Behrouz
  {
    const sessionId = await setupBehrouzSession();
    const response = await send(sessionId, "What goes well with chicken biryani?");

    const lower = response.toLowerCase();
    // Should recommend Gulab Jamun (the dessert) as a pairing
    const mentionsGulab = lower.includes("gulab") || lower.includes("jamun");
    const mentionsPairing = lower.includes("pair") || lower.includes("well");

    record(
      "Pairing 4A — Behrouz: biryani pairs with Gulab Jamun",
      mentionsGulab && mentionsPairing,
      `response="${response}"`
    );
  }

  // Test B — "what goes well with gulab jamun" at Behrouz
  {
    const sessionId = await setupBehrouzSession();
    const response = await send(sessionId, "What goes well with gulab jamun?");

    const lower = response.toLowerCase();
    // Dessert → should pair with a main (biryani)
    const mentionsBiryani = lower.includes("biryani");

    record(
      "Pairing 4B — Behrouz: gulab jamun pairs with a biryani",
      mentionsBiryani,
      `response="${response}"`
    );
  }
}

// ── Test 5: Budget recommendation ────────────────────────────────────────────

async function testBudgetRecommendation(): Promise<void> {
  // Test A — "recommend something under ₹500" at Behrouz
  {
    const sessionId = await setupBehrouzSession();
    const response = await send(sessionId, "Recommend something under ₹500");

    const lower = response.toLowerCase();
    const mentionsItem = lower.includes("biryani") || lower.includes("gulab") || lower.includes("₹");
    // All Behrouz items are ≤ ₹499
    const withinBudget = !response.includes("₹549") && !response.includes("₹599");

    record(
      "Budget 5A — Behrouz: recommends item under ₹500",
      mentionsItem && withinBudget,
      `response="${response}"`
    );
  }

  // Test B — "recommend something under ₹200" across all restaurants
  {
    const session = await sessionService.createSession();
    const response = await send(session.id, "Recommend something under ₹200");

    const lower = response.toLowerCase();
    const isRecommendation = lower.includes("₹") && response.length > 10;

    record(
      "Budget 5B — Global: recommends item under ₹200",
      isRecommendation,
      `response="${response}"`
    );
  }

  // Test C — "cheap option" (generic budget without number)
  {
    const sessionId = await setupBehrouzSession();
    const response = await send(sessionId, "What's a cheap option?");

    const isRecommendation = response.includes("₹") && response.length > 10;

    record(
      "Budget 5C — Behrouz: 'cheap option' triggers budget recommendation",
      isRecommendation,
      `response="${response}"`
    );
  }
}

// ── Test 6: Value recommendation ─────────────────────────────────────────────

async function testValueRecommendation(): Promise<void> {
  // Test A — "best value item" at Behrouz
  {
    const sessionId = await setupBehrouzSession();
    const response = await send(sessionId, "Best value item");

    const lower = response.toLowerCase();
    const isValueResponse =
      lower.includes("₹") &&
      (lower.includes("portion") || lower.includes("value") || lower.includes("biryani"));

    record(
      "Value 6A — Behrouz: returns best value item",
      isValueResponse,
      `response="${response}"`
    );
  }

  // Test B — "value for money" phrasing
  {
    const sessionId = await setupBehrouzSession();
    const response = await send(sessionId, "What's good value for money?");

    const isValueResponse = response.includes("₹") && response.length > 10;

    record(
      "Value 6B — Behrouz: 'value for money' triggers value recommendation",
      isValueResponse,
      `response="${response}"`
    );
  }
}

// ── No false positives — ordering messages should NOT trigger recommendations ──

async function testNoFalsePositives(): Promise<void> {
  const sessionId = await setupBehrouzSession();

  // "add spicy chicken" should trigger add_to_cart, not a spicy recommendation
  const addResponse = await send(sessionId, "add chicken biryani");
  const isOrderAction =
    addResponse.toLowerCase().includes("added") ||
    addResponse.toLowerCase().includes("cart") ||
    addResponse.toLowerCase().includes("₹389");

  record(
    "FP 7A — 'add chicken biryani' does NOT trigger spicy recommendation",
    isOrderAction,
    `response="${addResponse}"`
  );

  // "show menu" should not trigger any recommendation
  const menuResponse = await send(sessionId, "show menu");
  const isMenuResponse = menuResponse.toLowerCase().includes("menu");

  record(
    "FP 7B — 'show menu' does NOT trigger recommendation",
    isMenuResponse,
    `response="${menuResponse}"`
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("FeastPilot Recommendation Integration Tests\n");

  await testSpicyRecommendation();
  await testVegetarianRecommendation();
  await testDessertRecommendation();
  await testPairingRecommendation();
  await testBudgetRecommendation();
  await testValueRecommendation();
  await testNoFalsePositives();

  const passed = outcomes.filter((o) => o.passed).length;
  const failed = outcomes.filter((o) => !o.passed).length;

  console.log("\n── Summary ──");
  console.log(`Total Tests: ${outcomes.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Recommendation test runner crashed:", error);
  process.exitCode = 1;
});
