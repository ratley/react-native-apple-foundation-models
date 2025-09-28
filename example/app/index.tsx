import { isTextModelAvailable } from "apple-foundation-models";
import { Link, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const ScreenLink = ({ href, title }: { href: string; title: string }) => {
	const router = useRouter();
	return (
		<Link style={{ width: "100%" }} href={href} asChild>
			<TouchableOpacity
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingVertical: 10,
				}}
				hitSlop={10}
			>
				<Text style={{ color: "#000000", fontSize: 16 }}>{title}</Text>
				<SymbolView name="chevron.right" size={16} tintColor="#000000" />
			</TouchableOpacity>
		</Link>
	);
};

export default function Index() {
	const [available, setAvailable] = useState<
		"checking" | "available" | "unsupported"
	>("checking");

	useEffect(() => {
		isTextModelAvailable()
			.then((ok) => setAvailable(ok ? "available" : "unsupported"))
			.catch(() => setAvailable("unsupported"));
	}, []);

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: "#ffffff" }}
			contentContainerStyle={{ padding: 20, gap: 16 }}
		>
			<Text style={{ color: "#000000", fontSize: 22, fontWeight: "600" }}>
				Apple Foundation Models - Examples
			</Text>
			<Text style={{ color: "#000000", fontSize: 14 }}>
				{available === "checking"
					? "Checking device support..."
					: available === "available"
						? "Text model available"
						: "Text model unsupported on this device"}
			</Text>

			<View style={{ borderTopWidth: 1, borderColor: "#e5e7eb" }} />

			<ScreenLink href="/text-gen-examples" title="Text generation examples" />
		</ScrollView>
	);
}
