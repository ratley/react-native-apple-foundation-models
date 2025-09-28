import type {
	NativeTextGenerationOptions,
	NativeTextGenerationResult,
} from "./AppleFoundationModels.types";
import AppleFoundationModelsModule from "./AppleFoundationModelsModule";
import { toTextGenerationError } from "./errors";

export type CreateLLMSessionOptions = {
	instructions?: string;
	sessionId?: string;
};

export type AskParams = {
	prompt: string;
	temperature?: number;
	maxOutputTokens?: number;
};

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

	static async create(
		options: CreateLLMSessionOptions = {},
	): Promise<LLMSession> {
		// No native call yet; the underlying session will be created lazily on first ask.
		return new LLMSession(options);
	}

	get sessionId(): string | undefined {
		return this._sessionId;
	}

	get instructions(): string | undefined {
		return this._instructions;
	}

	reset({ instructions }: { instructions?: string } = {}): void {
		// Defer native session refresh until next ask(); pass same id with new system
		// so the native store rebuilds while keeping the id stable.
		const value = instructions?.trim();
		this._instructions = value || undefined;
	}

	destroy(): void {
		this._sessionId = undefined;
		this._instructions = undefined;
	}

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
