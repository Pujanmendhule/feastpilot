import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  console.error(err);

  if (res.headersSent) {
    return;
  }

  const message =
    err instanceof Error ? err.message : "Internal server error";

  res.status(500).json({
    success: false,
    error: message,
  });
};
