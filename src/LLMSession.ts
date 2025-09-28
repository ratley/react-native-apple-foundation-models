import type {
	NativeTextGenerationOptions,
	NativeTextGenerationResult,
} from "./AppleFoundationModels.types";
import AppleFoundationModelsModule from "./AppleFoundationModelsModule.ios";
import { toTextGenerationError } from "./errors";

/**
 * Lightweight JS wrapper that models Apple's `LanguageModelSession` behavior.
 *
 * Notes:
 * - The underlying native session is created lazily on the first `ask()` call.
 * - A stable `sessionId` is maintained and updated with each response to preserve context.
 * - Use `reset()` to change the system instructions for subsequent generations.
 * - Use `destroy()` to clear any locally tracked session metadata.
 *
 * @see https://developer.apple.com/documentation/foundationmodels/languagemodelsession
 */
export type CreateLLMSessionOptions = {
	instructions?: string;
	sessionId?: string;
};

/**
 * Parameters for a single text generation request.
 *
 * - `prompt`: User message to send to the model.
 * - `temperature`: Higher values increase randomness. If omitted, native default is used.
 * - `maxOutputTokens`: Upper bound on the length of the generated text.
 *
 * @see https://developer.apple.com/documentation/foundationmodels/languagemodelsession
 */
export type AskParams = {
	prompt: string;
	temperature?: number;
	maxOutputTokens?: number;
};

/**
 * Manages lifecycle and parameters of a language model session.
 * Mirrors conceptual flow of Apple's `LanguageModelSession` while providing a
 * minimal JavaScript interface tailored for React Native / web calls.
 */
export class LLMSession {
	private _sessionId: string | undefined;
	private _instructions: string | undefined;

	private constructor({
		instructions,
		sessionId,
	}: CreateLLMSessionOptions = {}) {
		const value = instructions?.trim();
		this._instructions = value || undefined;
		this._sessionId = sessionId?.trim() || undefined;
	}

	/**
	 * Create a new session wrapper.
	 *
	 * The native `LanguageModelSession` is not created here; it is created on the
	 * first `ask()` so that callers can set initial instructions before use.
	 *
	 * @param options Optional session bootstrap options.
	 * @returns A session instance that will lazily initialize the native session.
	 */
	static async create(
		options: CreateLLMSessionOptions = {},
	): Promise<LLMSession> {
		// No native call yet; the underlying session will be created lazily on first ask.
		return new LLMSession(options);
	}

	/**
	 * The current session identifier, if one has been established.
	 * This becomes defined after the first successful `ask()`.
	 */
	get sessionId(): string | undefined {
		return this._sessionId;
	}

	/**
	 * The active system instructions (system prompt) applied to generations.
	 */
	get instructions(): string | undefined {
		return this._instructions;
	}

	/**
	 * Update the system instructions to use on subsequent generations.
	 *
	 * This does not immediately call native code; the new instructions are
	 * applied on the next `ask()` call. The `sessionId` is kept stable if one is
	 * already present.
	 */
	reset({ instructions }: { instructions?: string } = {}): void {
		// Defer native session refresh until next ask(); pass same id with new system
		// so the native store rebuilds while keeping the id stable.
		const value = instructions?.trim();
		this._instructions = value || undefined;
	}

	/**
	 * Clear any locally held session state.
	 *
	 * This does not signal the native side to terminate, but it forgets the
	 * `sessionId` and instructions on the JS side so a subsequent `ask()` will
	 * start fresh.
	 */
	destroy(): void {
		this._sessionId = undefined;
		this._instructions = undefined;
	}

	/**
	 * Generate text from the model using the provided `prompt` and options.
	 *
	 * On success, the underlying native call returns a `sessionId` and text.
	 * This method updates the local `sessionId` to preserve conversational
	 * context across calls, aligning with the concept of Apple's
	 * `LanguageModelSession`.
	 *
	 * Errors are normalized via `toTextGenerationError` and may include:
	 * - `ERR_TEXT_PROMPT_INVALID` when `prompt` is empty
	 * - Transport or platform errors originating from the native layer
	 *
	 * @param params Request parameters including `prompt`, `temperature`, and `maxOutputTokens`.
	 * @returns The generated text.
	 * @throws Normalized error with `code` and `message` fields.
	 * @see https://developer.apple.com/documentation/foundationmodels/languagemodelsession
	 */
	async ask({
		prompt,
		temperature,
		maxOutputTokens,
	}: AskParams): Promise<string> {
		const trimmed = prompt?.trim();
		if (!trimmed) {
			throw toTextGenerationError({
				code: "ERR_TEXT_PROMPT_INVALID",
				message: "Prompt must be a non-empty string.",
			});
		}

		try {
			const options: NativeTextGenerationOptions = {
				prompt: trimmed,
				system: this._instructions,
				temperature,
				maxOutputTokens,
				sessionId: this._sessionId,
			};

			const result: NativeTextGenerationResult =
				await AppleFoundationModelsModule.generateText(options);

			this._sessionId = result.sessionId;
			return result.text;
		} catch (error) {
			throw toTextGenerationError(error);
		}
	}
}
