/**
 * End-to-end integration tests for the FeastPilot conversational ordering workflow.
 *
 * Uses real AgentService, SessionService, CartService, and agent nodes — no mocks.
 * MODEL_PROVIDER is forced to "mock" so tests are deterministic and cost-free
 * regardless of the .env.development setting.
 *
 * Run: npx ts-node src/dev/runIntegrationTests.ts
 */

// Force mock provider before any module that reads MODEL_PROVIDER is imported.
// This must come before all other imports.
process.env.MODEL_PROVIDER = "mock";

import { agentService } from "../services/AgentService";
import { sessionService } from "../services/SessionService";
import { cartService } from "../services/CartService";
import { extractSearchQuery } from "../agent/utils/queryExtractor";

// ── Menu fixture (behrouz_biryani) ─────────────────────────────────────────

const RESTAURANT_ID = "behrouz_biryani";
const CHICKEN_BIRYANI_ID = "bb_3";
const GULAB_JAMUN_ID = "bb_5";
const CHICKEN_BIRYANI_PRICE = 389;
const GULAB_JAMUN_PRICE = 99;

// ── Test harness ─────────────────────────────────────────────────────────────

interface BugReport {
  rootCause: string;
  fileInvolved: string;
  recommendedFix: string;
}

interface TestOutcome {
  name: string;
  passed: boolean;
  reason?: string;
  bugReport?: BugReport;
}

const outcomes: TestOutcome[] = [];

function record(
  name: string,
  passed: boolean,
  reason?: string,
  bugReport?: BugReport
): void {
  outcomes.push({ name, passed, reason, bugReport });
  console.log(passed ? `[PASS] ${name}` : `[FAIL] ${name}`);
  if (!passed && reason) {
    console.log(`       ${reason}`);
  }
}

async function send(sessionId: string, message: string): Promise<string> {
  const result = await agentService.handleMessage(sessionId, message);
  return result.response;
}

function getCart(sessionId: string) {
  const session = sessionService.getSession(sessionId);
  if (!session?.cartId) return undefined;
  return cartService.getCart(session.cartId);
}

function cartItemQuantity(
  cart: NonNullable<ReturnType<typeof getCart>>,
  menuItemId: string
): number {
  const line = cart.items.find(
    (item) =>
      item.restaurantId === RESTAURANT_ID && item.menuItemId === menuItemId
  );
  return line?.quantity ?? 0;
}

function hasCartItem(
  cart: NonNullable<ReturnType<typeof getCart>>,
  menuItemId: string
): boolean {
  return cartItemQuantity(cart, menuItemId) > 0;
}

// ── Main workflow (Tests 1–11, sequential) ──────────────────────────────────

