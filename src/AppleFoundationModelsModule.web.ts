import { NativeModule, registerWebModule } from "expo";

import type {
	NativeTextGenerationOptions,
	NativeTextGenerationResult,
} from "./AppleFoundationModels.types";

class AppleFoundationModelsModule extends NativeModule {
	async isTextModelAvailable(): Promise<boolean> {
		return false;
	}

	async generateText(
		_options: NativeTextGenerationOptions,
	): Promise<NativeTextGenerationResult> {
		throw new Error("Text generation is not supported in web environments.");
	}
}

export default registerWebModule(
	AppleFoundationModelsModule,
	"AppleFoundationModels",
);
