import type { StyleProp, ViewStyle } from "react-native";

export type TextGenerationOptions = {
	prompt: string;
	instructions?: string;
	temperature?: number;
	maxOutputTokens?: number;
	sessionId?: string;
};

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

export type TextGenerationErrorCode =
	| "ERR_TEXT_GENERATION_UNSUPPORTED"
	| "ERR_TEXT_PROMPT_INVALID"
	| "ERR_TEXT_GENERATION_INVALID_ARGUMENT"
	| "ERR_TEXT_GENERATION_CANCELED"
	| "ERR_TEXT_GENERATION_TIMEOUT"
	| "ERR_TEXT_GENERATION_RUNTIME"
	| "ERR_TEXT_GENERATION_MODEL_UNAVAILABLE";

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
