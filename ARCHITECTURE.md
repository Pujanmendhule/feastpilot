# FeastPilot Technical Architecture

## 1. Architecture Overview

FeastPilot is a voice-first and chat-capable conversational food ordering planner. The MVP uses mock restaurant and menu data, in-memory session state, Express backend APIs, a LangGraph-based agent, Kimi K2.6 for reasoning, and ElevenLabs for speech-to-text and text-to-speech.

The MVP must not integrate MongoDB or Swiggy MCP. It must still be designed so mock tools can later be replaced by Swiggy MCP tools without changing frontend behavior or agent orchestration logic.

Core architectural principles:

- The frontend communicates only with backend APIs.
- The backend owns session state for the MVP.
- The LangGraph agent communicates with restaurant, menu, and cart capabilities only through tools.
- The agent must never directly read JSON files, import mock data, or mutate session storage.
- Mock data access is encapsulated behind service and tool interfaces.
- Voice mode and chat mode use the same conversation endpoint after text is available.
- Multiple restaurants are allowed in a single cart.
- No real ordering, payment, Swiggy cart creation, or Swiggy order placement exists in the MVP.

## 2. Repository Folder Structure

Recommended repository structure:

- `frontend/`
  - React, TypeScript, Tailwind, and Shadcn application.
  - Owns browser UI, microphone capture, audio playback, conversation rendering, cart rendering, and client-side request state.

- `backend/`
  - Express API server.
  - Owns API routes, LangGraph agent execution, in-memory session state, mock data services, tool implementations, and ElevenLabs server-side integration.

- `shared/`
  - Shared TypeScript types and validation schemas used by frontend and backend.
  - Defines transport-safe domain contracts such as `Session`, `Message`, `Cart`, `Restaurant`, `MenuItem`, and API payload shapes.

- `docs/`
  - Product, architecture, agent, API, and migration documentation.
  - May contain expanded design notes that support `PROJECT_SPEC.md` and `ARCHITECTURE.md`.

Detailed structure:

- `frontend/src/app/`
  - App bootstrap, routing, layout shell, global providers.

- `frontend/src/pages/`
  - Page-level views such as the ordering session page.

- `frontend/src/components/`
  - Reusable UI components.

- `frontend/src/features/conversation/`
  - Conversation panel, message list, composer, voice controls, transcript state.

- `frontend/src/features/cart/`
  - Multi-restaurant cart view, item controls, totals, delivery estimates.

- `frontend/src/features/session/`
  - Session creation, session loading, session status, reset flow.

- `frontend/src/lib/api/`
  - API client wrappers for conversation, voice, and session endpoints.

- `frontend/src/lib/audio/`
  - Microphone recording, audio playback, audio permissions, and browser audio utilities.

- `backend/src/server/`
  - Express app creation, middleware, route registration, error handling.

- `backend/src/routes/`
  - Conversation, voice, and session route modules.

- `backend/src/agent/`
  - LangGraph graph definition, graph state schema, node implementations, prompts, and tool binding.

- `backend/src/tools/`
  - Tool interface definitions and mock tool implementations.

- `backend/src/services/`
  - Mock data service, cart service, session service, voice service, model service.

- `backend/src/data/mock/`
  - `restaurants.json` and `menus.json`.
  - These files are read only by backend services, never by the agent directly.

- `backend/src/config/`
  - Environment variable loading and provider configuration.

- `shared/src/`
  - Shared domain types, API contracts, and validation schemas.

- `docs/`
  - Supporting documentation for product decisions, prompt behavior, tool contracts, and future Swiggy MCP migration.

## 3. Frontend Architecture

### 3.1 Frontend Responsibilities

The frontend is responsible for:

- Letting users choose voice mode or chat mode.
- Capturing microphone audio for voice mode.
- Sending audio to the speech-to-text endpoint.
- Sending transcribed or typed text to the conversation endpoint.
- Rendering conversation history.
- Rendering structured cart state.
- Playing assistant speech from the text-to-speech endpoint or audio URL returned by the backend.
- Showing clear loading, error, retry, and muted states.
- Preserving the same ordering experience across voice and chat modes.

The frontend must not:

- Read mock restaurant or menu JSON directly.
- Run agent logic.
- Mutate cart state locally as a source of truth.
- Call ElevenLabs directly unless the backend architecture is intentionally changed later.
- Know whether backend tools are mock tools or future Swiggy MCP tools.

### 3.2 Page Structure

MVP page structure:

- `/`
  - Main FeastPilot ordering experience.
  - Creates a session if one does not already exist.
  - Presents voice and chat controls.
  - Shows the active conversation and cart.

- `/sessions/:sessionId`
  - Optional route for restoring an in-memory session while the backend process is alive.
  - Useful during development and testing.

- `/dev/mock-data`
  - Optional development-only route for inspecting mock restaurants and menus.
  - Must not be required for the core user experience.

Recommended first screen layout:

- Left or primary area: conversation.
- Bottom area: voice and chat input controls.
- Right or secondary area: cart.
- On narrow screens: tabs or stacked sections for conversation and cart.

### 3.3 Component Tree

Recommended component tree:

- `App`
  - `AppProviders`
    - API client provider.
    - Theme provider.
    - Session provider.
    - Audio provider.
  - `AppRouter`
    - `OrderingPage`
      - `SessionInitializer`
      - `OrderingLayout`
        - `ConversationRegion`
          - `ConversationHeader`
            - `SessionStatusBadge`
            - `ModeToggle`
          - `MessageList`
            - `UserMessageBubble`
            - `AssistantMessageBubble`
            - `SystemNotice`
            - `ToolActivityIndicator`
          - `ConversationInputArea`
            - `ChatComposer`
            - `VoiceRecorder`
            - `TranscriptPreview`
            - `SendButton`
            - `RetryButton`
        - `CartRegion`
          - `CartHeader`
          - `RestaurantCartGroupList`
            - `RestaurantCartGroup`
              - `RestaurantSummary`
              - `CartItemList`
                - `CartItemRow`
              - `RestaurantSubtotal`
              - `RestaurantDeliveryEstimate`
          - `CartTotals`
          - `CartAssumptions`
          - `CartValidationWarnings`
        - `AudioPlaybackController`
          - `PlaybackButton`
          - `MuteToggle`
          - `ReplayButton`
        - `ErrorToastLayer`

