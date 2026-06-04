# FeastPilot Project Specification

## 1. Project Overview

**Project Name:** FeastPilot

**Vision:** FeastPilot is a voice-first conversational food ordering agent that helps users plan food orders for groups through natural language conversations.

FeastPilot should feel like a helpful food-ordering copilot: users can speak naturally, describe who they are ordering for, mention preferences or constraints, compare options, build a cart, revise it, and hear clear spoken confirmations. The MVP focuses on proving the conversational and agentic ordering experience using mock restaurant and menu data, without connecting to Swiggy MCP yet.

## 2. Product Goals

### MVP Goals

- Support voice input for user requests.
- Support voice output for assistant responses.
- Enable conversational food ordering through natural language.
- Establish an agent architecture suitable for future tool integrations.
- Use mock restaurant data.
- Use mock menu data.
- Support cart planning and cart revision.
- Avoid Swiggy MCP integration in the MVP.

### Future Goals

- Integrate with Swiggy MCP.
- Search restaurants using real provider data.
- Retrieve restaurant menus dynamically.
- Create carts through provider APIs.
- Place food orders.
- Track order status after placement.

## 3. Target Users

FeastPilot is designed for users ordering food for themselves or groups, especially when the order requires coordination across multiple preferences.

Examples:

- A family ordering dinner with dietary constraints.
- Friends planning a shared delivery order.
- Office teams ordering lunch.
- A user who wants to speak instead of browsing restaurant menus manually.

## 4. Core User Experience

The MVP experience should prioritize a natural voice conversation:

1. The user starts a session and speaks a request.
2. ElevenLabs STT converts the user's speech to text.
3. The backend sends the message and session context to the FeastPilot agent.
4. The agent interprets the request, checks mock restaurant and menu data, and updates a proposed cart.
5. The frontend displays the conversation and cart state.
6. The assistant responds with concise natural language.
7. ElevenLabs TTS converts the assistant response into speech.
8. The user can refine the order by speaking follow-up requests.

Example user request:

> "We are four people. Two vegetarians, one person wants something spicy, and we need enough food for dinner under 1200 rupees."

Example assistant behavior:

> "I found a balanced dinner plan from a mock North Indian restaurant: paneer tikka, dal makhani, veg biryani, two butter naans, and one spicy chole side. The total is 1120 rupees. Would you like me to adjust the spice level or add drinks?"

## 5. MVP Scope

### In Scope

- Voice-to-text input through ElevenLabs STT.
- Text-to-voice responses through ElevenLabs TTS.
- Text chat fallback in the frontend.
- Conversational session state.
- Agent-driven planning using Kimi K2.6.
- Mock restaurant selection.
- Mock menu lookup.
- Cart creation in application state.
- Cart editing through conversation.
- Group preference handling.
- Dietary preference handling.
- Budget-aware suggestions.
- Basic confirmation flow before finalizing a mock cart.

### Out of Scope

- Swiggy MCP integration.
- Live restaurant search.
- Live menu retrieval.
- Real cart creation on Swiggy.
- Real payment handling.
- Real order placement.
- Real delivery tracking.
- Production-grade personalization.
- User authentication unless needed for session persistence.

## 6. Functional Requirements

### 6.1 Voice Input

- The frontend must allow users to record spoken requests.
- Recorded audio must be sent to the backend or directly to ElevenLabs STT, depending on the final implementation choice.
- The transcribed text must be added to the conversation as a user message.
- The user must be able to correct or retry failed transcriptions.

### 6.2 Voice Output

- Assistant responses must be converted to speech using ElevenLabs TTS.
- The frontend must play assistant audio responses automatically or through a clear playback control.
- Users should be able to mute, replay, or skip voice output.
- Text responses must remain visible even when audio playback fails.

### 6.3 Conversational Ordering

- Users must be able to describe food needs in natural language.
- The assistant must ask clarifying questions when important details are missing.
- The assistant must preserve context across turns in a session.
- The assistant must support revisions such as:
  - Add an item.
  - Remove an item.
  - Replace an item.
  - Increase or decrease quantity.
  - Adjust budget.
  - Handle dietary preferences.
  - Plan for more or fewer people.

### 6.4 Agent Architecture

- The backend must expose an agent endpoint for conversational turns.
- LangGraph should be used to model the agent workflow.
- The agent should separate reasoning steps from data access and cart operations.
- The MVP agent should use mock tools for:
  - Restaurant lookup.
  - Menu lookup.
  - Cart planning.
  - Cart update.
  - Cart summary.
- The architecture should make it straightforward to replace mock tools with Swiggy MCP tools later.

### 6.5 Mock Restaurant Data

