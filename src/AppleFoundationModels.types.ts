import type { StyleProp, ViewStyle } from "react-native";

/**
 * Options for a single text generation request.
 * - Provide a concise `prompt`. Keep it focused for best latency/quality on-device.
 * - Optional `instructions` act like a system prompt for the session.
 * - `temperature` should be conservative (e.g. 0.2–0.7) for deterministic outputs.
 * - `maxOutputTokens` bounds the response length.
 * - `sessionId` lets you continue a prior session; leave empty to auto-create.
 */
export type TextGenerationOptions = {
	prompt: string;
	instructions?: string;
	temperature?: number;
	maxOutputTokens?: number;
	sessionId?: string;
};

/** Result of a text generation call. */
export type TextGenerationResult = {
	text: string;
	sessionId: string;
};

// Keep the native-facing shape with 'system' to match the iOS bridge
export type NativeTextGenerationOptions = Omit<
	TextGenerationOptions,
	"instructions"
> & {
	system?: string;
};

export type NativeTextGenerationResult = TextGenerationResult;

/**
 * Normalized error codes for text generation failures.
 */
export type TextGenerationErrorCode =
	| "ERR_TEXT_GENERATION_UNSUPPORTED"
	| "ERR_TEXT_PROMPT_INVALID"
	| "ERR_TEXT_GENERATION_INVALID_ARGUMENT"
	| "ERR_TEXT_GENERATION_CANCELED"
	| "ERR_TEXT_GENERATION_TIMEOUT"
	| "ERR_TEXT_GENERATION_RUNTIME"
	| "ERR_TEXT_GENERATION_MODEL_UNAVAILABLE"
	| "ERR_TEXT_MODEL_DEVICE_NOT_ELIGIBLE"
	| "ERR_TEXT_MODEL_NOT_ENABLED"
	| "ERR_TEXT_MODEL_NOT_READY"
	| "ERR_TEXT_MODEL_UNKNOWN";

// Minimal JSON schema (subset) for generateObject
export type JSONSchema =
	| { type: "string"; minLength?: number; maxLength?: number; enum?: string[] }
	| { type: "number"; minimum?: number; maximum?: number }
	| { type: "boolean" }
	| { type: "array"; items: JSONSchema; minItems?: number; maxItems?: number }
	| {
			type: "object";
			properties: Record<string, JSONSchema>;
			required?: string[];
	  };

export type ObjectGenerationOptions<S extends JSONSchema = JSONSchema> = {
	prompt: string;
	instructions?: string;
	schema: S;
	sessionId?: string;
};

export type ObjectGenerationResult<T = unknown> = {
	object: T;
	sessionId: string;
};

export type ObjectGenerationErrorCode =
	| "ERR_OBJECT_GENERATION_UNSUPPORTED"
	| "ERR_OBJECT_PROMPT_INVALID"
	| "ERR_OBJECT_SCHEMA_INVALID"
	| "ERR_OBJECT_GENERATION_DECODE_FAILED"
	| "ERR_OBJECT_GENERATION_RUNTIME";

// Native-facing options/results for iOS bridge (schema as string for simplicity)
export type NativeObjectGenerationOptions = {
	prompt: string;
	system?: string; // mirrors native terminology
	schema: string; // stringified JSON schema
	sessionId?: string;
	temperature?: number;
	maxOutputTokens?: number;
};

export type NativeObjectGenerationResult = {
	json: string;
	sessionId: string;
};

export type AppleFoundationModelsViewProps = {
	url: string;
	onLoad: (event: { nativeEvent: { url: string } }) => void;
	style?: StyleProp<ViewStyle>;
};

/**
 * Availability of the on-device language model.
 */
export type TextModelAvailability =
	| {
			/**
			 * Model is available and ready to use.
			 */
			status: "available";
	  }
	| {
			/**
			 * Model is not available. See `reasonCode` for the specific cause.
			 */
			status: "unavailable";
			/**
			 * Specific unavailability reason, mirroring SystemLanguageModel.availability:
			 * - `deviceNotEligible`: Hardware doesn't support Apple Intelligence.
			 * - `appleIntelligenceNotEnabled`: Apple Intelligence is turned off in Settings.
			 * - `modelNotReady`: Model is downloading or otherwise not ready yet.
			 * - `unknown`: Unrecognized reason reported by the system.
			 * - `unsupported`: Platform/OS doesn't support the on-device model.
			 */
			reasonCode:
				| "deviceNotEligible"
				| "appleIntelligenceNotEnabled"
				| "modelNotReady"
				| "unknown"
				| "unsupported";
	  };

// (Doc block moved above the first definitions to avoid duplicate declarations)
