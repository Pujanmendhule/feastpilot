import { Router } from "express";
import { sessionService } from "../services/SessionService";

export const conversationRouter = Router();

conversationRouter.post("/api/conversation", (req, res, next) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || typeof sessionId !== "string" || sessionId.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
      return;
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "Message is required",
      });
      return;
    }

    const session = sessionService.getSession(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: `Session not found: ${sessionId}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        response: "Conversation endpoint is active.",
        sessionId: sessionId,
      },
    });
  } catch (error) {
    next(error);
  }
});
