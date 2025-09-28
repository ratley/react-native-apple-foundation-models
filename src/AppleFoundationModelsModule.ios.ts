import { NativeModule, requireNativeModule } from "expo";

import type {
	NativeObjectGenerationOptions,
	NativeObjectGenerationResult,
	NativeTextGenerationOptions,
	NativeTextGenerationResult,
	TextModelAvailability,
} from "./AppleFoundationModels.types";

declare class AppleFoundationModelsModule extends NativeModule {
	isTextModelAvailable(): Promise<boolean>;
	getTextModelAvailability(): Promise<TextModelAvailability>;
	generateText(
		options: NativeTextGenerationOptions,
	): Promise<NativeTextGenerationResult>;
	generateObject(
		options: NativeObjectGenerationOptions,
	): Promise<NativeObjectGenerationResult>;
}

export default requireNativeModule<AppleFoundationModelsModule>(
	"AppleFoundationModels",
);
