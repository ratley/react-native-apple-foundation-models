import type { TextGenerationErrorCode } from "./AppleFoundationModels.types";

const TEXT_GENERATION_ERROR_CODES: ReadonlySet<TextGenerationErrorCode> =
	new Set([
		"ERR_TEXT_GENERATION_UNSUPPORTED",
		"ERR_TEXT_PROMPT_INVALID",
		"ERR_TEXT_GENERATION_INVALID_ARGUMENT",
		"ERR_TEXT_GENERATION_CANCELED",
		"ERR_TEXT_GENERATION_TIMEOUT",
		"ERR_TEXT_GENERATION_RUNTIME",
		"ERR_TEXT_GENERATION_MODEL_UNAVAILABLE",
	]);

type NativeErrorLike = {
	code?: string;
	message?: string;
	cause?: unknown;
	nativeCode?: number;
	nativeDomain?: string;
};

export class TextGenerationError extends Error {
	readonly code: TextGenerationErrorCode;
	readonly nativeCode?: number;
	readonly nativeDomain?: string;
	override readonly cause?: unknown;

	constructor({
		code,
		message,
		cause,
		nativeCode,
		nativeDomain,
	}: {
		code: TextGenerationErrorCode;
		message: string;
		cause?: unknown;
		nativeCode?: number;
		nativeDomain?: string;
	}) {
		super(message);
		this.name = "TextGenerationError";
		this.code = code;
		this.cause = cause;
		this.nativeCode = nativeCode;
		this.nativeDomain = nativeDomain;
	}
}

function isNativeErrorLike(error: unknown): error is NativeErrorLike {
	if (typeof error !== "object" || error == null) {
		return false;
	}
	const candidate = error as Record<string, unknown>;
	return (
		typeof candidate.code === "string" && typeof candidate.message === "string"
	);
}

export function toTextGenerationError(error: unknown): TextGenerationError {
	if (error instanceof TextGenerationError) {
		return error;
	}

	if (
		isNativeErrorLike(error) &&
		TEXT_GENERATION_ERROR_CODES.has(error.code as TextGenerationErrorCode)
	) {
		return new TextGenerationError({
			code: error.code as TextGenerationErrorCode,
			message: String(error.message ?? "Text generation failed."),
			cause: error.cause,
			nativeCode:
				typeof error.nativeCode === "number" ? error.nativeCode : undefined,
			nativeDomain:
				typeof error.nativeDomain === "string" ? error.nativeDomain : undefined,
		});
	}

	return new TextGenerationError({
		code: "ERR_TEXT_GENERATION_RUNTIME",
		message:
			(isNativeErrorLike(error) && error.message) ||
			(error instanceof Error ? error.message : "Text generation failed."),
		cause: error instanceof Error ? error : undefined,
	});
}

export function isTextGenerationError(
	error: unknown,
): error is TextGenerationError {
	return error instanceof TextGenerationError;
}
