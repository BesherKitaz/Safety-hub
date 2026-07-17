// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

type AuthTokenPayload = {
  userId: string;
  email: string;
  role: string;
};

export type AuthRequest<P = Record<string, string>> = Request<P> & {
  user?: AuthTokenPayload;
};

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, 'TOKEN_REQUIRED', 'No token provided'));
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new AppError(401, 'TOKEN_REQUIRED', 'No token provided'));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AuthTokenPayload;

    req.user = decoded;

    next();
  } catch {
    return next(new AppError(401, 'TOKEN_INVALID', 'Invalid or expired token'));
  }
};

