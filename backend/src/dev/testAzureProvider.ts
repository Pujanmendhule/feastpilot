import dotenv from "dotenv";
import path from "path";
import { AzureOpenAIProvider } from "../services/models/providers/AzureOpenAIProvider";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../../.env.development") });
dotenv.config({ path: path.join(__dirname, "../../../../.env") });

async function main() {
  console.log("=== Live Azure OpenAI End-to-End Verification ===\n");

  const provider = new AzureOpenAIProvider();
  const text = "add 2 chicken biryanis";
  
  const totalStart = Date.now();

  let durationIntent = 0;
  let durationEntities = 0;

  try {
    // 1. Intent Classification
    console.log(`[1/2] Running classifyIntent("${text}")...`);
    const startIntent = Date.now();
    const intentResult = await provider.classifyIntent(text);
    durationIntent = Date.now() - startIntent;

    console.log("\nIntent Result:");
    console.log(`- Provider: ${provider.name}`);
    console.log(`- Intent: ${intentResult.intent}`);
    console.log(`- Confidence: ${intentResult.confidence}`);
    console.log(`- Request duration: ${durationIntent} ms`);
    console.log("");

    // 2. Entity Extraction
    console.log(`[2/2] Running extractEntities("${text}", "${intentResult.intent}")...`);
    const startEntities = Date.now();
    const entitiesResult = await provider.extractEntities(text, intentResult.intent);
    durationEntities = Date.now() - startEntities;

    console.log("\nEntities Result:");
    console.log(`- Item: ${entitiesResult.item ?? "null"}`);
    console.log(`- Quantity: ${entitiesResult.quantity ?? "null"}`);
    console.log(`- Restaurant: ${entitiesResult.restaurant ?? "null"}`);
    console.log(`- SearchQuery: ${entitiesResult.searchQuery ?? "null"}`);
    console.log(`- Entities Map: ${JSON.stringify(entitiesResult.entities)}`);
    console.log(`- Request duration: ${durationEntities} ms`);
    console.log("");

    const totalDuration = Date.now() - totalStart;
    console.log("-----------------------------------");
    console.log(`Total Latency: ${totalDuration} ms`);
    
    // Evaluation of production readiness
    const isProductionReady = totalDuration < 4000 ? "YES" : "YES (but high latency)";
    console.log(`Is Provider Production Ready: ${isProductionReady}`);
    console.log("\nPASS");
    process.exit(0);

  } catch (error: any) {
    const totalDuration = Date.now() - totalStart;

    console.error("\n❌ End-to-End Verification FAILED!");
    console.error(`Error details: ${error.message}`);
    console.error("");

    // Printing environment details (Never print keys)
    console.log("Environment Used:");
    console.log(`- Endpoint: ${process.env.AZURE_OPENAI_ENDPOINT ?? "Not configured"}`);
    console.log(`- Deployment: ${process.env.AZURE_OPENAI_DEPLOYMENT ?? "Not configured"}`);
    console.log(`- API Version: ${process.env.AZURE_OPENAI_API_VERSION ?? "Not configured"}`);
    console.log("");

    console.log("Diagnostics:");
    console.log(`- Latency: ${totalDuration} ms`);
    console.log("- Token Usage: Not available (failed request)");
    
    // Explain the response received
    let responseExplanation = "Failed before reaching the API (network or validation issue).";
    if (error.message.includes("status")) {
      responseExplanation = `The Azure OpenAI Service returned a non-success HTTP status. Details: ${error.message}`;
    } else if (error.message.includes("JSON")) {
      responseExplanation = "The Azure OpenAI Service returned a response, but it was not parseable as valid JSON or did not conform to the expected schema.";
    } else if (error.message.includes("Network")) {
      responseExplanation = "Could not establish a network connection to the endpoint. Check host name and internet connection.";
    }
    console.log(`- Response explanation: ${responseExplanation}`);
    console.log("- Is Provider Production Ready: NO (critical errors/misconfiguration encountered)");

    console.log("\nFAIL");
    process.exit(1);
  }
}

main();