- The MVP must include a representative mock restaurant dataset.
- Restaurant records should include:
  - Restaurant ID.
  - Name.
  - Cuisine type.
  - Rating.
  - Price range.
  - Delivery estimate.
  - Availability status.
  - Tags such as vegetarian-friendly, spicy, family meals, desserts, or budget.

### 6.6 Mock Menu Data

- The MVP must include mock menus linked to mock restaurants.
- Menu item records should include:
  - Item ID.
  - Restaurant ID.
  - Name.
  - Description.
  - Price.
  - Category.
  - Vegetarian or non-vegetarian marker.
  - Spice level.
  - Serving estimate.
  - Availability status.
  - Tags such as vegan, Jain, gluten-free, popular, beverage, dessert, or combo.

### 6.7 Cart Planning

- The agent must maintain a structured cart for the current session.
- Cart items should include:
  - Item ID.
  - Item name.
  - Restaurant ID.
  - Restaurant name.
  - Quantity.
  - Unit price.
  - Total item price.
  - Notes or customizations.
- The cart summary should include:
  - Subtotal.
  - Estimated taxes and fees if modeled.
  - Estimated total.
  - Number of people served.
  - Preference coverage.
  - Any unresolved assumptions.

## 7. Non-Functional Requirements

### Performance

- Voice transcription and agent responses should feel interactive.
- The UI should show clear loading states during transcription, reasoning, and speech generation.
- The agent should avoid overly long responses unless the user asks for detailed explanation.

### Reliability

- Failed STT requests should not lose the recorded user interaction.
- Failed TTS requests should fall back to visible text.
- Agent errors should produce recoverable messages instead of broken sessions.
- Mock data should be deterministic enough for repeatable testing.

### Privacy

- Voice recordings should only be retained when necessary.
- Sensitive user data should not be logged unnecessarily.
- Environment variables must be used for API keys.

### Accessibility

- Text chat must be available as a fallback to voice.
- Audio controls must be keyboard accessible.
- Conversation and cart state should be readable without relying only on audio.

## 8. Recommended Architecture

### Frontend

Tech stack:

- React
- TypeScript
- Tailwind
- Shadcn

Primary responsibilities:

- Capture microphone input.
- Display conversation history.
- Display live transcription state.
- Display structured cart state.
- Play assistant voice output.
- Provide fallback text input.
- Provide controls for retrying, muting, and editing.

Suggested main UI areas:

- Conversation panel.
- Voice control bar.
- Cart summary panel.
- Restaurant/menu suggestion area.
- Session status indicators.

### Backend

Tech stack:

- Express
- LangGraph

Primary responsibilities:

- Accept user conversational turns.
- Coordinate STT and TTS if handled server-side.
- Run the LangGraph agent.
- Manage session state.
- Serve mock restaurant and menu data.
- Maintain cart state.
- Return assistant text, audio metadata, and structured cart updates.

Suggested backend modules:

- API routes.
- Agent graph.
- Mock data service.
- Cart service.
- Voice service.
- Session service.
- Configuration and environment handling.

### AI Layer

Model:

- Kimi K2.6

Primary responsibilities:

- Interpret user intent.
- Extract ordering constraints.
- Decide when to ask clarifying questions.
- Select mock restaurants and menu items.
- Generate cart plans.
- Summarize recommendations naturally.
- Use tools rather than inventing unavailable menu data.

### Voice Layer

Provider:

- ElevenLabs STT
- ElevenLabs TTS

Primary responsibilities:

- Convert user speech to text.
- Convert assistant text to speech.
- Handle retries and fallback behavior.
- Support configurable voice settings.

### Database

Provider:

- MongoDB Atlas

Likely collections:

- `sessions`
- `messages`
- `restaurants`
- `menu_items`
- `carts`

For the MVP, mock data may be stored in code, JSON files, seed scripts, or MongoDB Atlas depending on implementation needs. If MongoDB Atlas is used during MVP, seed data should be clearly separated from future live provider data.

## 9. Agent Workflow

The LangGraph workflow should be designed around explicit state transitions.

Suggested graph nodes:

1. **Receive User Message**
   - Accept transcribed or typed user input.
   - Attach session context.

2. **Extract Intent And Constraints**
   - Identify number of people, cuisine preferences, dietary needs, budget, spice preferences, and requested changes.

3. **Determine Next Action**
   - Decide whether to ask a clarifying question, search mock data, update the cart, or summarize the current plan.

4. **Query Mock Restaurant Data**
   - Select candidate restaurants from the mock dataset.

5. **Query Mock Menu Data**
   - Select candidate menu items based on constraints.

6. **Plan Or Update Cart**
   - Build or revise the cart.

7. **Validate Cart**
   - Check budget, serving size, dietary constraints, and availability.