### 3.4 State Management Approach

The frontend should use a lightweight client state approach:

- Server state:
  - Managed through request hooks or a query library.
  - Includes session, messages, cart, and backend status.

- Local UI state:
  - Managed with React state or a small local store.
  - Includes active mode, recording state, audio playback state, text composer value, optimistic loading indicators, and selected UI tab.

- Source of truth:
  - The backend in-memory session is the source of truth for messages, cart, assumptions, and preferences.
  - The frontend may show temporary pending messages while a request is in flight, but must reconcile with the backend response.

Suggested frontend state groups:

- `sessionState`
  - `sessionId`
  - `status`
  - `createdAt`
  - `updatedAt`

- `conversationState`
  - `messages`
  - `isSending`
  - `lastError`
  - `pendingTranscript`

- `voiceState`
  - `mode`
  - `isRecording`
  - `isTranscribing`
  - `isSynthesizing`
  - `isPlaying`
  - `isMuted`
  - `lastAudioUrl`

- `cartState`
  - `cart`
  - `isUpdating`
  - `validationWarnings`

### 3.5 Voice Flow

Voice mode uses the same conversation path as chat mode after transcription.

Flow:

1. User selects voice mode.
2. User starts recording.
3. Frontend captures microphone audio.
4. User stops recording or silence detection stops recording.
5. Frontend sends audio to `POST /api/voice/stt`.
6. Backend sends audio to ElevenLabs STT.
7. Backend returns transcript and confidence metadata.
8. Frontend displays transcript preview.
9. Frontend submits transcript to `POST /api/conversation`.
10. Backend runs the LangGraph agent.
11. Backend returns assistant message, cart state, session state, and optional speech metadata.
12. If voice output is enabled, frontend requests `POST /api/voice/tts` or uses an audio URL returned by the conversation response.
13. Frontend plays assistant audio and keeps assistant text visible.

Voice error handling:

- If microphone permission fails, stay in chat mode.
- If STT fails, show retry and allow typed correction.
- If conversation fails, preserve transcript and allow resubmission.
- If TTS fails, keep text response and show replay unavailable state.

### 3.6 Chat Flow

Chat mode is the baseline interaction mode and fallback for voice.

Flow:

1. User types a message.
2. Frontend sends message to `POST /api/conversation`.
3. Backend appends the user message to the in-memory session.
4. Backend runs the LangGraph agent.
5. Agent invokes tools for all restaurant, menu, and cart operations.
6. Backend stores assistant response and cart updates in memory.
7. Frontend receives updated messages, cart, and session state.
8. Frontend renders the assistant response and cart changes.

Chat mode and voice mode must use the same backend conversation contract.

### 3.7 Cart UI

The cart UI must support multiple restaurants in a single cart.

Required display:

- Restaurant groups.
- Items grouped under each restaurant.
- Quantity per item.
- Unit price per item.
- Item subtotal.
- Notes or customizations per item.
- Subtotal per restaurant.
- Delivery estimate per restaurant.
- Grand subtotal.
- Estimated fees if modeled.
- Grand total.
- Number of people planned for.
- Preference coverage.
- Assumptions and warnings.

The cart UI should make clear that the MVP cart is a mock planned cart, not a real Swiggy cart.

Optional manual controls:

- Increase quantity.
- Decrease quantity.
- Remove item.
- Clear cart.

If manual controls are included, they should call backend cart update APIs or conversation APIs. They should not directly mutate the cart source of truth in the browser.

## 4. Backend Architecture

### 4.1 Backend Responsibilities

The backend is responsible for:

- Express route handling.
- Request validation.
- In-memory session state.
- Running the LangGraph agent.
- Enforcing the tool-only agent boundary.
- Reading mock data through services.
- Cart creation, update, validation, and summary.
- ElevenLabs STT and TTS integration.
- Returning stable API contracts to the frontend.

The backend must not:

- Persist MVP session state to MongoDB.
- Integrate with Swiggy MCP in the MVP.
- Allow the agent to directly import or read mock JSON files.
- Let frontend-specific concerns leak into the agent graph.

### 4.2 Route Structure

Recommended route modules:

- `conversation.routes`
  - Handles user conversational turns.
  - Main endpoint: `POST /api/conversation`.

- `voice.routes`
  - Handles STT and TTS.
  - Endpoints:
    - `POST /api/voice/stt`
    - `POST /api/voice/tts`

- `session.routes`
  - Handles session lifecycle.
  - Endpoints:
    - `POST /api/sessions`
    - `GET /api/sessions/:sessionId`
    - `DELETE /api/sessions/:sessionId`

- `health.routes`
  - Handles service health.
  - Endpoint:
    - `GET /api/health`

- `dev.routes`
  - Optional development-only mock data inspection.
  - Must be disabled or clearly marked outside development.

### 4.3 Service Structure

Recommended services:

- `SessionService`
  - Creates sessions.
  - Reads sessions.
  - Updates session messages.
  - Stores preferences, assumptions, graph state summaries, and cart IDs.
  - Deletes sessions.
  - Keeps all data in memory for MVP.

- `MockRestaurantService`
  - Reads and validates `restaurants.json`.
  - Provides restaurant search and lookup to tools.
  - Applies mock availability and filtering rules.

- `MockMenuService`
  - Reads and validates `menus.json`.
  - Provides menu lookup to tools.
  - Filters by restaurant, category, dietary marker, spice level, and availability.

