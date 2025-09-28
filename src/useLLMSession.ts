import { useCallback, useEffect, useRef, useState } from "react";
import { toTextGenerationError } from "./errors";
import { isTextModelAvailable } from "./index";
import { LLMSession } from "./LLMSession";

export type UseLLMSessionParams = {
	instructions?: string;
	initialId?: string;
	autoCreate?: boolean;
};

export type UseLLMSessionReturn = {
	sessionId?: string;
	isAvailable: boolean;
	status: "idle" | "running" | "error" | "unsupported";
	error?: { code: string; message: string };
	history: Array<{ role: "user" | "assistant"; content: string }>;
	ask: (
		prompt: string,
		options?: { temperature?: number; maxOutputTokens?: number },
	) => Promise<string>;
	regenerate: () => Promise<string>;
	setInstructions: (value?: string) => void;
	reset: (value?: { instructions?: string }) => void;
	destroy: () => void;
};

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
