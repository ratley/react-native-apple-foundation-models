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

export type AppleFoundationModelsViewProps = {
	url: string;
	onLoad: (event: { nativeEvent: { url: string } }) => void;
	style?: StyleProp<ViewStyle>;
};
