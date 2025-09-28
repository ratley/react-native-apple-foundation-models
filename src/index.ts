import type {
	TextGenerationOptions,
	TextGenerationResult,
} from "./AppleFoundationModels.types";
import AppleFoundationModelsModule from "./AppleFoundationModelsModule";
import { toTextGenerationError } from "./errors";

export * from "./AppleFoundationModels.types";
export { default as AppleFoundationModelsView } from "./AppleFoundationModelsView";
export {
	isTextGenerationError,
	TextGenerationError,
	toTextGenerationError,
} from "./errors";

export async function isTextModelAvailable(): Promise<boolean> {
	return AppleFoundationModelsModule.isTextModelAvailable();
}

export async function generateText(
	options: TextGenerationOptions,
): Promise<TextGenerationResult> {
	const prompt = options.prompt?.trim();

	if (!prompt) {
		throw new Error("Prompt must be a non-empty string.");
	}

	const { instructions, temperature, maxOutputTokens, sessionId } = options;

	try {
		return await AppleFoundationModelsModule.generateText({
			prompt,
			system: instructions?.trim(),
			temperature,
			maxOutputTokens,
			sessionId,
		});
	} catch (error) {
		throw toTextGenerationError(error);
	}
}

export default AppleFoundationModelsModule;

export { LLMSession } from "./LLMSession";
export { useLLMSession } from "./useLLMSession";