async function runMainWorkflow(): Promise<void> {
  // TEST 1 — Session Lifecycle
  const session = sessionService.createSession();
  const sessionId = session.id;

  const test1Pass =
    sessionService.getSession(sessionId) !== undefined &&
    session.selectedRestaurantId === null &&
    session.cartId === null &&
    session.awaitingRestaurantSelection === false;

  record(
    "TEST 1 — Session Lifecycle",
    test1Pass,
    test1Pass
      ? undefined
      : `session=${!!sessionService.getSession(sessionId)}, restaurant=${session.selectedRestaurantId}, cart=${session.cartId}, awaiting=${session.awaitingRestaurantSelection}`
  );

  // TEST 2 — Restaurant Search
  const searchMessage = "I want biryani";
  const expectedQuery = extractSearchQuery(searchMessage);
  const searchResponse = await send(sessionId, searchMessage);
  const afterSearch = sessionService.getSession(sessionId)!;

  const test2Pass =
    expectedQuery === "biryani" &&
    afterSearch.awaitingRestaurantSelection === true &&
    afterSearch.lastSearchResults.length > 0 &&
    afterSearch.lastSearchResults.some((r) => r.id === RESTAURANT_ID) &&
    searchResponse.toLowerCase().includes("restaurant");

  record(
    "TEST 2 — Restaurant Search",
    test2Pass,
    test2Pass
      ? undefined
      : `query="${expectedQuery}", awaiting=${afterSearch.awaitingRestaurantSelection}, results=${afterSearch.lastSearchResults.length}, response snippet="${searchResponse.slice(0, 80)}"`
  );

  // TEST 3 — Restaurant Selection
  await send(sessionId, "Behrouz");
  const afterSelect = sessionService.getSession(sessionId)!;

  const test3Pass =
    afterSelect.selectedRestaurantId === RESTAURANT_ID &&
    afterSelect.awaitingRestaurantSelection === false;

  record(
    "TEST 3 — Restaurant Selection",
    test3Pass,
    test3Pass
      ? undefined
      : `selectedRestaurantId=${afterSelect.selectedRestaurantId}, awaiting=${afterSelect.awaitingRestaurantSelection}`
  );

  // TEST 4 — Menu Retrieval
  const menuResponse = await send(sessionId, "show menu");
  const afterMenu = sessionService.getSession(sessionId)!;

  const test4Pass =
    afterMenu.lastViewedMenuItems.length > 0 &&
    afterMenu.lastViewedMenuItems.every(
      (item) => item.restaurantId === RESTAURANT_ID
    ) &&
    afterMenu.selectedRestaurantId === RESTAURANT_ID &&
    menuResponse.toLowerCase().includes("menu");

  record(
    "TEST 4 — Menu Retrieval",
    test4Pass,
    test4Pass
      ? undefined
      : `menuItems=${afterMenu.lastViewedMenuItems.length}, restaurant=${afterMenu.selectedRestaurantId}`
  );

  // TEST 5 — Add Item
  let subtotalBefore = 0;
  const addChickenResponse = await send(sessionId, "add chicken biryani");
  const afterAdd1 = sessionService.getSession(sessionId)!;
  const cartAfterAdd1 = getCart(sessionId);

  const test5Pass =
    afterAdd1.cartId !== null &&
    cartAfterAdd1 !== undefined &&
    hasCartItem(cartAfterAdd1, CHICKEN_BIRYANI_ID) &&
    cartAfterAdd1.subtotal === CHICKEN_BIRYANI_PRICE &&
    cartAfterAdd1.subtotal > 0;

  record(
    "TEST 5 — Add Item",
    test5Pass,
    test5Pass
      ? undefined
      : `cartId=${afterAdd1.cartId}, subtotal=${cartAfterAdd1?.subtotal}, response="${addChickenResponse.slice(0, 80)}"`
  );

  subtotalBefore = cartAfterAdd1?.subtotal ?? 0;

  // TEST 6 — Add Second Item
  const addGulabResponse = await send(sessionId, "add gulab jamun");
  const cartAfterAdd2 = getCart(sessionId)!;

  const test6Pass =
    hasCartItem(cartAfterAdd2, GULAB_JAMUN_ID) &&
    cartAfterAdd2.subtotal === CHICKEN_BIRYANI_PRICE + GULAB_JAMUN_PRICE &&
    cartAfterAdd2.subtotal > subtotalBefore;

  record(
    "TEST 6 — Add Second Item",
    test6Pass,
    test6Pass
      ? undefined
      : `subtotal=${cartAfterAdd2.subtotal}, expected=${CHICKEN_BIRYANI_PRICE + GULAB_JAMUN_PRICE}, response="${addGulabResponse.slice(0, 80)}"`
  );

  subtotalBefore = cartAfterAdd2.subtotal;

  // TEST 7 — Increase Quantity
  const addAnotherResponse = await send(sessionId, "add another chicken biryani");
  const cartAfterAdd3 = getCart(sessionId)!;
  const chickenQtyAfter7 = cartItemQuantity(cartAfterAdd3, CHICKEN_BIRYANI_ID);
  const expectedSubtotal7 =
    CHICKEN_BIRYANI_PRICE * 2 + GULAB_JAMUN_PRICE;

  const test7Pass =
    chickenQtyAfter7 === 2 &&
    cartAfterAdd3.subtotal === expectedSubtotal7 &&
    cartAfterAdd3.subtotal > subtotalBefore;

  record(
    "TEST 7 — Increase Quantity",
    test7Pass,
    test7Pass
      ? undefined
      : `chickenQty=${chickenQtyAfter7}, subtotal=${cartAfterAdd3.subtotal}, expected=${expectedSubtotal7}, response="${addAnotherResponse.slice(0, 80)}"`
  );

  // TEST 8 — View Cart
  const viewCartResponse = await send(sessionId, "show cart");

  const test8Pass =
    viewCartResponse.includes("Chicken Dum Biryani") &&
    viewCartResponse.includes("Gulab Jamun") &&
    viewCartResponse.includes("× 2") &&
    viewCartResponse.includes("× 1") &&
    viewCartResponse.includes(`₹${expectedSubtotal7}`);

  record(
    "TEST 8 — View Cart",
    test8Pass,
    test8Pass
      ? undefined
      : `response="${viewCartResponse.replace(/\n/g, " | ")}"`
  );

  // TEST 9 — Update Quantity
  const setQtyResponse = await send(
    sessionId,
    "change chicken biryani quantity to 3"
  );
  const cartAfterSetQty = getCart(sessionId)!;
  const chickenQtyAfter9 = cartItemQuantity(cartAfterSetQty, CHICKEN_BIRYANI_ID);
  const expectedSubtotal9 =
    CHICKEN_BIRYANI_PRICE * 3 + GULAB_JAMUN_PRICE;

  const test9Pass =
    chickenQtyAfter9 === 3 &&
    cartAfterSetQty.subtotal === expectedSubtotal9;

  record(
    "TEST 9 — Update Quantity",
    test9Pass,
    test9Pass
      ? undefined
      : `chickenQty=${chickenQtyAfter9}, subtotal=${cartAfterSetQty.subtotal}, expected=${expectedSubtotal9}, response="${setQtyResponse.slice(0, 80)}"`
  );

  // TEST 10 — Remove Item
  const subtotalBeforeRemove = cartAfterSetQty.subtotal;
  const removeResponse = await send(sessionId, "remove gulab jamun");
  const cartAfterRemove = getCart(sessionId)!;
  const expectedSubtotal10 = CHICKEN_BIRYANI_PRICE * 3;

  const test10Pass =
    !hasCartItem(cartAfterRemove, GULAB_JAMUN_ID) &&
    cartAfterRemove.subtotal === expectedSubtotal10 &&
    cartAfterRemove.subtotal < subtotalBeforeRemove;

  record(
    "TEST 10 — Remove Item",
    test10Pass,
    test10Pass
      ? undefined
      : `subtotal=${cartAfterRemove.subtotal}, expected=${expectedSubtotal10}, gulabPresent=${hasCartItem(cartAfterRemove, GULAB_JAMUN_ID)}, response="${removeResponse.slice(0, 80)}"`
  );

  // TEST 11 — Final Cart Validation
  const finalCartResponse = await send(sessionId, "show cart");
  const finalCart = getCart(sessionId)!;
  const finalChickenQty = cartItemQuantity(finalCart, CHICKEN_BIRYANI_ID);

  const test11Pass =
    finalChickenQty === 3 &&
    !hasCartItem(finalCart, GULAB_JAMUN_ID) &&
    finalCart.subtotal === expectedSubtotal10 &&
    finalCartResponse.includes("Chicken Dum Biryani") &&
    finalCartResponse.includes("× 3") &&
    !finalCartResponse.includes("Gulab Jamun") &&
    finalCartResponse.includes(`₹${expectedSubtotal10}`);

  record(
    "TEST 11 — Final Cart Validation",
    test11Pass,
    test11Pass
      ? undefined
      : `chickenQty=${finalChickenQty}, subtotal=${finalCart.subtotal}, response="${finalCartResponse.replace(/\n/g, " | ")}"`
  );
}

