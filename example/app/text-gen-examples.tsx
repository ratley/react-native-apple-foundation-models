import { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import {
	generateText,
	toTextGenerationError,
} from "react-native-apple-foundation-models";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Example = {
	id: string;
	title: string;
	description: string;
	prompt: string;
	expectedOutput?: string[];
};

const EXAMPLES: Example[] = [
	{
		id: "summarize",
		title: "Summarize",
		description: "Condense long content into a brief summary.",
		prompt:
			"Summarize this in 2 sentences: Apple's new on-device Foundation Models represent a major shift in AI deployment strategy. By processing everything locally on the device, these models eliminate the need to send data to remote servers, ensuring complete privacy and data security. The models are specifically optimized for common tasks like text generation, summarization, and translation, running efficiently on Apple Silicon. This approach not only protects user privacy but also enables instant responses without network latency, making AI features available even offline. The integration with Core ML and other system frameworks allows developers to easily incorporate these capabilities into their applications.",
	},
	{
		id: "tweet",
		title: "Rewrite as a tweet",
		description: "Turn text into a concise tweet.",
		prompt:
			"Rewrite this as a tweet under 220 characters: Learning to use Apple's on-device foundation models for fast, private text generation.",
	},
	{
		id: "bullets",
		title: "Extract key points",
		description: "Identify and list the main takeaways.",
		prompt:
			"Extract 5 key points from this text: Apple's on-device AI models mark a paradigm shift in how artificial intelligence is deployed on consumer devices. Unlike cloud-based solutions that require constant internet connectivity and raise privacy concerns, these models run entirely on the user's device. The models leverage the powerful Neural Engine in Apple Silicon to deliver fast inference speeds while maintaining low power consumption. They support multiple languages and can adapt to user-specific writing styles over time. The framework includes pre-trained models for common tasks but also allows developers to fine-tune models for specialized use cases. Integration with existing iOS and macOS APIs means developers can add AI features without learning entirely new frameworks. Most importantly, since all processing happens locally, user data never leaves the device, providing unprecedented privacy protection in the AI era.",
		expectedOutput: [
			"On-device processing ensures complete privacy - no data sent to servers",
			"Leverages Apple Silicon Neural Engine for fast, efficient performance",
			"Supports multiple languages and adapts to user writing styles",
			"Includes pre-trained models with fine-tuning capabilities for custom use cases",
			"Seamless integration with existing iOS/macOS APIs for easy developer adoption",
		],
	},
];

export default function TextExamples() {
	const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
	const [results, setResults] = useState<
		Record<string, { text?: string; errorCode?: string; errorDetails?: string }>
	>({});
	const [instructions] = useState<string>("");

	// no-op derived state currently

	const runExample = async (ex: Example) => {
		setPendingIds((prev) => new Set(prev).add(ex.id));
		try {
			const res = await generateText({
				prompt: ex.prompt,
				instructions: instructions.trim() || undefined,
			});
			setResults((prev) => ({ ...prev, [ex.id]: { text: res.text } }));
		} catch (error) {
			const normalized = toTextGenerationError(error);
			let errorDetails: string | undefined;
			if (
				normalized.nativeDomain &&
				typeof normalized.nativeCode === "number"
			) {
				errorDetails = `${normalized.nativeDomain} (${normalized.nativeCode})`;
			} else if (normalized.cause instanceof Error) {
				errorDetails = normalized.cause.message;
			}
			setResults((prev) => ({
				...prev,
				[ex.id]: {
					text: normalized.message,
					errorCode: normalized.code,
					errorDetails,
				},
			}));
		} finally {
			setPendingIds((prev) => {
				const next = new Set(prev);
				next.delete(ex.id);
				return next;
			});
		}
	};

	const insets = useSafeAreaInsets();

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: "#ffffff" }}
			contentContainerStyle={{
				padding: 20,
				paddingBottom: insets.bottom + 100,
			}}
		>
			<View
				style={{
					paddingBottom: 24,
					borderBottomWidth: 1,
					borderBottomColor: "#e5e7eb",
					marginBottom: 24,
				}}
			>
				<Text style={{ color: "#000000", fontSize: 22, fontWeight: "600" }}>
					Text generation examples
				</Text>
			</View>

			<View style={{ gap: 16 }}>
				{EXAMPLES.map((ex) => {
					const running = pendingIds.has(ex.id);
					const result = results[ex.id];
					return (
						<View
							key={ex.id}
							style={{
								borderWidth: 1,
								borderColor: "#e5e7eb",
								borderRadius: 8,
								padding: 16,
								gap: 12,
							}}
						>
							<View
								style={{
									paddingBottom: 12,
									borderBottomWidth: 1,
									borderBottomColor: "#f3f4f6",
								}}
							>
								<Text
									style={{
										color: "#000000",
										fontSize: 18,
										fontWeight: "600",
										marginBottom: 4,
									}}
								>
									{ex.title}
								</Text>
								<Text style={{ color: "#6b7280", fontSize: 14 }}>
									{ex.description}
								</Text>
							</View>

							<View style={{ gap: 6 }}>
								<Text
									style={{
										color: "#9ca3af",
										fontSize: 11,
										fontWeight: "600",
										textTransform: "uppercase" as const,
										letterSpacing: 0.5,
									}}
								>
									Prompt
								</Text>
								<Text
									style={{ color: "#374151", fontSize: 14, lineHeight: 20 }}
								>
									{ex.prompt}
								</Text>
							</View>
							{ex.expectedOutput && (
								<View style={{ gap: 6 }}>
									<Text
										style={{
											color: "#9ca3af",
											fontSize: 11,
											fontWeight: "600",
											textTransform: "uppercase" as const,
											letterSpacing: 0.5,
										}}
									>
										Expected Output
									</Text>
									<View style={{ gap: 4 }}>
										{ex.expectedOutput.map((point) => (
											<View
												key={point}
												style={{ flexDirection: "row", gap: 6 }}
											>
												<Text style={{ color: "#9ca3af", fontSize: 14 }}>
													•
												</Text>
												<Text
													style={{
														color: "#6b7280",
														fontSize: 14,
														lineHeight: 20,
														flex: 1,
													}}
												>
													{point}
												</Text>
											</View>
										))}
									</View>
								</View>
							)}
							<View
								style={{ flexDirection: "row" as const, gap: 8, marginTop: 4 }}
							>
								<Pressable
									style={({ pressed }) => ({
										backgroundColor: "#000000",
										opacity: running ? 0.5 : pressed ? 0.85 : 1,
										borderRadius: 8,
										paddingVertical: 8,
										paddingHorizontal: 12,
									})}
									onPress={() => runExample(ex)}
									disabled={running}
								>
									{running ? (
										<ActivityIndicator color="#ffffff" />
									) : (
										<Text style={{ color: "#ffffff" }}>Run</Text>
									)}
								</Pressable>
							</View>

							{result ? (
								<View
									style={{
										padding: 8,
										borderRadius: 8,
										backgroundColor: "#f9fafb",
										borderWidth: 1,
										borderColor: "#e5e7eb",
									}}
								>
									{result.errorCode ? (
										<Text style={{ color: "#b91c1c" }}>
											{result.errorCode} · {result.text}
											{result.errorDetails ? ` (${result.errorDetails})` : ""}
										</Text>
									) : (
										<Text style={{ color: "#111827" }}>{result.text}</Text>
									)}
								</View>
							) : null}
						</View>
					);
				})}
			</View>
		</ScrollView>
	);
}
