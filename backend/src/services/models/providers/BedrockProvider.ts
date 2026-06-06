import type { ModelProviderType } from "../../../config/model.config";
import { NotImplementedProvider } from "./NotImplementedProvider";

/** Skeleton for AWS Bedrock foundation models. */
export class BedrockProvider extends NotImplementedProvider {
  readonly name: ModelProviderType = "bedrock";
}
