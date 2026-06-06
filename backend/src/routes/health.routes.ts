import { Router } from "express";
import { modelService } from "../services/models/ModelService";

export const healthRouter = Router();

healthRouter.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
    provider: modelService.getProviderType(),
  });
});
