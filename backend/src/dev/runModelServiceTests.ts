/**
 * ModelService architecture verification tests.
 *
 * Run: npx ts-node src/dev/runModelServiceTests.ts
 */

import type { ModelProviderType } from "../config/model.config";
import { SUPPORTED_MODEL_PROVIDERS } from "../config/model.config";
import {
  createProvider,
  getProvider,
  resetProviderCache,
} from "../services/models/ProviderFactory";
import { MockProvider } from "../services/models/providers/MockProvider";
import { NvidiaProvider } from "../services/models/providers/NvidiaProvider";
import { ModelService } from "../services/models/ModelService";

interface TestOutcome {
  name: string;
  passed: boolean;
  reason?: string;
}

const outcomes: TestOutcome[] = [];

function record(name: string, passed: boolean, reason?: string): void {
  outcomes.push({ name, passed, reason });
  console.log(passed ? `[PASS] ${name}` : `[FAIL] ${name}`);
  if (!passed && reason) {
    console.log(`       ${reason}`);
  }
}

async function assertThrowsNotImplemented(
  label: string,
  fn: () => Promise<unknown>
): Promise<void> {
  try {
    await fn();
    record(label, false, "Expected Error('Not implemented') but call succeeded");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    record(label, message === "Not implemented", `Got: "${message}"`);
  }
}

async function runProviderFactoryTests(): Promise<void> {
  for (const providerType of SUPPORTED_MODEL_PROVIDERS) {
    const provider = createProvider(providerType);
    record(
      `ProviderFactory creates "${providerType}"`,
      provider.name === providerType,
      `Expected name=${providerType}, got=${provider.name}`
    );
  }

  const previous = process.env.MODEL_PROVIDER;
  process.env.MODEL_PROVIDER = "mock";
  resetProviderCache();

  const singleton = getProvider();
  record(
    "ProviderFactory getProvider() returns mock by default",
    singleton.name === "mock"
  );

  if (previous === undefined) {
    delete process.env.MODEL_PROVIDER;
  } else {
    process.env.MODEL_PROVIDER = previous;
  }
  resetProviderCache();
}

async function runMockProviderTests(): Promise<void> {
  const mock = new MockProvider();

  const menuIntent = await mock.classifyIntent("show menu");
  record(
    'MockProvider classifyIntent "show menu"',
    menuIntent.intent === "show_menu",
    `intent=${menuIntent.intent}`
  );

  const addIntent = await mock.classifyIntent("add chicken biryani");
  const addEntities = await mock.extractEntities(
    "add chicken biryani",
    addIntent.intent
  );
  record(
    'MockProvider "add chicken biryani" intent',
    addIntent.intent === "add_to_cart",
    `intent=${addIntent.intent}`
  );
  record(
    'MockProvider "add chicken biryani" entities',
    addEntities.item === "chicken biryani" && addEntities.quantity === 1,
    `item=${addEntities.item}, quantity=${addEntities.quantity}`
  );

  const removeIntent = await mock.classifyIntent("remove gulab jamun");
  const removeEntities = await mock.extractEntities(
    "remove gulab jamun",
    removeIntent.intent
  );
  record(
    'MockProvider "remove gulab jamun" intent',
    removeIntent.intent === "remove_item",
    `intent=${removeIntent.intent}`
  );
  record(
    'MockProvider "remove gulab jamun" entities',
    removeEntities.item === "gulab jamun",
    `item=${removeEntities.item}`
  );

  const addResponse = await mock.generateResponse({
    intent: "add_to_cart",
    entities: addEntities,
    userMessage: "add chicken biryani",
  });
  record(
    "MockProvider generateResponse for add_to_cart",
    addResponse.provider === "mock" &&
      addResponse.response.includes("chicken biryani"),
    `response="${addResponse.response}"`
  );
}

async function runModelServiceTests(): Promise<void> {
  const service = new ModelService(new MockProvider());

  const intent = await service.classifyIntent("show cart");
  record(
    "ModelService classifyIntent delegates to provider",
    intent.intent === "view_cart",
    `intent=${intent.intent}`
  );

  const entities = await service.extractEntities("I want biryani");
  record(
    "ModelService extractEntities delegates to provider",
    entities.searchQuery === "biryani",
    `searchQuery=${entities.searchQuery}`
  );

  const response = await service.generateResponse({
    intent: "show_menu",
    userMessage: "show menu",
  });
  record(
    "ModelService generateResponse delegates to provider",
    response.provider === "mock" && response.response.length > 0,
    `response="${response.response}"`
  );

  record(
    "ModelService getProviderType",
    service.getProviderType() === "mock"
  );
}

async function runSkeletonProviderTests(): Promise<void> {
  const skeletons: Array<{ name: string; provider: ModelProviderType }> = [
    { name: "NvidiaProvider", provider: "nvidia" },
    { name: "OpenAIProvider", provider: "openai" },
    { name: "GeminiProvider", provider: "gemini" },
    { name: "BedrockProvider", provider: "bedrock" },
    { name: "KimiProvider", provider: "kimi" },
  ];

  for (const { name, provider: type } of skeletons) {
    const provider = createProvider(type);
    await assertThrowsNotImplemented(
      `${name} classifyIntent throws Not implemented`,
      () => provider.classifyIntent("test")
    );
  }

  const nvidia = new NvidiaProvider();
  record("NvidiaProvider name", nvidia.name === "nvidia");
}

async function main(): Promise<void> {
  console.log("ModelService Architecture Tests\n");

  await runProviderFactoryTests();
  await runMockProviderTests();
  await runModelServiceTests();
  await runSkeletonProviderTests();

  const passed = outcomes.filter((o) => o.passed).length;
  const failed = outcomes.filter((o) => !o.passed).length;

  console.log("\n── Summary ──");
  console.log(`Total: ${outcomes.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("ModelService test runner crashed:", error);
  process.exitCode = 1;
});