- `CartService`
  - Creates carts.
  - Updates carts.
  - Supports multiple restaurants.
  - Calculates restaurant subtotals and grand totals.
  - Computes delivery estimates.
  - Produces structured cart summaries.

- `AgentService`
  - Invokes the LangGraph app for a conversation turn.
  - Provides the tool registry to the graph.
  - Normalizes agent output for route responses.

- `VoiceService`
  - Calls ElevenLabs STT.
  - Calls ElevenLabs TTS.
  - Normalizes provider errors.
  - Avoids retaining audio longer than needed.

- `ModelService`
  - Configures Kimi K2.6 access.
  - Owns model client setup, timeouts, retries, and provider-specific options.

### 4.4 Agent Structure

Recommended agent modules:

- `graph`
  - Defines LangGraph nodes, edges, conditional transitions, and graph state.

- `state`
  - Defines graph state schema.

- `nodes`
  - Contains node handlers for intent extraction, planning, tool execution, validation, and response generation.

- `prompts`
  - Contains system and developer prompts for FeastPilot behavior.

- `tools`
  - Binds tool interfaces for the agent.

- `policies`
  - Enforces constraints such as mock-only ordering, no real order placement, tool-only data access, and concise spoken responses.

Agent boundary:

- The agent may reason over user messages and tool results.
- The agent may decide which tool to call.
- The agent may not read files.
- The agent may not access services directly except through registered tools.
- The agent may not fabricate restaurants, menu items, prices, delivery estimates, or cart totals.
- The agent must ask a clarifying question if tool results are insufficient for a reliable plan.

### 4.5 Session Management

MVP session state lives in memory inside the backend process.

Recommended storage:

- A process-local session map keyed by `sessionId`.
- A process-local cart map keyed by `cartId`.
- Optional TTL cleanup for inactive sessions.

Implications:

- Sessions are lost when the backend restarts.
- Sessions are not shared across multiple backend instances.
- MVP deployment should run as a single backend instance unless external session storage is introduced.
- This is acceptable for MVP because the goal is conversation and agent validation, not durable order history.

## 5. LangGraph Design

### 5.1 Graph Nodes

Recommended graph nodes:

- `load_session_context`
  - Loads messages, preferences, assumptions, active cart, and last known mode from the session service.

- `classify_turn`
  - Determines whether the user is starting an order, refining a cart, asking a question, confirming a plan, or making a general request.

- `extract_constraints`
  - Extracts group size, budget, cuisine preferences, dietary constraints, spice preferences, exclusions, desired categories, and delivery expectations.

- `planner`
  - Converts the classified turn and extracted constraints into an explicit execution plan.
  - Decides which data must be fetched before any recommendation can be made.
  - Decides which cart operations are allowed for the turn, but does not mutate the cart.
  - Produces a grounded plan that references only session context, user input, and previous tool results.

- `decide_next_action`
  - Selects the next graph action from the planner output.
  - Routes to restaurant search, menu lookup, cart creation, cart update, cart summary, validation, response generation, or clarification.

- `invoke_tools`
  - Executes tool calls selected by the agent.
  - Records tool inputs and outputs in graph state.

- `plan_cart`
  - Uses tool results to plan additions, removals, substitutions, quantities, and restaurant grouping.
  - Must call cart tools for actual cart changes.

- `validate_plan`
  - Checks budget, availability, dietary coverage, serving estimates, and unresolved assumptions.

- `generate_response`
  - Produces a concise assistant message grounded in tool results and cart state.

- `persist_turn`
  - Saves user message, assistant message, updated preferences, assumptions, and cart reference in memory.

- `prepare_voice_metadata`
  - Marks whether the response should be spoken and provides TTS instructions or text for synthesis.

### 5.2 Graph Edges

Recommended graph flow:

- `start` -> `load_session_context`
- `load_session_context` -> `classify_turn`
- `classify_turn` -> `extract_constraints`
- `extract_constraints` -> `planner`
- `planner` -> `decide_next_action`
- `decide_next_action` -> `invoke_tools` when data or cart operations are needed
- `decide_next_action` -> `generate_response` when a clarifying question or simple answer is needed
- `invoke_tools` -> `plan_cart` when cart planning or revision is needed
- `invoke_tools` -> `generate_response` when the tool result is enough for a direct answer
- `plan_cart` -> `invoke_tools` when cart creation or update tools must be called
- `plan_cart` -> `validate_plan` after cart tools return updated cart state
- `validate_plan` -> `generate_response`
- `generate_response` -> `persist_turn`
- `persist_turn` -> `prepare_voice_metadata`
- `prepare_voice_metadata` -> `end`

Conditional loops:

- `invoke_tools` may loop back to `decide_next_action` if a tool result reveals missing information.
- `validate_plan` may route to `decide_next_action` if substitutions are required.
- `generate_response` may route to `persist_turn` without cart changes when asking a clarifying question.

### 5.3 State Schema

Graph state should include:

- `sessionId`
  - Current session identifier.

- `request`
  - User message text.
  - Input mode: `voice` or `chat`.
  - Optional transcript metadata.
  - Client timestamp.

- `session`
  - Existing messages.
  - Existing preferences.
  - Existing assumptions.
  - Existing cart reference.
  - Session status.

- `turnClassification`
  - Turn type.
  - Confidence.
  - Whether cart mutation is requested.
  - Whether clarification is needed.

- `constraints`
  - People count.
  - Budget.
  - Cuisine preferences.
  - Dietary constraints.
  - Spice preferences.
  - Excluded items.
  - Desired item categories.
  - Restaurant constraints.
  - Delivery expectations.

- `plannerOutput`
  - Turn goal.
  - Required data dependencies.
  - Candidate tool calls.
  - Cart mutation intent, if any.
  - Grounding requirements for restaurants, menu items, prices, totals, and delivery estimates.
  - Clarification requirement when the plan cannot be completed from known data.

