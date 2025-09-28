import Foundation
import ExpoModulesCore
#if canImport(FoundationModels)
import FoundationModels
#endif

final class TextGenerationUnsupportedException: Exception {
  override var reason: String {
    "Text generation requires iOS 26 or later on Apple Intelligence-capable hardware."
  }

  override var code: String {
    "ERR_TEXT_GENERATION_UNSUPPORTED"
  }
}

final class TextGenerationPromptEmptyException: Exception {
  override var reason: String {
    "Prompt must be a non-empty string."
  }

  override var code: String {
    "ERR_TEXT_PROMPT_INVALID"
  }
}

final class TextGenerationFailureException: Exception {
  private let _reason: String
  private let _code: String
  private let _cause: Error?

  override var reason: String { _reason }
  override var code: String { _code }

  override var cause: Error? {
    get { _cause }
    set { /* ignore set to keep immutable */ }
  }

  init(_ context: Any, file: String = #fileID, line: UInt = #line, function: String = #function) {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, *), let ctx = context as? TextGenerationErrorContext {
      self._reason = ctx.message
      self._code = ctx.code.rawValue
      self._cause = ctx.cause
    } else {
      self._reason = "Text generation failed."
      self._code = "ERR_TEXT_GENERATION_RUNTIME"
      self._cause = nil
    }
    #else
    self._reason = "Text generation failed."
    self._code = "ERR_TEXT_GENERATION_RUNTIME"
    self._cause = nil
    #endif
    super.init(file: file, line: line, function: function)
  }
}

enum TextAvailability {
  static func isSupported() -> Bool {
#if canImport(FoundationModels)
    if #available(iOS 26.0, *) {
      return SystemLanguageModel.default.isAvailable
    }
#endif
    return false
  }
}

struct TextGenerationOptions: Record {
  @Field public var prompt: String
  @Field public var system: String?
  @Field public var temperature: Double?
  @Field("maxOutputTokens") public var maxOutputTokens: Int?
  @Field public var sessionId: String?

  // Required by ExpoModulesCore.Record for decoding
  public init() {
    self._prompt = Field(wrappedValue: "")
    self._system = Field(wrappedValue: nil)
    self._temperature = Field(wrappedValue: nil)
    self._maxOutputTokens = Field(wrappedValue: nil)
    self._sessionId = Field(wrappedValue: nil)
  }

  // Convenience initializer used internally
  public init(prompt: String, system: String? = nil, temperature: Double? = nil, maxOutputTokens: Int? = nil, sessionId: String? = nil) {
    self._prompt = Field(wrappedValue: prompt)
    self._system = Field(wrappedValue: system)
    self._temperature = Field(wrappedValue: temperature)
    self._maxOutputTokens = Field(wrappedValue: maxOutputTokens)
    self._sessionId = Field(wrappedValue: sessionId)
  }
}

struct TextGenerationResult: Record {
  @Field public var text: String
  @Field public var sessionId: String

  // Required by ExpoModulesCore.Record for encoding/decoding
  public init() {
    self._text = Field(wrappedValue: "")
    self._sessionId = Field(wrappedValue: "")
  }

  // Convenience initializer used internally
  public init(text: String, sessionId: String) {
    self._text = Field(wrappedValue: text)
    self._sessionId = Field(wrappedValue: sessionId)
  }
}

public final class AppleFoundationModelsModule: Module {
#if canImport(FoundationModels)
  // Stored properties cannot be marked @available. Use a lazy storage plus an accessor guarded by availability.
  private var _textSessionStore: Any? = nil
  @available(iOS 26.0, *)
  private var textSessionStore: TextSessionStore {
    if let store = _textSessionStore as? TextSessionStore { return store }
    let store = TextSessionStore()
    _textSessionStore = store
    return store
  }
#endif

  public func definition() -> ModuleDefinition {
    Name("AppleFoundationModels")

    AsyncFunction("isTextModelAvailable") { () -> Bool in
      TextAvailability.isSupported()
    }

    AsyncFunction("generateText") { (options: TextGenerationOptions) -> TextGenerationResult in
      let trimmedPrompt = options.prompt.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !trimmedPrompt.isEmpty else {
        throw TextGenerationPromptEmptyException()
      }

      guard TextAvailability.isSupported() else {
        throw TextGenerationUnsupportedException()
      }

#if canImport(FoundationModels)
      guard #available(iOS 26.0, *) else {
        throw TextGenerationUnsupportedException()
      }

      let handle = try await textSessionStore.session(for: options)
      let generationOptions = options.generationOptions()

      do {
        let response = try await handle.session.respond(
          to: trimmedPrompt,
          options: generationOptions
        )

        return TextGenerationResult(text: response.content, sessionId: handle.id)
      } catch {
#if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
          throw TextGenerationFailureException(TextGenerationErrorContext.from(error: error))
        } else {
          throw TextGenerationFailureException("Text generation failed.")
        }
#else
        throw TextGenerationFailureException("Text generation failed.")
#endif
      }
#else
      throw TextGenerationUnsupportedException()
#endif
    }
  }
}

