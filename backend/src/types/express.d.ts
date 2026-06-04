/**
 * Minimal Express typings for route modules until backend dependencies are added.
 */
declare module "express" {
  import type { RequestHandler } from "express-serve-static-core";

  export interface Request {
    params: Record<string, string>;
    query: Record<string, string | undefined>;
  }

  export interface Response {
    status(code: number): Response;
    json(body: unknown): void;
  }

  export interface IRouter {
    get(path: string, handler: RequestHandler): IRouter;
  }

  export interface Router extends IRouter {}

  export function Router(): Router;
}

declare module "express-serve-static-core" {
  export interface RequestHandler {
    (
      req: import("express").Request,
      res: import("express").Response,
      next?: () => void
    ): void | Promise<void>;
  }
}
