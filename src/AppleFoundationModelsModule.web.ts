import { NativeModule, registerWebModule } from "expo";

import type {
	NativeTextGenerationOptions,
	NativeTextGenerationResult,
	TextModelAvailability,
} from "./AppleFoundationModels.types";

class AppleFoundationModelsModule extends NativeModule {
	async isTextModelAvailable(): Promise<boolean> {
		return false;
	}

	async getTextModelAvailability(): Promise<TextModelAvailability> {
		return {
			status: "unavailable",
			reasonCode: "unsupported",
		};
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
