import type { ModelProviderType } from "../../../config/model.config";
import { NotImplementedProvider } from "./NotImplementedProvider";

/** Skeleton for Google Gemini API. */
export class GeminiProvider extends NotImplementedProvider {
  readonly name: ModelProviderType = "gemini";
}
