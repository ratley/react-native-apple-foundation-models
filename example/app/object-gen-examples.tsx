import { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import {
	generateObject,
	JSONSchema,
} from "react-native-apple-foundation-models";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CardProps = {
	title: string;
	description: string;
	prompt: string;
	schema: JSONSchema;
};

function ExampleCard({ title, description, prompt, schema }: CardProps) {
	const [pending, setPending] = useState(false);
	const [result, setResult] = useState<unknown>(null);
	const [error, setError] = useState<string | null>(null);

	const run = async () => {
		setPending(true);
		setError(null);
		setResult(null);
		try {
			const { object } = await generateObject({ prompt, schema });
			setResult(object);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		} finally {
			setPending(false);
		}
	};

	return (
		<View
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
						color: "#000",
						fontSize: 18,
						fontWeight: "600",
						marginBottom: 4,
					}}
				>
					{title}
				</Text>
				<Text style={{ color: "#6b7280", fontSize: 14 }}>{description}</Text>
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
				<Text style={{ color: "#374151", fontSize: 14, lineHeight: 20 }}>
					{prompt}
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
					Schema
				</Text>
				<Text style={{ color: "#374151", fontSize: 12 }}>
					{JSON.stringify(schema, null, 2)}
				</Text>
			</View>

			<View style={{ flexDirection: "row" as const }}>
				<Pressable
					style={({ pressed }) => ({
						backgroundColor: "#000",
						opacity: pending ? 0.5 : pressed ? 0.85 : 1,
						borderRadius: 8,
						paddingVertical: 8,
						paddingHorizontal: 12,
					})}
					onPress={run}
					disabled={pending}
				>
					{pending ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={{ color: "#fff" }}>Run</Text>
					)}
				</Pressable>
			</View>

			{error ? (
				<View
					style={{
						backgroundColor: "#fef2f2",
						borderColor: "#fecaca",
						borderWidth: 1,
						borderRadius: 8,
						padding: 12,
					}}
				>
					<Text style={{ color: "#b91c1c" }}>{error}</Text>
				</View>
			) : null}

			{result ? (
				<View
					style={{
						backgroundColor: "#f0fdf4",
						borderColor: "#bbf7d0",
						borderWidth: 1,
						borderRadius: 8,
						padding: 12,
					}}
				>
					<Text
						style={{
							color: "#14532d",
							fontSize: 12,
							textTransform: "uppercase" as const,
							fontWeight: "600",
							letterSpacing: 0.5,
							marginBottom: 4,
						}}
					>
						Result
					</Text>
					<Text style={{ color: "#166534" }}>
						{JSON.stringify(result, null, 2)}
					</Text>
				</View>
			) : null}
		</View>
	);
}

export default function ObjectExamples() {
	const insets = useSafeAreaInsets();

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: "#fff" }}
			contentContainerStyle={{
				padding: 20,
				gap: 16,
				paddingBottom: insets.bottom + 100,
			}}
		>
			<Text style={{ color: "#000", fontSize: 22, fontWeight: "600" }}>
				Structured output examples
			</Text>

			<ExampleCard
				title="Extract product review"
				description="Pull sentiment and fields from free text"
				prompt={`Extract the following values from the review. If not present, use null. Review: "Battery lasts about 5 hours with heavy use, build quality is excellent. The camera is fine but not great. Overall I think it's worth the price."`}
				schema={{
					type: "object",
					required: ["sentiment", "batteryHours"],
					properties: {
						sentiment: {
							type: "string",
							enum: ["positive", "neutral", "negative"],
						},
						batteryHours: { type: "number", minimum: 0 },
						buildQuality: { type: "string", minLength: 1 },
						cameraOpinion: { type: "string" },
						worthPrice: { type: "boolean" },
					},
				}}
			/>

			<ExampleCard
				title="Shopping list"
				description="Turn text into a normalized list"
				prompt={`From this input, produce a list of items with name and quantity: "We need 2 cartons of milk, a dozen eggs, and some apples (around 6)."`}
				schema={{
					type: "object",
					required: ["items"],
					properties: {
						items: {
							type: "array",
							items: {
								type: "object",
								required: ["name", "quantity"],
								properties: {
									name: { type: "string", minLength: 1 },
									quantity: { type: "number", minimum: 0 },
								},
							},
						},
					},
				}}
			/>

			<ExampleCard
				title="Contact card"
				description="Parse a simple contact from text"
				prompt={`Create a contact object with fullName, email, and tags from: "Email me at alex.smith@example.com — Alex Smith. Tags: sales, vip"`}
				schema={{
					type: "object",
					required: ["fullName"],
					properties: {
						fullName: { type: "string", minLength: 1 },
						email: { type: "string" },
						tags: {
							type: "array",
							items: { type: "string" },
							minItems: 0,
							maxItems: 10,
						},
					},
				}}
			/>
		</ScrollView>
	);
}
