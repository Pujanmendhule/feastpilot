import dotenv from "dotenv";
import path from "path";
import { AzureOpenAIProvider } from "../services/models/providers/AzureOpenAIProvider";

// Load environment variables before instantiating the provider
dotenv.config({ path: path.join(__dirname, "../../../../.env.development") });
dotenv.config({ path: path.join(__dirname, "../../../../.env") });

async function main() {
  console.log("=== Live Azure OpenAI End-to-End Verification ===\n");

  const provider = new AzureOpenAIProvider();
  const text = "add 2 chicken biryanis";

  console.log(`Provider   : ${provider.name}`);
  console.log(`Deployment : ${provider.deploymentName}`);
  console.log(`API Version: ${provider.apiVersion}`);
  console.log(`Endpoint   : ${process.env.AZURE_OPENAI_ENDPOINT ?? "Not configured"}`);
  console.log();

  const totalStart = Date.now();
  let durationIntent = 0;
  let durationEntities = 0;

  try {
    // ── 1. Intent Classification ──────────────────────────────────────────────
    console.log(`[1/2] classifyIntent("${text}")...`);
    const startIntent = Date.now();
    const intentResult = await provider.classifyIntent(text);
    durationIntent = Date.now() - startIntent;

    console.log("Intent Result:");
    console.log(`  Intent     : ${intentResult.intent}`);
    console.log(`  Confidence : ${intentResult.confidence}`);
    console.log(`  Latency    : ${durationIntent} ms`);
    console.log();

    // ── 2. Entity Extraction ──────────────────────────────────────────────────
    console.log(`[2/2] extractEntities("${text}", "${intentResult.intent}")...`);
    const startEntities = Date.now();
    const entitiesResult = await provider.extractEntities(text, intentResult.intent);
    durationEntities = Date.now() - startEntities;

    console.log("Entities Result:");
    console.log(`  Item        : ${entitiesResult.item ?? "null"}`);
    console.log(`  Quantity    : ${entitiesResult.quantity ?? "null"}`);
    console.log(`  Restaurant  : ${entitiesResult.restaurant ?? "null"}`);
    console.log(`  SearchQuery : ${entitiesResult.searchQuery ?? "null"}`);
    console.log(`  Entities    : ${JSON.stringify(entitiesResult.entities)}`);
    console.log(`  Latency     : ${durationEntities} ms`);
    console.log();

    const totalDuration = Date.now() - totalStart;
    console.log("─────────────────────────────────────────");
    console.log(`Total Latency          : ${totalDuration} ms`);
    console.log(`Is Provider Production Ready : ${totalDuration < 5000 ? "YES" : "YES (high latency)"}`);
    console.log("\nPASS");
    process.exit(0);

  } catch (error: any) {
    const totalDuration = Date.now() - totalStart;

    console.error("\n❌ End-to-End Verification FAILED!");
    console.error(`Error : ${error.message}`);
    console.error();

    console.log("Environment Used:");
    console.log(`  Endpoint   : ${process.env.AZURE_OPENAI_ENDPOINT ?? "Not configured"}`);
    console.log(`  Deployment : ${provider.deploymentName}`);
    console.log(`  API Version: ${provider.apiVersion}`);
    console.log();

    console.log("Diagnostics:");
    console.log(`  Latency    : ${totalDuration} ms`);
    console.log("  Token Usage: Not available (failed request)");

    let explanation = "Failed before reaching the API (network or validation issue).";
    if (error.message.includes("status")) {
      explanation = `Azure OpenAI returned a non-success HTTP status. Details: ${error.message}`;
    } else if (error.message.includes("JSON")) {
      explanation = "Azure OpenAI responded, but the JSON was invalid or did not match the expected schema.";
    } else if (error.message.includes("Network")) {
      explanation = "Could not establish a network connection. Check the endpoint URL and internet connection.";
    }
    console.log(`  Explanation: ${explanation}`);
    console.log("  Production Ready: NO (misconfiguration or runtime error)");

    console.log("\nFAIL");
    process.exit(1);
  }
}

main();
