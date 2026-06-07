import type { ModelProviderType } from "../../../config/model.config";
import type {
  EntityExtractionResult,
  IntentResult,
  OrderingIntent,
} from "../types";
import { NotImplementedProvider } from "./NotImplementedProvider";
import dotenv from "dotenv";
import path from "path";

// Load environment variables for local testing and test runners
dotenv.config({ path: path.join(__dirname, "../../../../.env.development") });
dotenv.config({ path: path.join(__dirname, "../../../../.env") });

// ─── Azure Configuration ────────────────────────────────────────────────────
//
// This provider matches the EasyMyDraft / Corvq Azure integration pattern:
//
//   URL: {endpoint}/openai/deployments/{DEPLOYMENT_NAME}/chat/completions?api-version={version}
//
// DEPLOYMENT_NAME is the custom name given when the model was deployed inside
// the Azure OpenAI resource — NOT the model name (e.g. "gpt-4o-mini") and
// NOT the resource name (e.g. "corvq-openai").
//
// The deployment named "corvq-chat" was confirmed working in the Corvq project
// which uses the same Azure resource (corvq-openai.openai.azure.com).
//
// ────────────────────────────────────────────────────────────────────────────

/** Custom deployment name as created in the Azure portal for the chat model. */
const AZURE_DEPLOYMENT_NAME = "corvq-chat";

/** Azure OpenAI REST API version to use. */
const AZURE_API_VERSION = "2024-12-01-preview";

function getAzureConfig() {
  const endpoint = (
    process.env.AZURE_OPENAI_ENDPOINT?.trim() ?? ""
  ).replace(/\/$/, "");

  // Support both AZURE_OPENAI_API_KEY (FeastPilot convention) and
  // AZURE_OPENAI_KEY (EasyMyDraft convention) so either .env works.
  const apiKey =
    process.env.AZURE_OPENAI_API_KEY?.trim() ||
    process.env.AZURE_OPENAI_KEY?.trim() ||
    "";

  if (!endpoint || !apiKey) {
    throw new Error(
      "Missing Azure OpenAI environment variables: " +
        [!endpoint && "AZURE_OPENAI_ENDPOINT", !apiKey && "AZURE_OPENAI_API_KEY"]
          .filter(Boolean)
          .join(", ")
    );
  }

  return { endpoint, apiKey };
}

/**
 * Builds the Azure OpenAI chat completions URL.
 *
 * Azure OpenAI REST API pattern (confirmed from EasyMyDraft / Corvq codebase):
 *   {endpoint}/openai/deployments/{deploymentName}/chat/completions?api-version={version}
 *
 * The "deploymentName" is the name assigned in the Azure portal when the model
 * was deployed — NOT the underlying model name.
 */
function buildUrl(endpoint: string): string {
  return `${endpoint}/openai/deployments/${AZURE_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`;
}

/** Azure OpenAI Service provider — matches the Corvq/EasyMyDraft integration style. */
export class AzureOpenAIProvider extends NotImplementedProvider {
  readonly name: ModelProviderType = "azure-openai";

  /** The Azure deployment name used for all requests. */
  readonly deploymentName: string = AZURE_DEPLOYMENT_NAME;

  /** The API version used for all requests. */
  readonly apiVersion: string = AZURE_API_VERSION;

