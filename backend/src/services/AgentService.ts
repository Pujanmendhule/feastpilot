import { createInitialState } from "../agent/state/agentState";
import { graph } from "../agent/graph";
import { prisma } from "../db/prisma";

export class AgentService {
  async handleMessage(
    sessionId: string,
    message: string
  ): Promise<{ response: string }> {
    // 1. Save user message to database
    await prisma.message.create({
      data: {
        sessionId,
        role: "user",
        content: message,
      },
    });

    // 2. Initialise shared state for this conversation turn
    const initialState = createInitialState(sessionId, message);

    // 3. Execute nodes via LangGraph (plannerNode → toolNode → responseNode)
    const finalState = await graph.invoke(initialState);

    // 4. Save assistant response to database
    await prisma.message.create({
      data: {
        sessionId,
        role: "assistant",
        content: finalState.agentResponse,
      },
    });

    // 5. Return the final agent response
    return { response: finalState.agentResponse };
  }
}

export const agentService = new AgentService();