- `toolPlan`
  - Ordered list of intended tool calls.
  - Purpose of each call.
  - Required inputs.

- `toolResults`
  - Ordered list of standardized `ToolResult` objects.
  - Includes restaurant search results, restaurant details, menu results, cart operation results, cart summaries, and tool errors inside the standard envelope.

- `cart`
  - Current structured cart after tool operations.

- `validation`
  - Budget fit.
  - Dietary coverage.
  - Availability warnings.
  - Serving estimate confidence.
  - Multi-restaurant delivery notes.
  - Unresolved assumptions.

- `assistantResponse`
  - Text content.
  - Response type.
  - Suggested next user action.
  - Whether the response is safe for voice playback.

- `voice`
  - Whether voice output is requested.
  - TTS text.
  - Voice profile.
  - Playback metadata.

### 5.4 Tool Invocation Flow

The agent must use tools for every restaurant, menu, and cart operation.

Required flow:

1. Agent receives session context and user request.
2. Agent determines required data or cart operation.
3. Agent calls one or more registered tools.
4. Tool implementation calls backend services.
5. Services read mock data or in-memory cart state.
6. Tool returns a standardized `ToolResult`.
7. Agent reasons over the `ToolResult`.
8. Agent calls additional tools if needed.
9. Agent generates response grounded only in user input, session context, and tool results.

Prohibited flow:

- Agent reads `restaurants.json`.
- Agent reads `menus.json`.
- Agent calculates authoritative cart totals without `summarizeCart()`.
- Agent invents menu items not returned by `getMenu()`.
- Agent mutates cart state without `createCart()` or `updateCart()`.

### 5.5 Agent Guardrails

The agent must be grounded in user input, session state, and successful tool results. Guardrails are enforced through prompts, graph policies, tool schemas, validation nodes, and backend service checks.

Restaurant guardrails:

- The agent may mention a restaurant as selectable only if it came from `searchRestaurants()` or `getRestaurant()`.
- Restaurant names, IDs, cuisines, ratings, availability, price ranges, and delivery estimates must match the latest authoritative tool result.
- If no restaurant matches the user's constraints, the agent must say so and ask whether to relax constraints instead of inventing a match.

Menu item guardrails:

- The agent may recommend or add a menu item only if it came from `getMenu()` for the matching restaurant.
- Menu item names, IDs, descriptions, diet labels, spice levels, serving estimates, availability, and customization options must match the latest menu tool result.
- If a desired item is not returned by the menu tool, the agent may ask whether the user wants a similar available item; it must not create a substitute item name or imply availability.

Price and total guardrails:

- Unit prices must come from `getMenu()` or a cart tool result.
- Restaurant subtotals, grand subtotals, fees, and grand totals must come from `createCart()`, `updateCart()`, `getCart()`, or `summarizeCart()`.
- The agent may estimate only when a field is explicitly modeled as an estimate by the tool result, and it must preserve the estimate wording.
- The agent must not recompute authoritative prices in natural language when cart tools have already returned totals.

Cart mutation guardrails:

- The agent must not claim that the cart changed until a successful `createCart()` or `updateCart()` result confirms the change.
- Cart additions must reference authoritative `restaurantId` and `menuItemId` values from prior tool results.
- Cart removals, replacements, and quantity changes must reference an existing `cartId` and either an existing `cartItemId` or an unambiguous item in the active cart.
- Rejected cart operations must be surfaced as warnings or clarification prompts, not described as completed changes.
- Manual frontend cart controls must use backend APIs or conversation APIs that ultimately route through cart services; frontend-only mutations are not authoritative.

Response guardrails:

- The response generator must cite only the entities present in successful tool results or current session state.
- If required data is missing, stale, ambiguous, or contradictory, the agent must ask a clarifying question or call another tool before answering.
- The assistant may summarize assumptions, but assumptions must be labeled as assumptions and must not be presented as provider facts.
- The assistant must keep the MVP boundary clear: planned carts are mock carts, not real Swiggy orders.

## 6. Tool Layer Design

The tool layer is the stable contract between the agent and external capabilities. In the MVP, tools call mock services. In the future, some tools can call Swiggy MCP without changing the agent graph or frontend API.

### 6.1 Tool Design Rules

- Tools must accept structured input and return structured output.
- Tools must validate input before calling services.
- Tools must return explicit errors when data is missing or unavailable.
- Tools must never expose file paths to the agent.
- Tools must hide whether data comes from JSON, memory, MCP, or another provider.
- Tools must produce deterministic results for the same mock data and inputs.
- Tools must include enough metadata for the agent to explain assumptions.
- Tools must return the standardized `ToolResult` envelope.
- Tools must include authoritative entity IDs for restaurants, menu items, cart items, and carts whenever those entities appear in a result.
- Tools must reject cart operations that reference restaurants or menu items not present in prior authoritative tool results or current session state.
- All agent tool interactions must use the standardized `ToolResult` format.

### 6.2 Standard `ToolResult` Interface

All tools return the same standard `ToolResult` interface. This interface is part of the architecture contract and will remain unchanged when FeastPilot migrates from mock tools to Swiggy MCP tools.

Shape:

```text
{
  success: boolean,
  data: any,
  error?: string,
  metadata?: {
    source: string,
    timestamp: string
  }
}
```

Field rules:

- `success`
  - Boolean success flag.
  - `true` means the tool completed and `data` contains the authoritative payload.
  - `false` means the tool failed or rejected the requested operation.

- `data`
  - Tool-specific payload.
  - Must contain authoritative restaurant, menu, cart, summary, warning, or operation data when `success` is true.
  - Should be null or an empty tool-specific payload when `success` is false.

- `error`
  - Optional human-readable failure reason.
  - Required when `success` is false.
  - Must not expose local file paths, provider secrets, stack traces, or internal implementation details.

