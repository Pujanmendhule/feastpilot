import { createInitialState } from "../agent/state/agentState";
import { graph } from "../agent/graph";

export class AgentService {
  async handleMessage(
    sessionId: string,
    message: string
  ): Promise<{ response: string }> {
    // 1. Initialise shared state for this conversation turn
    const initialState = createInitialState(sessionId, message);

    // 2. Execute nodes via LangGraph (plannerNode → toolNode → responseNode)
    const finalState = await graph.invoke(initialState);

    // 3. Return the final agent response
    return { response: finalState.agentResponse };
  }
}

export const agentService = new AgentService();
