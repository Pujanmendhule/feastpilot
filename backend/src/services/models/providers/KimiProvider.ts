import type { ModelProviderType } from "../../../config/model.config";
import { NotImplementedProvider } from "./NotImplementedProvider";
import type { ModelProviderEnvConfig } from "../../../config/model.config";

/** Skeleton for Moonshot Kimi API. */
export class KimiProvider extends NotImplementedProvider {
  readonly name: ModelProviderType = "kimi";

  constructor(_config?: Pick<ModelProviderEnvConfig, "apiKey" | "baseUrl" | "modelId">) {
    super();
  }
}
