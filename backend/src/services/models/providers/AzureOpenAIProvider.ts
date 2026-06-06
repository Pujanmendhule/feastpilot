import type { ModelProviderType } from "../../../config/model.config";
import { NotImplementedProvider } from "./NotImplementedProvider";

/** Skeleton for Azure OpenAI Service deployments. */
export class AzureOpenAIProvider extends NotImplementedProvider {
  readonly name: ModelProviderType = "azure-openai";
}
