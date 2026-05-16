import { Request, Response, NextFunction } from "express";
import { authenticateRequest, TokenPayload } from "../services/auth.js";

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await authenticateRequest(req.headers.authorization);
    req.user = user;
    next();
  } catch (error) {
    res
      .status(401)
      .json({ error: "Unauthorized", message: (error as Error).message });
  }
}

export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  authenticateRequest(authHeader)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch(() => {
      next();
    });
}
