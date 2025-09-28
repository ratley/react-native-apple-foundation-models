import * as React from "react";

import { AppleFoundationModelsViewProps } from "./AppleFoundationModels.types";

export default function AppleFoundationModelsView(
	props: AppleFoundationModelsViewProps,
) {
	return (
		<div>
			<iframe
				style={{ flex: 1 }}
				src={props.url}
				onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
			/>
		</div>
	);
}
