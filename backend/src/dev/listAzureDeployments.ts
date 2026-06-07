import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env.development") });
dotenv.config({ path: path.join(__dirname, "../../.env") });

const endpoint = (process.env.AZURE_OPENAI_ENDPOINT ?? "").replace(/\/$/, "");
const apiKey = process.env.AZURE_OPENAI_API_KEY ?? "";

/**
 * Try a deployment name supplied via command-line argument.
 * Usage: npx ts-node src/dev/listAzureDeployments.ts <deployment-name>
 */
async function probe(deployment: string): Promise<void> {
  console.log(`\nTesting deployment: "${deployment}"`);
  console.log(`URL: ${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-12-01-preview`);

  const response = await fetch(
    `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-12-01-preview`,
    {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Say: ready" }],
        max_tokens: 5,
      }),
    }
  );

  const data = await response.json();
  if (response.status === 200) {
    console.log(`✅  SUCCESS — deployment "${deployment}" is live!`);
    console.log(`   Response: ${data.choices?.[0]?.message?.content}`);
  } else {
    console.log(`❌  FAILED — HTTP ${response.status}`);
    console.log(`   Code   : ${data?.error?.code}`);
    console.log(`   Message: ${data?.error?.message}`);
  }
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.log("Usage: npx ts-node src/dev/listAzureDeployments.ts <deployment-name>");
    console.log("\nTo find your deployment name:");
    console.log("  1. Go to https://portal.azure.com");
    console.log("  2. Open your Azure OpenAI resource: corvq-openai");
    console.log("  3. Click 'Model deployments' or go to Azure OpenAI Studio → Deployments");
    console.log("  4. Copy the exact 'Deployment name' (not the model name)");
    process.exit(0);
  }
  await probe(arg);
}

main().catch(console.error);
