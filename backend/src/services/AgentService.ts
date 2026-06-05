import { createInitialState } from "../agent/state/agentState";
import { plannerNode } from "../agent/nodes/plannerNode";
import { toolNode } from "../agent/nodes/toolNode";
import { responseNode } from "../agent/nodes/responseNode";

export class AgentService {
  async handleMessage(
    sessionId: string,
    message: string
  ): Promise<{ response: string }> {
    // 1. Initialise shared state for this conversation turn
    let state = createInitialState(sessionId, message);

    // 2. Execute nodes sequentially (future: replace with LangGraph graph.invoke)
    state = await plannerNode(state);
    state = await toolNode(state);
    state = await responseNode(state);

    // 3. Return the final agent response
    return { response: state.agentResponse };
  }
}

export const agentService = new AgentService();