  async classifyIntent(message: string): Promise<IntentResult> {
    const { endpoint, apiKey } = getAzureConfig();
    const url = buildUrl(endpoint);

    const systemPrompt = `You are a food ordering assistant's intent classifier.
Analyze the user's message and classify their intent into exactly one of these supported intents:
- search_restaurants: User wants to search for restaurants (e.g., "suggest some pizza places", "I want biryani").
- show_menu: User wants to see the menu of the restaurant (e.g., "show menu", "view menu").
- select_restaurant: User is selecting a restaurant by name from search results (e.g., "Behrouz", "select Behrouz Biryani").
- add_to_cart: User wants to add an item to their cart (e.g., "add chicken biryani", "order one chicken biryani").
- add_another: User explicitly wants to add another/one more of an item to the cart (e.g., "add another chicken biryani", "one more pizza please").
- remove_item: User wants to remove an item from the cart (e.g., "remove gulab jamun").
- view_cart: User wants to view/show their cart (e.g., "view cart", "show my cart", "cart").
- set_quantity: User wants to change/set the quantity of an item already in the cart to a specific number (e.g., "change chicken biryani quantity to 3").
- unknown: Any message that does not fit the above categories.

You MUST respond with a JSON object matching this schema:
{
  "intent": "search_restaurants" | "show_menu" | "select_restaurant" | "add_to_cart" | "add_another" | "remove_item" | "view_cart" | "set_quantity" | "unknown",
  "confidence": number (float between 0.0 and 1.0)
}

Do not include any explanation or extra text. Output only valid JSON.`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        }),
      });
    } catch (err: any) {
      throw new Error(`Network failure calling Azure OpenAI: ${err.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Azure OpenAI API returned status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error("Azure OpenAI returned empty response choices.");
    }

    if (data.usage) {
      console.log(
        `[Token Usage] Prompt: ${data.usage.prompt_tokens}, Completion: ${data.usage.completion_tokens}, Total: ${data.usage.total_tokens}`
      );
    }

    const choice = data.choices[0];
    if (choice.finish_reason === "content_filter") {
      throw new Error(
        "Azure OpenAI content filter refused to generate response."
      );
    }

    const content = choice.message?.content?.trim();
    if (!content) {
      throw new Error("Azure OpenAI response content is empty.");
    }

    try {
      const parsed = JSON.parse(content);
      const VALID_INTENTS = new Set([
        "search_restaurants",
        "show_menu",
        "select_restaurant",
        "add_to_cart",
        "add_another",
        "remove_item",
        "view_cart",
        "set_quantity",
        "unknown",
      ]);

      let intent = parsed.intent;
      if (!VALID_INTENTS.has(intent)) {
        intent = "unknown";
      }

      const confidence =
        typeof parsed.confidence === "number" ? parsed.confidence : 1.0;

      return {
        intent: intent as OrderingIntent,
        confidence,
        rawMessage: message,
      };
    } catch (err: any) {
      throw new Error(
        `Azure OpenAI returned invalid JSON: "${content}". Error: ${err.message}`
      );
    }
  }

  async extractEntities(
    message: string,
    intent?: OrderingIntent
  ): Promise<EntityExtractionResult> {
    const { endpoint, apiKey } = getAzureConfig();
    const url = buildUrl(endpoint);

    const systemPrompt = `You are a food ordering assistant's entity extractor.
Given a user message and a classified intent, extract the relevant entities.
The supported entities are:
- item (string or null): The name of the menu item (e.g., "chicken biryani" from "add 2 chicken biryanis"). Normalize to singular if possible. Do not include quantity words.
- quantity (number or null): The quantity of the item (e.g., 2 from "add 2 chicken biryanis"). Defaults to null if not specified.
- restaurant (string or null): The name of the restaurant being selected (e.g., "Behrouz" from "select Behrouz").
- searchQuery (string or null): The search query keywords for searching restaurants (e.g., "biryani" from "I want biryani").

You MUST respond with a JSON object matching this schema:
{
  "item": string | null,
  "quantity": number | null,
  "restaurant": string | null,
  "searchQuery": string | null
}

Examples:
- Message: "add 2 chicken biryanis", Intent: "add_to_cart"
  Output: {"item": "chicken biryani", "quantity": 2, "restaurant": null, "searchQuery": null}
- Message: "remove gulab jamun", Intent: "remove_item"
  Output: {"item": "gulab jamun", "quantity": null, "restaurant": null, "searchQuery": null}
- Message: "I want biryani", Intent: "search_restaurants"
  Output: {"item": null, "quantity": null, "restaurant": null, "searchQuery": "biryani"}
- Message: "change chicken biryani quantity to 3", Intent: "set_quantity"
  Output: {"item": "chicken biryani", "quantity": 3, "restaurant": null, "searchQuery": null}

Do not include any explanation or extra text. Output only valid JSON.`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Message: "${message}"\nIntent: "${intent ?? "unknown"}"`,
            },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        }),
      });
    } catch (err: any) {
      throw new Error(`Network failure calling Azure OpenAI: ${err.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Azure OpenAI API returned status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error("Azure OpenAI returned empty response choices.");
    }

    if (data.usage) {
      console.log(
        `[Token Usage] Prompt: ${data.usage.prompt_tokens}, Completion: ${data.usage.completion_tokens}, Total: ${data.usage.total_tokens}`
      );
    }

    const choice = data.choices[0];
    if (choice.finish_reason === "content_filter") {
      throw new Error(
        "Azure OpenAI content filter refused to generate response."
      );
    }

    const content = choice.message?.content?.trim();
    if (!content) {
      throw new Error("Azure OpenAI response content is empty.");
    }

    try {
      const parsed = JSON.parse(content);
      const entities: Record<string, string | number | boolean | null> = {};

      if (parsed.item !== undefined && parsed.item !== null) entities.item = parsed.item;
      if (parsed.quantity !== undefined && parsed.quantity !== null) entities.quantity = parsed.quantity;
      if (parsed.restaurant !== undefined && parsed.restaurant !== null) entities.restaurant = parsed.restaurant;
      if (parsed.searchQuery !== undefined && parsed.searchQuery !== null) entities.searchQuery = parsed.searchQuery;

      return {
        item: parsed.item ?? undefined,
        quantity: parsed.quantity ?? undefined,
        restaurant: parsed.restaurant ?? undefined,
        searchQuery: parsed.searchQuery ?? undefined,
        entities,
      };
    } catch (err: any) {
      throw new Error(
        `Azure OpenAI returned invalid JSON: "${content}". Error: ${err.message}`
      );
    }
  }
}