// ── Edge case tests (isolated sessions) ──────────────────────────────────────

async function runEdgeCaseTests(): Promise<void> {
  // Edge 1 — show menu without prior restaurant selection
  {
    const session = sessionService.createSession();
    const response = await send(session.id, "show menu");
    const after = sessionService.getSession(session.id)!;

    const passed =
      after.selectedRestaurantId === null &&
      after.lastViewedMenuItems.length > 0 &&
      after.lastViewedMenuItems.every(
        (item) => item.restaurantId === RESTAURANT_ID
      ) &&
      response.toLowerCase().includes("menu");

    record(
      "Edge 1 — Menu Without Restaurant Selection",
      passed,
      passed
        ? undefined
        : `selected=${after.selectedRestaurantId}, menuItems=${after.lastViewedMenuItems.length}`
    );
  }

  // Edge 2 — remove nonexistent item
  {
    const session = sessionService.createSession();
    await send(session.id, "I want biryani");
    await send(session.id, "Behrouz");
    await send(session.id, "add chicken biryani");

    const response = await send(session.id, "remove california roll");
    const lower = response.toLowerCase();

    const passed =
      lower.includes("could not find") ||
      lower.includes("not in") ||
      lower.includes("not in your cart") ||
      lower.includes("empty");

    record(
      "Edge 2 — Remove Nonexistent Item",
      passed,
      passed ? undefined : `response="${response}"`
    );
  }

  // Edge 3 — invalid restaurant selection
  {
    const session = sessionService.createSession();
    await send(session.id, "I want biryani");
    const response = await send(session.id, "Totally Invalid Restaurant XYZ");
    const after = sessionService.getSession(session.id)!;

    const passed =
      after.awaitingRestaurantSelection === true &&
      after.selectedRestaurantId === null &&
      response.toLowerCase().includes("could not match");

    record(
      "Edge 3 — Invalid Restaurant Selection",
      passed,
      passed
        ? undefined
        : `awaiting=${after.awaitingRestaurantSelection}, selected=${after.selectedRestaurantId}, response="${response.slice(0, 80)}"`
    );
  }

  // Edge 4 — empty cart
  {
    const session = sessionService.createSession();
    const response = await send(session.id, "show cart");
    const lower = response.toLowerCase();

    const passed =
      lower.includes("cart is empty") && session.cartId === null;

    record(
      "Edge 4 — Empty Cart",
      passed,
      passed ? undefined : `response="${response}", cartId=${session.cartId}`
    );
  }
}

// ── Bug reports ──────────────────────────────────────────────────────────────

function printBugReports(): void {
  const failures = outcomes.filter((o) => !o.passed);
  if (failures.length === 0) return;

  console.log("\n── Bug Reports ──\n");

  for (const failure of failures) {
    console.log(`Test: ${failure.name}`);
    console.log(`Root cause: ${failure.bugReport?.rootCause ?? failure.reason ?? "Unknown"}`);
    console.log(`File involved: ${failure.bugReport?.fileInvolved ?? "See failure reason"}`);
    console.log(`Recommended fix: ${failure.bugReport?.recommendedFix ?? "Investigate failing assertion"}`);
    console.log("");
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("FeastPilot Integration Tests\n");

  await runMainWorkflow();
  await runEdgeCaseTests();

  const passed = outcomes.filter((o) => o.passed).length;
  const failed = outcomes.filter((o) => !o.passed).length;

  console.log("\n── Summary ──");
  console.log(`Total Tests: ${outcomes.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  printBugReports();

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Integration test runner crashed:", error);
  process.exitCode = 1;
});