- `metadata`
  - Optional metadata about the result source and creation time.
  - `source` identifies the provider or service that produced the result, such as `mock`, `mock-restaurant-service`, `cart-service`, or future `swiggy-mcp`.
  - `timestamp` is an ISO timestamp for when the result was produced.

Usage requirements:

- Every tool call made by the agent must return this exact shape.
- The agent must inspect `success` before using `data`.
- The agent must not treat failed tool `data` as authoritative.
- Tool-specific output fields described below live inside `data`.
- Provider-specific details may change during Swiggy MCP migration, but the outer `ToolResult` interface must not change.

### 6.3 `searchRestaurants()`

Purpose:

- Find candidate restaurants matching user constraints.

Input fields:

- `query`
  - Free-text search intent, such as cuisine or restaurant name.

- `cuisines`
  - List of preferred cuisine types.

- `dietaryTags`
  - Vegetarian-friendly, vegan-friendly, Jain-friendly, gluten-free, or similar tags.

- `budgetLevel`
  - Optional budget category such as low, medium, or high.

- `maxDeliveryMinutes`
  - Optional maximum delivery estimate.

- `requiredTags`
  - Tags that must be present.

- `excludedTags`
  - Tags that must not be present.

- `limit`
  - Maximum number of restaurants to return.

Output fields:

- `restaurants`
  - Matching restaurant summaries.

- `resultCount`
  - Number of returned restaurants.

- `appliedFilters`
  - Filters used by the tool.

- `warnings`
  - Notes about partial matches or unavailable filters.

### 6.4 `getRestaurant()`

Purpose:

- Retrieve details for a single restaurant.

Input fields:

- `restaurantId`
  - Required restaurant identifier.

Output fields:

- `restaurant`
  - Full restaurant details.

- `found`
  - Whether the restaurant exists.

- `warnings`
  - Availability or data quality notes.

### 6.5 `getMenu()`

Purpose:

- Retrieve menu items for a restaurant, optionally filtered by constraints.

Input fields:

- `restaurantId`
  - Required restaurant identifier.

- `categories`
  - Optional menu categories.

- `dietTypes`
  - Vegetarian, non-vegetarian, vegan, Jain, or other supported markers.

- `spiceLevels`
  - Allowed spice levels.

- `tags`
  - Desired tags such as popular, combo, dessert, beverage, family-meal.

- `maxPrice`
  - Optional maximum item price.

- `availableOnly`
  - Whether unavailable items should be excluded.

Output fields:

- `restaurantId`
- `items`
  - Matching menu items.

- `resultCount`
- `appliedFilters`
- `warnings`

### 6.6 `createCart()`

Purpose:

- Create a new structured cart for the active session.

Input fields:

- `sessionId`
- `peopleCount`
- `currency`
- `source`
  - Must be `mock` in MVP.

- `initialItems`
  - Optional list of items to add at creation.

- `assumptions`
  - Planning assumptions used to create the cart.

Output fields:

- `cart`
  - Full cart state.

- `created`
  - Whether a new cart was created.

- `warnings`
  - Validation or availability notes.

### 6.7 `updateCart()`

Purpose:

- Apply structured mutations to an existing cart.

Input fields:

- `sessionId`
- `cartId`
- `operations`
  - Add item.
  - Remove item.
  - Replace item.
  - Update quantity.
  - Update notes.
  - Update people count.
  - Clear restaurant group.
  - Clear cart.

- `reason`
  - Natural language explanation of why the operation is being performed.

Output fields:

- `cart`
  - Updated cart.

- `appliedOperations`
  - Operations successfully applied.

- `rejectedOperations`
  - Operations rejected with reasons.

- `warnings`
  - Budget, availability, or multi-restaurant notes.

### 6.8 `getCart()`

Purpose:

- Retrieve the current cart for a session.

Input fields:

- `sessionId`
- `cartId`
  - Optional if the session has only one active cart.

Output fields:

- `cart`
- `found`
- `warnings`

### 6.9 `summarizeCart()`

Purpose:

- Produce authoritative cart totals and planning summary.

Input fields:

- `sessionId`
- `cartId`
- `includeRestaurantBreakdown`
- `includePreferenceCoverage`
- `includeDeliveryEstimates`

Output fields:

- `cartId`
- `restaurantSummaries`
- `grandSubtotal`
- `estimatedFees`
- `grandTotal`
- `deliverySummary`
- `peopleCount`
- `preferenceCoverage`
- `assumptions`
- `warnings`

## 7. Mock Data Design

### 7.1 Mock Data Ownership

Mock data lives in backend files, but only backend services can read those files.

Allowed:

- `MockRestaurantService` reads `restaurants.json`.
- `MockMenuService` reads `menus.json`.
- Tools call services.
- Agent calls tools.

Not allowed:

- Agent reads JSON.
- Frontend reads JSON.
- API routes parse JSON directly instead of using services.

### 7.2 `restaurants.json` Schema

Top-level shape:

- `version`
  - Mock data version string.

- `restaurants`
  - List of restaurant records.

Restaurant record:

- `id`
  - Stable mock restaurant identifier.

- `name`
  - Display name.

- `description`
  - Short human-readable description.

- `cuisines`
  - List of cuisine labels.

- `rating`
  - Numeric rating.

- `priceRange`
  - Low, medium, high, or premium.

- `averageCostForTwo`
  - Mock cost estimate.

- `deliveryEstimateMinutes`
  - Minimum and maximum delivery estimate.

- `isAvailable`
  - Whether restaurant can be selected.

- `tags`
  - Searchable tags.

- `supports`
  - Capabilities such as vegetarian, vegan, Jain, family-meal, spicy, desserts, beverages.

- `location`
  - Mock locality or service area.

- `metadata`
  - Data source, mock notes, and last updated timestamp.

### 7.3 `menus.json` Schema

Top-level shape:

- `version`
  - Mock data version string.

- `menus`
  - List of restaurant menu records.

Restaurant menu record:

