import type { ModelProviderType } from "../../../config/model.config";
import { NotImplementedProvider } from "./NotImplementedProvider";

/** Skeleton for OpenAI API (chat completions / responses API). */
export class OpenAIProvider extends NotImplementedProvider {
  readonly name: ModelProviderType = "openai";
}
