import { Router } from "express";
import { sessionService } from "../services/SessionService";

export const sessionRouter = Router();

function normalizeSessionId(raw: string | undefined): string | null {
  if (raw === undefined) {
    return null;
  }

  const sessionId = raw.trim();
  return sessionId.length > 0 ? sessionId : null;
}

sessionRouter.post("/api/sessions", (_req, res, next) => {
  try {
    const session = sessionService.createSession();

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

sessionRouter.get("/api/sessions/:sessionId", (req, res, next) => {
  try {
    const sessionId = normalizeSessionId(req.params.sessionId);

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
      return;
    }

    const session = sessionService.getSession(sessionId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: "Session not found",
      });
      return;
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

sessionRouter.delete("/api/sessions/:sessionId", (req, res, next) => {
  try {
    const sessionId = normalizeSessionId(req.params.sessionId);

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
      return;
    }

    const deleted = sessionService.deleteSession(sessionId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: "Session not found",
      });
      return;
    }

    res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
});