- `restaurantId`
  - Links menu to a restaurant.

- `sections`
  - Menu sections such as starters, mains, breads, rice, desserts, beverages, combos.

Menu section:

- `id`
- `name`
- `description`
- `items`

Menu item:

- `id`
- `restaurantId`
- `name`
- `description`
- `price`
- `currency`
- `category`
- `dietType`
  - Vegetarian, non-vegetarian, vegan, Jain, or other supported value.

- `spiceLevel`
  - None, mild, medium, spicy, or extra-spicy.

- `servingEstimate`
  - Minimum and maximum people served.

- `isAvailable`
- `tags`
- `customizationOptions`
  - Optional supported customizations such as spice level, no onion, no garlic, extra cheese, or portion size.

- `allergenNotes`
  - Optional notes. Must be treated as mock and non-authoritative.

- `metadata`
  - Mock notes and last updated timestamp.

### 7.4 Cart Schema

Cart:

- `id`
- `sessionId`
- `status`
  - Draft, awaiting-confirmation, confirmed-mock, or abandoned.

- `source`
  - `mock` in MVP.

- `currency`
- `peopleCount`
- `restaurantGroups`
- `grandSubtotal`
- `estimatedFees`
- `grandTotal`
- `deliverySummary`
- `preferenceCoverage`
- `assumptions`
- `warnings`
- `createdAt`
- `updatedAt`

Restaurant cart group:

- `restaurantId`
- `restaurantName`
- `cuisines`
- `items`
- `restaurantSubtotal`
- `deliveryEstimateMinutes`
- `deliveryFeeEstimate`
- `minimumOrderWarning`
- `availabilityWarnings`

Cart item:

- `cartItemId`
- `menuItemId`
- `restaurantId`
- `name`
- `description`
- `quantity`
- `unitPrice`
- `itemSubtotal`
- `dietType`
- `spiceLevel`
- `servingEstimate`
- `customizations`
- `notes`
- `availabilityStatus`
- `tags`

## 8. API Contracts

All API responses should use a consistent envelope:

- `ok`
  - Boolean success flag.

- `data`
  - Response payload when successful.

- `error`
  - Error object when unsuccessful.

- `requestId`
  - Request identifier for debugging.

Error object:

- `code`
- `message`
- `details`
- `recoverable`

### 8.1 Conversation Endpoint

Endpoint:

- `POST /api/conversation`

Purpose:

- Submit a user message, run the agent, update session state, and return the assistant response plus current cart.

Request schema:

- `sessionId`
  - Required unless the API supports implicit session creation.

- `message`
  - User text message.

- `inputMode`
  - `chat` or `voice`.

- `voice`
  - Optional voice metadata.
  - Includes transcript confidence, language, and source audio reference if available.

- `clientContext`
  - Optional client timestamp, timezone, selected mode, and UI capability flags.

Response data schema:

- `session`
  - Session summary.

- `userMessage`
  - Persisted user message.

- `assistantMessage`
  - Persisted assistant message.

- `cart`
  - Current full cart state, or null if no cart exists.

- `agent`
  - Turn classification, next action, assumptions, warnings, and tool activity summary.

- `voice`
  - Whether TTS is recommended.
  - TTS text.
  - Optional audio URL if synthesized during the conversation request.

### 8.2 Speech-To-Text Endpoint

Endpoint:

- `POST /api/voice/stt`

Purpose:

- Convert recorded user audio into text.

Request schema:

- `sessionId`
  - Optional but preferred for traceability.

- `audio`
  - Multipart audio file or encoded audio payload.

- `format`
  - Audio format such as webm, wav, mp3, or m4a.

- `language`
  - Optional language hint.

- `clientContext`
  - Optional device, browser, and recording duration metadata.

Response data schema:

- `transcript`
  - Transcribed text.

- `confidence`
  - Provider confidence if available.

- `language`
  - Detected or requested language.

- `durationMs`
  - Audio duration.

- `provider`
  - ElevenLabs.

- `warnings`
  - Low confidence, silence detected, or partial transcript notes.

### 8.3 Text-To-Speech Endpoint

Endpoint:

- `POST /api/voice/tts`

Purpose:

- Convert assistant text into playable audio.

Request schema:

- `sessionId`
  - Optional but preferred.

- `messageId`
  - Optional assistant message ID.

- `text`
  - Text to synthesize.

- `voiceProfile`
  - Optional voice profile identifier.

- `format`
  - Desired audio format.

- `playbackPreference`
  - Optional speed, stability, or style preference.

Response data schema:

- `audioUrl`
  - URL or temporary endpoint for playback.

- `audioContentType`
  - MIME type.

- `durationMs`
  - Estimated or actual duration if available.

- `provider`
  - ElevenLabs.

- `warnings`
  - Synthesis fallback or truncation notes.

### 8.4 Session Endpoint

Create session endpoint:

- `POST /api/sessions`

Create request schema:

- `mode`
  - Initial mode: `chat` or `voice`.

- `clientContext`
  - Optional timezone, locale, and UI capabilities.

Create response data schema:

- `session`
  - Created session summary.

- `cart`
  - Null for a new session unless a cart is created immediately.

Get session endpoint:

- `GET /api/sessions/:sessionId`

Get response data schema:

- `session`
  - Full session state visible to the frontend.

- `messages`
  - Conversation messages.

- `cart`
  - Current active cart, or null.

- `preferences`
  - Known ordering preferences.

- `assumptions`
  - Current planning assumptions.

Delete session endpoint:

- `DELETE /api/sessions/:sessionId`

Delete response data schema:

- `deleted`
  - Whether a session was deleted.

- `sessionId`
  - Deleted session identifier.

## 9. Session State Model

MVP session state lives entirely in backend memory.

### 9.1 In-Memory Session Store

The session store contains:

- `sessionsById`
  - Map of session IDs to session records.

- `cartsById`
  - Map of cart IDs to cart records.

