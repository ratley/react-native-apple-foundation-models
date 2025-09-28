import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Layout() {
	return (
		<SafeAreaProvider>
			<StatusBar style="dark" />
			<Stack
				screenOptions={{
					headerShown: true,
					headerBackButtonDisplayMode: "minimal",
				}}
			>
				<Stack.Screen
					name="index"
					options={{ title: "Apple Foundation Models" }}
				/>
				<Stack.Screen
					name="text-gen-examples"
					options={{ title: "Text Generation" }}
				/>
			</Stack>
		</SafeAreaProvider>
	);
}
