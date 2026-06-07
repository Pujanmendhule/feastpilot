import { AzureOpenAIProvider } from "../services/models/providers/AzureOpenAIProvider";

async function main() {
  console.log("=== Testing AzureOpenAIProvider ===\n");
  const provider = new AzureOpenAIProvider();

  try {
    const text = "add 2 chicken biryanis";
    
    console.log(`Input: "${text}"`);
    console.log("Calling classifyIntent()...");
    const intentResult = await provider.classifyIntent(text);
    console.log("classifyIntent() Output:", JSON.stringify(intentResult, null, 2));
    console.log("\n-----------------------------------\n");

    console.log(`Input: "${text}", Intent: "add_to_cart"`);
    console.log("Calling extractEntities()...");
    const entitiesResult = await provider.extractEntities(text, "add_to_cart");
    console.log("extractEntities() Output:", JSON.stringify(entitiesResult, null, 2));

  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

main();
