package expo.modules.applefoundationmodels

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class AppleFoundationModelsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppleFoundationModels")

    // Availability: Android does not support Apple on-device text models.
    AsyncFunction("isTextModelAvailable") { false }

    AsyncFunction("getTextModelAvailability") {
      mapOf(
        "status" to "unavailable",
        "reasonCode" to "unsupported"
      )
    }

    // Text generation is not supported on Android – throw a coded error.
    AsyncFunction<Unit, Map<String, Any?>>("generateText") { _: Map<String, Any?> ->
      throw CodedException(
        "ERR_TEXT_GENERATION_UNSUPPORTED",
        "Text generation is not supported on Android.",
        null
      )
    }

    // Structured generation is not supported on Android – throw a coded error.
    AsyncFunction<Unit, Map<String, Any?>>("generateObject") { _: Map<String, Any?> ->
      throw CodedException(
        "ERR_OBJECT_GENERATION_UNSUPPORTED",
        "Structured generation is not supported on Android.",
        null
      )
    }

    // Keep the sample view available (no-op for this module's core features).
    View(AppleFoundationModelsView::class) {
      Prop("url") { view: AppleFoundationModelsView, url: URL ->
        view.webView.loadUrl(url.toString())
      }
      Events("onLoad")
    }
  }
}
