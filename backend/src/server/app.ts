import cors from "cors";
import express from "express";
import { healthRouter } from "../routes/health.routes";
import { sessionRouter } from "../routes/session.routes";
import { conversationRouter } from "../routes/conversation.routes";
import { cartRouter } from "../routes/cart.routes";
import { errorHandler } from "./errors";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use(healthRouter);
  app.use(sessionRouter);
  app.use(conversationRouter);
  app.use(cartRouter);


  if (process.env.NODE_ENV === "development") {
    const { devRouter } =
      require("../routes/dev.routes") as typeof import("../routes/dev.routes");
    app.use(devRouter);
  }

  app.use(errorHandler);

  return app;
}
