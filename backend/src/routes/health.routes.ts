import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
  });
});
