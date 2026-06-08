import dotenv from "dotenv";
import path from "path";
import { sessionService } from "../services/SessionService";
import { cartService } from "../services/CartService";
import { prisma } from "../db/prisma";

// Load environment variables before instantiating anything
const backendRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(backendRoot, ".env.development") });
dotenv.config({ path: path.join(backendRoot, ".env") });

const TEST_RESTAURANT = "behrouz_biryani";
const TEST_ITEM = "bb_3";
const TEST_ITEM_NAME = "Chicken Dum Biryani";
const TEST_QTY = 2;

async function run() {
  console.log("Starting Session 2 Persistence and Restart Simulation Verification...\n");

  try {
    // 1. Create session
    const session = await sessionService.createSession();
    const sessionId = session.id;
    console.log(`Created Session: ${sessionId}`);

    // 2. Create cart
    const cart = await cartService.createCart();
    const cartId = cart.id;
    console.log(`Created Cart: ${cartId}`);

    // 3. Attach cart to session
    await sessionService.attachCartToSession(sessionId, cartId);
    console.log("Attached Cart to Session");

    // 4. Add item to cart
    await cartService.addItem(cartId, TEST_RESTAURANT, TEST_ITEM, TEST_QTY);
    console.log(`Added ${TEST_QTY}x ${TEST_ITEM} to Cart`);

    // 5. Save restaurant selection
    await sessionService.setSelectedRestaurant(sessionId, TEST_RESTAURANT);
    console.log(`Selected Restaurant: ${TEST_RESTAURANT}`);

    // 6. Save last referenced item
    await sessionService.setLastReferencedItem(sessionId, TEST_ITEM, TEST_ITEM_NAME);
    console.log(`Set Last Referenced Item: ${TEST_ITEM_NAME} (${TEST_ITEM})`);

    // 7. Verify initial values before restart
    console.log("\nVerifying database state before restart simulation...");
    const sessionBefore = await sessionService.getSession(sessionId);
    const cartBefore = await cartService.getCart(cartId);

    if (!sessionBefore || sessionBefore.cartId !== cartId || sessionBefore.selectedRestaurantId !== TEST_RESTAURANT) {
      throw new Error("Session state mismatch before restart");
    }

    if (!cartBefore || cartBefore.items.length !== 1 || cartBefore.items[0].menuItemId !== TEST_ITEM || cartBefore.items[0].quantity !== TEST_QTY) {
      throw new Error("Cart state mismatch before restart");
    }

    const memoryBefore = await sessionService.getLastReferencedItem(sessionId);
    if (!memoryBefore || memoryBefore.itemId !== TEST_ITEM || memoryBefore.itemName !== TEST_ITEM_NAME) {
      throw new Error("Conversational memory state mismatch before restart");
    }

    console.log("Initial database state verified successfully.");

    // 8. SIMULATE RESTART: Disconnect Prisma, reconnect, and reload entities
    console.log("\nSimulating Server Restart (Disconnecting Prisma Client)...");
    await prisma.$disconnect();
    console.log("Prisma disconnected.");

    // Wait a brief moment
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("Reconnecting Prisma Client...");
    await prisma.$connect();
    console.log("Prisma reconnected.");

    // Reload entities
    console.log("\nReloading entities from database...");
    const reloadedSession = await sessionService.getSession(sessionId);
    const reloadedCart = await cartService.getCart(cartId);
    const reloadedMemory = await sessionService.getLastReferencedItem(sessionId);

    console.log("\n--- Verification Check ---");
    console.log(`* Session exists: ${!!reloadedSession}`);
    console.log(`* Cart ID in Session: ${reloadedSession?.cartId} (Expected: ${cartId})`);
    console.log(`* Selected Restaurant: ${reloadedSession?.selectedRestaurantId} (Expected: ${TEST_RESTAURANT})`);
    console.log(`* Cart exists: ${!!reloadedCart}`);
    console.log(`* Items in Cart: ${reloadedCart?.items.length} (Expected: 1)`);
    console.log(`* Item Quantity: ${reloadedCart?.items[0]?.quantity} (Expected: ${TEST_QTY})`);
    console.log(`* Last Referenced Item ID: ${reloadedMemory?.itemId} (Expected: ${TEST_ITEM})`);
    console.log(`* Last Referenced Item Name: ${reloadedMemory?.itemName} (Expected: ${TEST_ITEM_NAME})`);

    // Verify all criteria are met
    const sessionOk = !!reloadedSession && reloadedSession.cartId === cartId && reloadedSession.selectedRestaurantId === TEST_RESTAURANT;
    const cartOk = !!reloadedCart && reloadedCart.items.length === 1 && reloadedCart.items[0].menuItemId === TEST_ITEM && reloadedCart.items[0].quantity === TEST_QTY;
    const memoryOk = !!reloadedMemory && reloadedMemory.itemId === TEST_ITEM && reloadedMemory.itemName === TEST_ITEM_NAME;

    if (sessionOk && cartOk && memoryOk) {
      console.log("\n===========================");
      console.log("RESULT: PASS");
      console.log("===========================");
      
      // Cleanup verification data
      console.log("\nCleaning up test data...");
      await sessionService.deleteSession(sessionId);
      await prisma.cart.delete({ where: { id: cartId } });
      console.log("Cleanup complete.");
      process.exit(0);
    } else {
      console.log("\n===========================");
      console.log("RESULT: FAIL");
      console.log("===========================");
      process.exit(1);
    }
  } catch (error) {
    console.error("\nVerification failed with error:", error);
    console.log("\n===========================");
    console.log("RESULT: FAIL");
    console.log("===========================");
    process.exit(1);
  }
}

run();