- `audioArtifactsById`
  - Optional temporary map for generated audio metadata.

- `requestLogBySessionId`
  - Optional bounded log for debugging recent requests.

### 9.2 Explicit `SessionState` Schema

`SessionState` is the backend-owned source of truth for a conversation session. It is stored in memory for the MVP and loaded into LangGraph at the beginning of each turn. The frontend may receive a sanitized projection of this state, but it does not own or mutate the canonical session state.

Required top-level fields:

- `id`
  - Stable session identifier.

- `status`
  - One of active, completed, abandoned, or expired.

- `createdAt`
  - ISO timestamp for session creation.

- `updatedAt`
  - ISO timestamp for the last persisted session update.

- `lastActiveAt`
  - ISO timestamp for the last user or assistant activity.

- `mode`
  - Last active interaction mode: chat or voice.

- `messages`
  - Ordered list of message records for the session.

- `activeCartId`
  - Current cart identifier, or null when no cart exists.

- `cartVersion`
  - Monotonic version for the active cart, or null when no cart exists.
  - Used to detect stale cart mutations and prevent the agent from describing unconfirmed updates.

- `preferences`
  - Known durable ordering preferences inferred or confirmed during the session.

- `constraints`
  - Latest turn-level ordering constraints, including people count, budget, cuisine preferences, dietary requirements, spice preferences, exclusions, meal type, desired categories, restaurant constraints, and delivery expectations.

- `assumptions`
  - Explicit assumptions currently being used for planning, including serving size, budget allocation, substitutions, dietary interpretation, and multi-restaurant delivery behavior.

- `pendingClarification`
  - Current clarification question, expected answer type, and the graph reason for pausing, or null.

- `lastToolActivity`
  - Bounded summary of latest tool calls, standardized `ToolResult` success states, data payloads, errors, metadata sources, authoritative entity IDs, and cart mutation outcomes.

- `grounding`
  - Per-session cache of authoritative entities returned by tools during the current or recent turns.
  - Includes restaurant IDs, menu item IDs, cart item IDs, prices, availability flags, and source tool names.
  - Used only to validate agent references and cart mutations; it is not a substitute for fresh tool calls when data may be stale.

- `voice`
  - Last known voice preferences and transient speech metadata, such as requested voice output, voice profile, transcript confidence, and TTS status.

- `metadata`
  - Client timezone, locale, UI capability flags, development diagnostics, and request tracing metadata.

`SessionState` invariants:

- The backend session service is the only owner of canonical `SessionState`.
- LangGraph receives a copy or scoped view of `SessionState`; graph nodes must persist changes through backend services.
- Cart state is referenced by `activeCartId` and `cartVersion`; full cart records live in the cart store.
- `grounding` cannot introduce new restaurants, menu items, prices, or cart items. It can only record entities returned by successful tool results.
- Any cart mutation must verify the expected cart version or refresh the cart before applying changes.
- Session state must never contain payment details, real Swiggy order IDs, permanent voice recordings, or long-term order history in the MVP.

### 9.3 Session Record

Each session record contains:

- `id`
- `status`
  - Active, completed, abandoned, or expired.

- `createdAt`
- `updatedAt`
- `lastActiveAt`
- `mode`
  - Last used mode: chat or voice.

- `messages`
  - Ordered list of conversation messages.

- `activeCartId`
  - Current cart identifier or null.

- `cartVersion`
  - Current active cart version or null.

- `preferences`
  - People count.
  - Budget.
  - Cuisine preferences.
  - Dietary constraints.
  - Spice preferences.
  - Exclusions.
  - Desired meal type.
  - Delivery expectations.

- `assumptions`
  - Agent assumptions about serving size, budget allocation, substitutions, and dietary handling.

- `pendingClarification`
  - Current clarification question and expected answer type, if any.

- `lastToolActivity`
  - Summary of the latest tool calls for debugging and UI transparency.

- `grounding`
  - Authoritative entity references returned by tools and available for guardrail checks.

- `voice`
  - Last known voice preference and transient voice metadata.

- `metadata`
  - Client timezone, locale, and development diagnostics.

### 9.4 Message Record

Each message contains:

- `id`
- `sessionId`
- `role`
  - User, assistant, system, or tool-summary.

- `content`
- `inputMode`
  - Chat, voice, or system.

- `createdAt`
- `audio`
  - Optional transcript confidence, audio URL, TTS status, or provider metadata.

- `metadata`
  - Intent, warnings, or UI annotations.

### 9.5 What Does Not Live In Memory

The MVP does not store:

- User accounts.
- Payment details.
- Real addresses.
- Real order IDs.
- Real Swiggy cart IDs.
- Long-term order history.
- Permanent voice recordings.
- MongoDB documents.

## 10. Multi-Restaurant Cart Design

The cart must support items from multiple restaurants while preserving per-restaurant totals and delivery estimates.

### 10.1 Cart Structure

Top-level cart:

- `id`
- `sessionId`
- `status`
- `source`
- `currency`
- `peopleCount`
- `restaurantGroups`
- `grandSubtotal`
- `estimatedFees`
- `grandTotal`
- `deliverySummary`
- `preferenceCoverage`
- `assumptions`
- `warnings`
- `createdAt`
- `updatedAt`

Restaurant group:

- `restaurantId`
- `restaurantName`
- `restaurantAvailability`
- `cuisines`
- `items`
- `restaurantSubtotal`
- `deliveryEstimateMinutes`
- `deliveryFeeEstimate`
- `groupWarnings`

Item:

- `cartItemId`
- `menuItemId`
- `name`
- `quantity`
- `unitPrice`
- `itemSubtotal`
- `dietType`
- `spiceLevel`
- `servingEstimate`
- `customizations`
- `notes`
- `availabilityStatus`

### 10.2 Totals

The cart service is responsible for totals.

Required calculations:

