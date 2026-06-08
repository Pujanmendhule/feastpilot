import dotenv from "dotenv";
import path from "path";
import { agentService } from "../services/AgentService";
import { sessionService } from "../services/SessionService";
import { cartService } from "../services/CartService";

// Load environment variables before instantiating anything
const backendRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(backendRoot, ".env.development") });
dotenv.config({ path: path.join(backendRoot, ".env") });

const CHICKEN_BIRYANI_ID = "bb_3";
const GULAB_JAMUN_ID = "bb_5";
const EXPECTED_RESTAURANT = "behrouz_biryani";

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
      item.restaurantId === EXPECTED_RESTAURANT && item.menuItemId === menuItemId
  );
  return line?.quantity ?? 0;
}

function hasCartItem(
  cart: NonNullable<ReturnType<typeof getCart>>,
  menuItemId: string
): boolean {
  return cartItemQuantity(cart, menuItemId) > 0;
}

function printSessionInspection(sessionId: string): void {
  const session = sessionService.getSession(sessionId);
  if (!session) {
    console.log("Session not found!");
    return;
  }
  console.log("--- Session Inspection ---");
  console.log(`* selectedRestaurantId: ${session.selectedRestaurantId}`);
  console.log(`* lastReferencedMenuItemId: ${session.lastReferencedMenuItemId}`);
  console.log(`* lastReferencedMenuItemName: ${session.lastReferencedMenuItemName}`);
  console.log(`* cartId: ${session.cartId}`);
  console.log("--------------------------");
}

async function send(sessionId: string, message: string): Promise<string> {
  console.log(`> User: ${message}`);
  const result = await agentService.handleMessage(sessionId, message);
  console.log(`Agent: ${result.response}`);
  return result.response;
}

async function runTestA(): Promise<boolean> {
  console.log("\n=== TEST A — Incremental Quantity ===");
  const session = sessionService.createSession();
  const sessionId = session.id;

  await send(sessionId, "add chicken biryani");
  await send(sessionId, "add one more");
  await send(sessionId, "show cart");

  const cart = getCart(sessionId);
  const qty = cart ? cartItemQuantity(cart, CHICKEN_BIRYANI_ID) : 0;
  const passed = qty === 2;

  printSessionInspection(sessionId);
  return passed;
}

async function runTestB(): Promise<boolean> {
  console.log("\n=== TEST B — Absolute Quantity ===");
  const session = sessionService.createSession();
  const sessionId = session.id;

  await send(sessionId, "add chicken biryani");
  await send(sessionId, "make it 3");
  await send(sessionId, "show cart");

  const cart = getCart(sessionId);
  const qty = cart ? cartItemQuantity(cart, CHICKEN_BIRYANI_ID) : 0;
  const passed = qty === 3;

  printSessionInspection(sessionId);
  return passed;
}

async function runTestC(): Promise<boolean> {
  console.log("\n=== TEST C — Remove Reference ===");
  const session = sessionService.createSession();
  const sessionId = session.id;

  await send(sessionId, "add chicken biryani");
  await send(sessionId, "remove it");
  await send(sessionId, "show cart");

  const cart = getCart(sessionId);
  const isEmpty = !cart || cart.items.length === 0;
  const passed = isEmpty;

  printSessionInspection(sessionId);
  return passed;
}

async function runTestD(): Promise<boolean> {
  console.log("\n=== TEST D — Last Referenced Item ===");
  const session = sessionService.createSession();
  const sessionId = session.id;

  await send(sessionId, "add chicken biryani");
  await send(sessionId, "add gulab jamun");
  await send(sessionId, "remove it");
  await send(sessionId, "show cart");

  const cart = getCart(sessionId);
  const hasChicken = cart ? hasCartItem(cart, CHICKEN_BIRYANI_ID) : false;
  const hasGulab = cart ? hasCartItem(cart, GULAB_JAMUN_ID) : false;
  const passed = hasChicken && !hasGulab;

  printSessionInspection(sessionId);
  return passed;
}

async function runTestE(): Promise<boolean> {
  console.log("\n=== TEST E — Full Real Conversation ===");
  const session = sessionService.createSession();
  const sessionId = session.id;

  await send(sessionId, "I want biryani");
  await send(sessionId, "Behrouz");
  await send(sessionId, "show menu");
  await send(sessionId, "add chicken biryani");
  await send(sessionId, "add one more");
  await send(sessionId, "add gulab jamun");
  await send(sessionId, "remove it");
  await send(sessionId, "make it 3");
  await send(sessionId, "show cart");

  const cart = getCart(sessionId);
  const chickenQty = cart ? cartItemQuantity(cart, CHICKEN_BIRYANI_ID) : 0;
  const hasGulab = cart ? hasCartItem(cart, GULAB_JAMUN_ID) : false;
  
  const passed =
    chickenQty === 3 &&
    !hasGulab &&
    session.selectedRestaurantId === EXPECTED_RESTAURANT &&
    session.lastReferencedMenuItemName === "Chicken Dum Biryani";

  printSessionInspection(sessionId);
  return passed;
}

async function runVerification() {
  console.log("Starting Session 1 Production Verification with Azure OpenAI...");
  console.log(`Active Model Provider: ${process.env.MODEL_PROVIDER ?? "mock"}`);

  const results = {
    A: await runTestA(),
    B: await runTestB(),
    C: await runTestC(),
    D: await runTestD(),
    E: await runTestE(),
  };

  console.log("\n=== VERIFICATION RESULTS ===");
  console.log(`TEST A: ${results.A ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`TEST B: ${results.B ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`TEST C: ${results.C ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`TEST D: ${results.D ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`TEST E: ${results.E ? "PASS ✅" : "FAIL ❌"}`);

  const allPassed = Object.values(results).every(v => v);
  if (allPassed) {
    console.log("\nALL TESTS PASSED! 🎉");
    process.exit(0);
  } else {
    console.log("\nSOME TESTS FAILED! ❌");
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
