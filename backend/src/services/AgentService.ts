export class AgentService {
  async handleMessage(
    sessionId: string,
    message: string
  ): Promise<{ response: string }> {
    return {
      response: `Agent service is active. Received: ${message}`,
    };
  }
}

export const agentService = new AgentService();