- Item subtotal equals quantity multiplied by unit price.
- Restaurant subtotal equals the sum of item subtotals within that restaurant group.
- Grand subtotal equals the sum of all restaurant subtotals.
- Estimated fees may include mock delivery fees, platform fees, or taxes if modeled.
- Grand total equals grand subtotal plus estimated fees.

The agent must use `summarizeCart()` for authoritative totals.

### 10.3 Delivery Estimates

Each restaurant group has its own delivery estimate.

Cart-level delivery summary includes:

- `perRestaurant`
  - Restaurant ID, restaurant name, minimum minutes, maximum minutes, and delivery fee estimate.

- `overallEstimate`
  - Minimum and maximum delivery estimate for the full cart.
  - For multi-restaurant carts, this should be the broadest expected window, not a single precise promise.

- `warnings`
  - Notes that multiple restaurants may arrive separately.
  - Notes that delivery estimates are mock values in MVP.

### 10.4 Multi-Restaurant Rules

Rules:

- Items are grouped by `restaurantId`.
- A cart can contain one or more restaurant groups.
- Removing the last item from a group removes the group.
- The same menu item can appear once per restaurant group with quantity, unless customizations differ.
- If customizations differ, separate cart item rows are allowed.
- The agent must clearly explain when a plan spans multiple restaurants.
- The cart UI must not imply the mock cart is a single real checkout.

## 11. Future Swiggy MCP Migration Plan

### 11.1 Migration Goal

The future Swiggy MCP integration should replace mock data and mock cart operations behind the tool layer. The frontend API and LangGraph orchestration should remain stable.

### 11.2 Stable Contracts

These contracts should remain stable:

- Frontend API contracts.
- Session state shape visible to the frontend.
- Agent graph node responsibilities.
- Tool names.
- Tool input and output schemas.
- Cart schema at the application level.

### 11.3 Tool Replacement Strategy

MVP tool mapping:

- `searchRestaurants()` -> `MockRestaurantService.searchRestaurants()`
- `getRestaurant()` -> `MockRestaurantService.getRestaurant()`
- `getMenu()` -> `MockMenuService.getMenu()`
- `createCart()` -> `CartService.createCart()` using mock menu items
- `updateCart()` -> `CartService.updateCart()` using mock menu items
- `getCart()` -> `CartService.getCart()`
- `summarizeCart()` -> `CartService.summarizeCart()`

Future Swiggy MCP mapping:

- `searchRestaurants()` -> Swiggy MCP restaurant search tool.
- `getRestaurant()` -> Swiggy MCP restaurant details tool.
- `getMenu()` -> Swiggy MCP menu retrieval tool.
- `createCart()` -> Swiggy MCP cart creation tool plus local session mirror.
- `updateCart()` -> Swiggy MCP cart update tool plus local session mirror.
- `getCart()` -> Swiggy MCP cart retrieval tool plus local session mirror.
- `summarizeCart()` -> Swiggy MCP cart pricing or local normalized summary from provider response.

### 11.4 Adapter Layer

Introduce provider adapters behind tool implementations:

- `MockFoodProviderAdapter`
  - Reads normalized mock data through services.
  - Used in MVP.

- `SwiggyMcpFoodProviderAdapter`
  - Calls Swiggy MCP tools.
  - Used in future integration.

- `FoodProviderAdapter`
  - Stable internal provider contract used by tools.

The agent calls FeastPilot tools. FeastPilot tools call the active provider adapter. This keeps the agent insulated from provider-specific details.

### 11.5 Frontend Stability

The frontend should not change during MCP migration because:

- It already receives normalized restaurants, menus, cart groups, totals, warnings, and assistant messages.
- It does not know whether data is mock or live.
- It does not call provider APIs directly.
- It does not own cart mutation logic.

Small frontend changes may be needed only for future real-ordering flows, such as address selection, payment confirmation, and order tracking.

### 11.6 Agent Stability

The agent should not need structural graph changes because:

- It already uses tools for all external actions.
- Tool names remain stable.
- Tool schemas remain stable.
- Provider-specific fields are normalized before reaching the agent.

Prompt updates may be needed to enable real ordering, including:

- Strong confirmation before real cart creation.
- Strong confirmation before order placement.
- Price and availability revalidation.
- Address and delivery instruction handling.
- Payment boundary handling.

### 11.7 Session Storage Evolution

MVP:

- In-memory session state.

Future:

- Durable session storage may be added with MongoDB Atlas or another database.
- The `SessionService` interface should remain stable.
- Routes and agent logic should continue calling `SessionService`, not database APIs directly.

### 11.8 Migration Phases

Phase 1: MVP mock architecture

- Mock restaurant and menu tools.
- In-memory sessions.
- Multi-restaurant mock cart.
- Voice and chat modes.

Phase 2: Provider adapter preparation

- Formalize provider adapter interfaces.
- Add feature flags for provider selection.
- Keep mock provider as default.

Phase 3: Read-only Swiggy MCP integration

- Replace restaurant search and menu retrieval tools with MCP-backed adapters.
- Keep cart operations mock until live cart behavior is validated.

Phase 4: Cart MCP integration

- Enable Swiggy cart creation and update through MCP.
- Keep explicit user confirmation.
- Mirror provider cart state into FeastPilot cart schema.

Phase 5: Ordering and tracking

- Add address, payment, order placement, and tracking workflows.
- Add stricter confirmation and audit logging.
- Add durable persistence.

## 12. MVP Architecture Constraints

The following constraints are mandatory for the MVP:

- No MongoDB.
- No Swiggy MCP.
- No real order placement.
- No real payment flow.
- No persistent session storage.
- Voice mode and chat mode must both be supported.
- Multiple restaurants must be allowed in a cart.
- Mock data must be accessed only through backend services and tools.
- The agent must only communicate through tools for data and cart operations.
- The agent must never directly read JSON files.
- The frontend must remain provider-agnostic.
