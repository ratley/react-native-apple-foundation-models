import { useCallback, useEffect, useRef, useState } from "react";
import { toTextGenerationError } from "./errors";
import { isTextModelAvailable } from "./index";
import { LLMSession } from "./LLMSession";

/**
 * Parameters for the `useLLMSession` React hook.
 *
 * - `instructions`: Optional system prompt to steer generations.
 * - `initialId`: Provide to resume an existing session by id.
 * - `autoCreate`: Lazily create a session on mount if supported. Defaults to `true`.
 */
export type UseLLMSessionParams = {
	instructions?: string;
	initialId?: string;
	autoCreate?: boolean;
};

/**
 * Return shape for the `useLLMSession` React hook.
 */
export type UseLLMSessionReturn = {
	/**
	 * Current session identifier, if available.
	 */
	sessionId?: string;
	/**
	 * Whether the platform supports local text generation.
	 */
	isAvailable: boolean;
	/**
	 * Lifecycle status of the hook: `idle`, `running`, `error`, or `unsupported`.
	 */
	status: "idle" | "running" | "error" | "unsupported";
	/**
	 * Normalized error, when present.
	 */
	error?: { code: string; message: string };
	/**
	 * In-memory chat history for the current session.
	 */
	history: Array<{ role: "user" | "assistant"; content: string }>;
	/**
	 * Send a prompt to the model and append the response to `history`.
	 *
	 * @param prompt User message to generate from.
	 * @param options Optional generation controls.
	 * @returns The generated text.
	 * @throws Normalized error if unsupported or native call fails.
	 * @see https://developer.apple.com/documentation/foundationmodels/languagemodelsession
	 */
	ask: (
		prompt: string,
		options?: { temperature?: number; maxOutputTokens?: number },
	) => Promise<string>;
	/**
	 * Re-run the last prompt, if any, and append the new response.
	 */
	regenerate: () => Promise<string>;
	/**
	 * Update the system instructions for subsequent generations.
	 */
	setInstructions: (value?: string) => void;
	/**
	 * Reset session state and optionally apply new instructions.
	 */
	reset: (value?: { instructions?: string }) => void;
	/**
	 * Forget the current session and clear history. A new session will be
	 * created lazily on the next call to `ask()` if supported.
	 */
	destroy: () => void;
};

/**
 * React hook that manages a local language model session, providing
 * availability detection, lifecycle state, in-memory history, and convenient
 * helpers for generation. Conceptually aligned with Apple's
 * `LanguageModelSession`, but adapted for React usage and this module's
 * surface area.
 *
 * The hook performs a support check on mount via `isTextModelAvailable()`. If
 * supported and `autoCreate` is true, a session is created lazily so callers
 * can immediately call `ask()`.
 *
 * @param params Optional configuration for initial instructions, an initial
 * session id, and automatic creation behavior.
 * @returns `UseLLMSessionReturn` with helpers and state.
 * @see https://developer.apple.com/documentation/foundationmodels/languagemodelsession
 */
export function useLLMSession({
	instructions,
	initialId,
	autoCreate = true,
}: UseLLMSessionParams = {}): UseLLMSessionReturn {
	const [isAvailable, setIsAvailable] = useState<boolean>(true);
	const [status, setStatus] = useState<
		"idle" | "running" | "error" | "unsupported"
	>("idle");
	const [error, setError] = useState<
		{ code: string; message: string } | undefined
	>(undefined);
	const [history, setHistory] = useState<
		Array<{ role: "user" | "assistant"; content: string }>
	>([]);

	const sessionRef = useRef<LLMSession | null>(null);
	const lastPromptRef = useRef<string | undefined>(undefined);

	const effectiveInitialId = initialId;

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const available = await isTextModelAvailable();
				if (!mounted) return;
				setIsAvailable(!!available);
				if (!available) {
					setStatus("unsupported");
					return;
				}
				if (autoCreate && !sessionRef.current) {
					sessionRef.current = await LLMSession.create({
						instructions,
						sessionId: effectiveInitialId,
					});
				}
			} catch (_error) {
				if (!mounted) return;
				setIsAvailable(false);
				setStatus("unsupported");
			}
		})();
		return () => {
			mounted = false;
		};
	}, [autoCreate, instructions, effectiveInitialId]);

	const sessionId = sessionRef.current?.sessionId;

	// no persistence

	const ensureSession = useCallback(async () => {
		if (sessionRef.current) return sessionRef.current;
		sessionRef.current = await LLMSession.create({
			instructions,
			sessionId: effectiveInitialId,
		});
		return sessionRef.current;
	}, [instructions, effectiveInitialId]);

	const ask = useCallback<UseLLMSessionReturn["ask"]>(
		async (prompt, options) => {
			if (!isAvailable) {
				throw toTextGenerationError({
					code: "ERR_TEXT_GENERATION_UNSUPPORTED",
					message: "Text generation is not supported.",
				});
			}
			const session = await ensureSession();
			setStatus("running");
			setError(undefined);
			try {
				lastPromptRef.current = prompt;
				setHistory((h) => h.concat([{ role: "user", content: prompt }]));
				const text = await session.ask({
					prompt,
					temperature: options?.temperature,
					maxOutputTokens: options?.maxOutputTokens,
				});
				setHistory((h) => h.concat([{ role: "assistant", content: text }]));
				setStatus("idle");
				return text;
			} catch (e) {
				const err = toTextGenerationError(e);
				setError({ code: err.code, message: err.message });
				setStatus("error");
				throw err;
			}
		},
		[ensureSession, isAvailable],
	);

	const regenerate = useCallback(async () => {
		const last = lastPromptRef.current?.trim();
		if (!last) {
			throw toTextGenerationError({
				code: "ERR_TEXT_PROMPT_INVALID",
				message: "No previous prompt to regenerate.",
			});
		}
		return ask(last);
	}, [ask]);

	const setInstructions = useCallback((value?: string) => {
		if (!sessionRef.current) return;
		sessionRef.current.reset({ instructions: value });
	}, []);

	const reset = useCallback((value?: { instructions?: string }) => {
		if (!sessionRef.current) return;
		sessionRef.current.reset({ instructions: value?.instructions });
		setHistory([]);
	}, []);

	const destroy = useCallback(() => {
		if (!sessionRef.current) return;
		sessionRef.current.destroy();
		sessionRef.current = null;
		setHistory([]);
	}, []);

	return {
		sessionId,
		isAvailable,
		status,
		error,
		history,
		ask,
		regenerate,
		setInstructions,
		reset,
		destroy,
	};
}

export default useLLMSession;
