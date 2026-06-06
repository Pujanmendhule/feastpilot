import type { ModelProviderType } from "../../../config/model.config";
import { NotImplementedProvider } from "./NotImplementedProvider";

/** Skeleton for NVIDIA NIM / NGC model endpoints. */
export class NvidiaProvider extends NotImplementedProvider {
  readonly name: ModelProviderType = "nvidia";
}
