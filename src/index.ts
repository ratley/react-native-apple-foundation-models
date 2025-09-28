import type {
	JSONSchema,
	ObjectGenerationOptions,
	ObjectGenerationResult,
	TextGenerationOptions,
	TextGenerationResult,
	TextModelAvailability,
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

/**
 * Get precise availability of the on-device language model.
 * - When `status === "available"`, the model is ready to use.
 * - When `status === "unavailable"`, inspect `reasonCode` to choose a fallback UX:
 *   - `deviceNotEligible`: hardware doesn’t support Apple Intelligence.
 *   - `appleIntelligenceNotEnabled`: user has not enabled Apple Intelligence in Settings.
 *   - `modelNotReady`: model is downloading or otherwise not yet ready.
 *   - `unknown`: an unrecognized system-reported reason.
 *   - `unsupported`: platform/OS does not support the on-device model.
 *
 * `reasonMessage` may include a human-readable explanation suitable for display or logging.
 */
export async function getTextModelAvailability(): Promise<TextModelAvailability> {
	try {
		const anyModule = AppleFoundationModelsModule as unknown as {
			getTextModelAvailability?: () => Promise<TextModelAvailability>;
		};
		if (typeof anyModule.getTextModelAvailability === "function") {
			return await anyModule.getTextModelAvailability();
		}
	} catch {}
	// Fallback using boolean
	const ok = await isTextModelAvailable();
	return ok
		? { status: "available" }
		: {
				status: "unavailable",
				reasonCode: "unsupported",
			};
}

/**
 * Generate a single text response. Returns the text and the sessionId used.
 */
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

// Basic schema validator (subset)
function validateJSONSchema(schema: JSONSchema): void {
	const t: string | undefined = (schema as { type: string } | null | undefined)
		?.type;
	const allowed = ["string", "number", "boolean", "array", "object"];
	if (!t || !allowed.includes(t)) {
		throw new Error("ERR_OBJECT_SCHEMA_INVALID");
	}
	if (t === "array") {
		const s = schema as Extract<JSONSchema, { type: "array" }>;
		validateJSONSchema(s.items);
	}
	if (t === "object") {
		const s = schema as Extract<JSONSchema, { type: "object" }>;
		const props = s.properties;
		if (!props || typeof props !== "object") {
			throw new Error("ERR_OBJECT_SCHEMA_INVALID");
		}
		for (const key of Object.keys(props)) {
			validateJSONSchema((props as Record<string, JSONSchema>)[key]);
		}
	}
}

// Minimal runtime validator for the decoded object vs schema
function validateAgainstSchema(value: unknown, schema: JSONSchema): boolean {
	switch (schema.type) {
		case "string":
			if (typeof value !== "string") return false;
			if (schema.minLength != null && value.length < schema.minLength)
				return false;
			if (schema.maxLength != null && value.length > schema.maxLength)
				return false;
			if (schema.enum && !schema.enum.includes(value)) return false;
			return true;
		case "number":
			if (typeof value !== "number" || Number.isNaN(value)) return false;
			if (schema.minimum != null && value < schema.minimum) return false;
			if (schema.maximum != null && value > schema.maximum) return false;
			return true;
		case "boolean":
			return typeof value === "boolean";
		case "array": {
			if (!Array.isArray(value)) return false;
			return value.every((v) => validateAgainstSchema(v, schema.items));
		}
		case "object": {
			if (typeof value !== "object" || value == null || Array.isArray(value))
				return false;
			const obj = value as Record<string, unknown>;
			const required = new Set(schema.required ?? []);
			for (const [k, s] of Object.entries(
				schema.properties as Record<string, JSONSchema>,
			)) {
				const present = Object.hasOwn(obj, k);
				if (!present) {
					if (required.has(k)) return false;
					continue;
				}
				if (!validateAgainstSchema(obj[k], s)) return false;
			}
			return true;
		}
	}
}

// generateObject: prompt model to produce JSON, then parse + validate
/**
 * Generate a structured object matching `schema`.
 * Prefers native guided generation when available, otherwise falls back to
 * prompt-then-parse with runtime validation against the schema.
 */
export async function generateObject<T = unknown>(
	options: ObjectGenerationOptions,
): Promise<ObjectGenerationResult<T>> {
	const prompt = options.prompt?.trim();
	if (!prompt) {
		throw new Error("ERR_OBJECT_PROMPT_INVALID");
	}

	validateJSONSchema(options.schema);

	// Ask the model to respond strictly with JSON conforming to the schema
	const guidance = `
You must return ONLY valid JSON that conforms to this schema. No prose.
If a field is not derivable, return a sensible default or an empty value that fits the schema constraints.
`;

	const base = options.instructions ? options.instructions.trim() : undefined;
	const system = [base, guidance.trim()]
		.filter((v): v is string => typeof v === "string" && v.length > 0)
		.join("\n\n");

	// Prefer native guided generation if available
	const nativeSupported =
		typeof (
			AppleFoundationModelsModule as unknown as { generateObject?: unknown }
		).generateObject === "function";
	if (nativeSupported) {
		try {
			const { json, sessionId } = await (
				AppleFoundationModelsModule as unknown as {
					generateObject: (
						opts: import("./AppleFoundationModels.types").NativeObjectGenerationOptions,
					) => Promise<
						import("./AppleFoundationModels.types").NativeObjectGenerationResult
					>;
				}
			).generateObject({
				prompt,
				system: system || undefined,
				schema: JSON.stringify(options.schema),
				sessionId: options.sessionId,
				temperature: 0.2,
				maxOutputTokens: 512,
			});
			const parsed = JSON.parse(json);
			if (!validateAgainstSchema(parsed, options.schema)) {
				const err = new Error("Model output does not match schema");
				(err as unknown as { code?: string }).code =
					"ERR_OBJECT_GENERATION_DECODE_FAILED";
				throw err;
			}
			return { object: parsed as T, sessionId };
		} catch (error) {
			const e = error as { code?: string } | unknown;
			if (
				typeof e === "object" &&
				e &&
				(e as { code?: string }).code === "ERR_TEXT_GENERATION_UNSUPPORTED"
			) {
				// Fallback to text prompting
			} else {
				throw error;
			}
		}
	}

	const { text, sessionId } = await (async () => {
		try {
			return await generateText({
				prompt,
				instructions: system || undefined,
				sessionId: options.sessionId,
				// keep temperature conservative for structure
				temperature: 0.2,
				maxOutputTokens: 512,
			});
		} catch (error) {
			// Surface text error as object generation runtime
			const e = error as { message?: string } | unknown;
			const message =
				typeof e === "object" &&
				e &&
				"message" in e &&
				typeof (e as { message?: unknown }).message === "string"
					? (e as { message: string }).message
					: "Object generation failed";
			const wrapped = new Error(message);
			(wrapped as unknown as { code?: string }).code =
				"ERR_OBJECT_GENERATION_RUNTIME";
			throw wrapped;
		}
	})();

	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch (_parseError) {
		const err = new Error("Model did not return valid JSON");
		(err as unknown as { code?: string }).code =
			"ERR_OBJECT_GENERATION_DECODE_FAILED";
		throw err;
	}

	if (!validateAgainstSchema(parsed, options.schema)) {
		const err = new Error("Model output does not match schema");
		(err as unknown as { code?: string }).code =
			"ERR_OBJECT_GENERATION_DECODE_FAILED";
		throw err;
	}

	return { object: parsed as T, sessionId };
}