#if canImport(FoundationModels)
@available(iOS 26.0, *)
struct TextGenerationErrorContext {
  enum Code: String {
    case invalidArgument = "ERR_TEXT_GENERATION_INVALID_ARGUMENT"
    case canceled = "ERR_TEXT_GENERATION_CANCELED"
    case timeout = "ERR_TEXT_GENERATION_TIMEOUT"
    case runtime = "ERR_TEXT_GENERATION_RUNTIME"
    case modelUnavailable = "ERR_TEXT_GENERATION_MODEL_UNAVAILABLE"
  }

  let code: Code
  let message: String
  let cause: Error?
  let nativeDomain: String?
  let nativeCode: Int?

  static func from(error: Error) -> TextGenerationErrorContext {
    if let failure = error as? TextGenerationFailureException {
      return TextGenerationErrorContext(
        code: .runtime,
        message: failure.reason,
        cause: failure.cause,
        nativeDomain: nil,
        nativeCode: nil
      )
    }

    if let generationError = error as? LanguageModelSession.GenerationError {
      return mapGenerationError(generationError)
    }

    let nsError = error as NSError
    return TextGenerationErrorContext(
      code: Self.heuristicCode(for: nsError),
      message: nsError.localizedDescription.ifEmpty("Text generation failed."),
      cause: error,
      nativeDomain: nsError.domain,
      nativeCode: nsError.code
    )
  }

  private static func mapGenerationError(_ error: LanguageModelSession.GenerationError) -> TextGenerationErrorContext {
    // Some SDK versions may type-erasure GenerationError to a protocol-backed error code
    // that doesn't expose the enum cases used below. To keep compatibility, prefer
    // introspection and fallback to NSError heuristics.

    // Try to access a nested underlying error if available via Mirror
    let mirror = Mirror(reflecting: error)
    var underlying: Error? = nil
    for child in mirror.children {
      if child.label == "underlying" || child.label == "_underlying" || child.label == "cause" {
        if let e = child.value as? Error { underlying = e }
      }
    }

    // If the error already conforms to NSError, use heuristic mapping
    let nsError = (error as NSError)
    return TextGenerationErrorContext(
      code: Self.heuristicCode(for: nsError),
      message: nsError.localizedDescription.ifEmpty("Text generation failed."),
      cause: underlying ?? error,
      nativeDomain: nsError.domain,
      nativeCode: nsError.code
    )
  }

  private static func heuristicCode(for error: NSError) -> Code {
    let description = error.localizedDescription.lowercased()

    if description.contains("cancel") {
      return .canceled
    }

    if description.contains("timeout") || description.contains("timed out") {
      return .timeout
    }

    if description.contains("invalid") || description.contains("unsupported") {
      return .invalidArgument
    }

    if description.contains("unavailable") || description.contains("missing") {
      return .modelUnavailable
    }

    return .runtime
  }
}

private extension String {
  func ifEmpty(_ fallback: @autoclosure () -> String) -> String {
    if trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      return fallback()
    }
    return self
  }
}

@available(iOS 26.0, *)
private actor TextSessionStore {
  struct Entry {
    var session: LanguageModelSession
    var instructions: String?
  }

  private var entries: [String: Entry] = [:]

  func session(for options: TextGenerationOptions) throws -> (id: String, session: LanguageModelSession) {
    let normalizedInstructions = options.system?.trimmingCharacters(in: .whitespacesAndNewlines)

    if let requestedId = options.sessionId, let entry = entries[requestedId] {
      if entry.instructions == normalizedInstructions {
        return (requestedId, entry.session)
      }

      let refreshedSession = TextSessionStore.makeSession(instructions: normalizedInstructions)
      entries[requestedId] = Entry(session: refreshedSession, instructions: normalizedInstructions)
      return (requestedId, refreshedSession)
    }

    let id = options.sessionId ?? UUID().uuidString
    let session = TextSessionStore.makeSession(instructions: normalizedInstructions)
    entries[id] = Entry(session: session, instructions: normalizedInstructions)
    return (id, session)
  }

  private static func makeSession(instructions: String?) -> LanguageModelSession {
    let instructions = instructions?.trimmingCharacters(in: .whitespacesAndNewlines)

    if let instructions, !instructions.isEmpty {
      return LanguageModelSession(instructions: instructions)
    }

    return LanguageModelSession()
  }
}

@available(iOS 26.0, *)
private extension TextGenerationOptions {
  func generationOptions() -> GenerationOptions {
    var options = GenerationOptions()

    if let maxOutputTokens {
      options.maximumResponseTokens = maxOutputTokens
    }

    if let temperature {
      options.temperature = temperature
    }

    return options
  }
}
#endif

