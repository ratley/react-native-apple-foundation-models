# apple-foundation-models

Access Apple's on-device Foundation Models for text on iOS.

## Installation

Install the module:

```
npx expo install apple-foundation-models
```

Rebuild your native project:

- **Expo (managed)**: run `npx expo prebuild` and rebuild your iOS app (EAS Build or `expo run:ios`).
- **Bare React Native**: run `npx pod-install` after installing the package.

## Platform requirements

- **iOS**: Requires iOS 26+ and Apple Intelligence‑capable hardware.
- **Web**: Not supported; calls will throw/return unavailable.
- **Android**: Not supported for on‑device text models.

# API quickstart

## Availability

Always check availability before using the on-device model and handle the specific reason:

```ts
import { getTextModelAvailability } from "apple-foundation-models";

const availability = await getTextModelAvailability();
if (availability.status === "available") {
  // Ready to use
} else {
  switch (availability.reasonCode) {
    case "deviceNotEligible":
      // Device doesn't support Apple Intelligence
      break;
    case "appleIntelligenceNotEnabled":
      // Ask the user to enable Apple Intelligence in Settings
      break;
    case "modelNotReady":
      // Model is downloading or initializing; show a spinner/backoff
      break;
    case "unknown":
    case "unsupported":
      // Provide a non‑AI fallback UX
      break;
  }
}
```

Notes:
- Mirrors `SystemLanguageModel.default.availability` on iOS 26+. On unsupported platforms, the module reports `{ status: "unavailable", reasonCode: "unsupported" }`.
- A boolean `isTextModelAvailable()` is also exposed for simple checks.

## Text generation (one‑shot)

```ts
import { generateText } from "apple-foundation-models";

const { text, sessionId } = await generateText({
  prompt: "Summarize this paragraph in 2 sentences",
  instructions: "Be concise.", // optional system instructions
  temperature: 0.2,              // optional; keep conservative on‑device
  maxOutputTokens: 256,          // optional; bound output length
});
```

## Sessions (object API and React hook)

For multiple related turns, use a reusable session. You don't need to manage IDs manually unless you want to.

```ts
import { LLMSession } from "apple-foundation-models";

const s = await LLMSession.create({ instructions: "Be concise." });
const a = await s.ask({ prompt: "Summarize apple vs orange" });
s.reset({ instructions: "Reply in pirate speak" });
const b = await s.ask({ prompt: "Say hi" });
```

React hook (UI ergonomics):

```ts
import { useLLMSession } from "apple-foundation-models";

const s = useLLMSession({ instructions: "Be concise." });
// await s.ask("Summarize apple vs orange")
```

## Structured output (JSON) with `generateObject`

Ask the model to return JSON that matches a small schema. The library prefers native guided generation on iOS 26+, and falls back to prompt‑then‑parse otherwise.

```ts
import { generateObject } from "apple-foundation-models";

const { object } = await generateObject<{ items: { name: string; quantity: number }[]}>({
  prompt: 'From: "We need 2 cartons of milk and a dozen eggs" create a shopping list',
  schema: {
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
  },
});
// object: { items: [ { name: "milk", quantity: 2 }, { name: "eggs", quantity: 12 } ] }
```

Schema support is a minimal JSON Schema subset:
- string (minLength, maxLength, enum)
- number (minimum, maximum)
- boolean
- array (items, minItems, maxItems)
- object (properties, required)

Guidelines:
- Keep prompts focused and outputs small/bounded for best on‑device performance.
- Prefer low temperature (e.g., 0.2) for deterministic structure.

## Errors

Thrown errors are normalized:
- Text: `TextGenerationError` with codes like `ERR_TEXT_GENERATION_UNSUPPORTED`, `ERR_TEXT_PROMPT_INVALID`, `ERR_TEXT_GENERATION_TIMEOUT`, `ERR_TEXT_GENERATION_MODEL_UNAVAILABLE`, and model‑availability specific codes (`ERR_TEXT_MODEL_DEVICE_NOT_ELIGIBLE`, `ERR_TEXT_MODEL_NOT_ENABLED`, `ERR_TEXT_MODEL_NOT_READY`, `ERR_TEXT_MODEL_UNKNOWN`).
- Object: codes like `ERR_OBJECT_PROMPT_INVALID`, `ERR_OBJECT_SCHEMA_INVALID`, `ERR_OBJECT_GENERATION_DECODE_FAILED`, `ERR_OBJECT_GENERATION_UNSUPPORTED`.

Handle with `toTextGenerationError(error)` or your own guards.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).