import { NativeModule, requireNativeModule } from "expo";

import type {
	NativeTextGenerationOptions,
	NativeTextGenerationResult,
} from "./AppleFoundationModels.types";

declare class AppleFoundationModelsModule extends NativeModule {
	isTextModelAvailable(): Promise<boolean>;
	generateText(
		options: NativeTextGenerationOptions,
	): Promise<NativeTextGenerationResult>;
}

export default requireNativeModule<AppleFoundationModelsModule>(
	"AppleFoundationModels",
);
