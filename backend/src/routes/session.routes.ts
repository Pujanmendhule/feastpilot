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

sessionRouter.post("/api/sessions", async (_req, res, next) => {
  try {
    const session = await sessionService.createSession();

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

sessionRouter.get("/api/sessions/:sessionId", async (req, res, next) => {
  try {
    const sessionId = normalizeSessionId(req.params.sessionId);

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
      return;
    }

    const session = await sessionService.getSession(sessionId);

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

sessionRouter.delete("/api/sessions/:sessionId", async (req, res, next) => {
  try {
    const sessionId = normalizeSessionId(req.params.sessionId);

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
      return;
    }

    const deleted = await sessionService.deleteSession(sessionId);

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

sessionRouter.post("/api/sessions/:sessionId/cart", async (req, res, next) => {
  try {
    const sessionId = normalizeSessionId(req.params.sessionId);

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
      return;
    }

    const { cartId } = req.body;

    if (!cartId || typeof cartId !== "string" || cartId.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "Cart ID is required",
      });
      return;
    }

    try {
      const session = await sessionService.attachCartToSession(sessionId, cartId);
      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Session not found")) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

