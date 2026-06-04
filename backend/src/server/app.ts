import cors from "cors";
import express from "express";
import { healthRouter } from "../routes/health.routes";
import { errorHandler } from "./errors";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use(healthRouter);

  if (process.env.NODE_ENV === "development") {
    const { devRouter } =
      require("../routes/dev.routes") as typeof import("../routes/dev.routes");
    app.use(devRouter);
  }

  app.use(errorHandler);

  return app;
}