8. **Generate Assistant Response**
   - Produce concise conversational output.

9. **Persist Session State**
   - Save messages, cart, assumptions, and unresolved questions.

10. **Generate Voice Output**
   - Convert assistant response to speech when voice is enabled.

## 10. API Surface

The exact API can evolve, but the MVP should likely include endpoints similar to:

- `POST /api/voice/transcribe`
  - Accepts audio input and returns transcript text.

- `POST /api/conversation/message`
  - Accepts session ID and user message.
  - Returns assistant message, cart state, and next action.

- `POST /api/voice/synthesize`
  - Accepts assistant text and returns playable audio data or URL.

- `GET /api/sessions/:sessionId`
  - Returns session history and cart state.

- `POST /api/sessions`
  - Creates a new ordering session.

- `GET /api/mock/restaurants`
  - Returns mock restaurant data for development and testing.

- `GET /api/mock/menus/:restaurantId`
  - Returns mock menu data for a restaurant.

## 11. Data Model Draft

### Session

- `id`
- `createdAt`
- `updatedAt`
- `status`
- `messages`
- `cartId`
- `preferences`
- `assumptions`

### Message

- `id`
- `sessionId`
- `role`
- `content`
- `createdAt`
- `source`
- `audioUrl`
- `metadata`

### Restaurant

- `id`
- `name`
- `cuisine`
- `rating`
- `priceRange`
- `deliveryEstimateMinutes`
- `isAvailable`
- `tags`

### Menu Item

- `id`
- `restaurantId`
- `name`
- `description`
- `price`
- `category`
- `dietType`
- `spiceLevel`
- `servingEstimate`
- `isAvailable`
- `tags`

### Cart

- `id`
- `sessionId`
- `restaurantId`
- `items`
- `subtotal`
- `estimatedFees`
- `estimatedTotal`
- `peopleCount`
- `notes`
- `status`

## 12. Conversation Principles

FeastPilot should:

- Be concise in spoken responses.
- Confirm important changes.
- Ask only necessary clarifying questions.
- Avoid overwhelming users with too many options at once.
- Explain assumptions when planning for a group.
- Keep the cart visible and understandable.
- Avoid pretending to place real orders during the MVP.

FeastPilot should not:

- Claim that restaurants or prices are live during the MVP.
- Claim that an order has been placed.
- Invent unavailable menu items when mock tools return no match.
- Hide uncertainty about dietary restrictions or serving estimates.

## 13. MVP Acceptance Criteria

The MVP is complete when:

- A user can start a conversation.
- A user can speak a food-ordering request.
- The system can transcribe the voice request.
- The agent can interpret the request using session context.
- The agent can select from mock restaurants and mock menus.
- The agent can create and revise a structured cart.
- The assistant can respond with text and voice.
- The user can continue refining the cart over multiple turns.
- The app clearly communicates that ordering is mock-only.
- No Swiggy MCP integration is required or present.

## 14. Future Swiggy MCP Integration Plan

The MVP should be designed so mock tools can later be replaced by Swiggy MCP-backed tools.

Potential future tool mapping:

- Mock restaurant lookup -> Swiggy restaurant search.
- Mock menu lookup -> Swiggy menu retrieval.
- Mock cart planning -> Swiggy cart creation.
- Mock checkout confirmation -> Swiggy order placement.
- Mock order status -> Swiggy order tracking.

Before enabling real ordering, the system should add:

- Explicit user confirmation before cart creation.
- Explicit user confirmation before payment or order placement.
- Address selection.
- Delivery instructions.
- Payment flow integration.
- Error handling for unavailable items and restaurant changes.
- Real-time price and fee validation.

## 15. Risks And Open Questions

### Risks

- Voice latency may make the ordering flow feel slow.
- Group ordering can produce ambiguous requirements.
- Dietary preference handling must avoid overconfident claims.
- LLM responses may invent menu items unless constrained by tools.
- Future Swiggy MCP integration may require changes to data models and agent tools.

### Open Questions

- Should STT and TTS calls be handled by the frontend or backend?
- Should MongoDB Atlas be used in the MVP or introduced after the mock-data prototype?
- How much cart editing should be available manually in the UI versus only through conversation?
- Should the MVP support multiple restaurants in one cart, or constrain each cart to one restaurant?
- What latency target should be considered acceptable for voice conversations?

## 16. Implementation Guardrails

- Do not integrate Swiggy MCP during the MVP.
- Do not represent mock ordering as real ordering.
- Keep provider API keys in environment variables.
- Keep the agent tool interface stable enough for future real provider tools.
- Prefer structured state updates over free-form cart descriptions.
- Ensure all agent recommendations are grounded in available mock data.
- Preserve text fallback for every voice-first feature.

